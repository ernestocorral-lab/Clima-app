import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { CityEditorModal } from './components/CityEditorModal';
import { CitySummaryTile } from './components/CitySummaryTile';
import { WeatherDetailModal } from './components/WeatherDetailModal';
import { WidgetSettingsModal } from './components/WidgetSettingsModal';
import {
  fetchWeather,
  fetchWeatherForSavedCity,
  WeatherData,
} from './services/weather';
import { getSavedCities, saveSavedCities } from './storage/savedCities';
import { getCachedWeather, saveCachedWeather } from './storage/weatherCache';
import { DEFAULT_CITIES, SavedCity } from './types/city';

import { LocationResult } from './types/location';
import { t } from './i18n';
import { getMyLocationTitle } from './utils/formatCity';
import { getRefreshIntervalMs } from './storage/appSettings';
import { isDataStale } from './utils/dataStaleness';

const LOCATION_MAX_AGE_MS = 10 * 60 * 1000;

function cachedToLocationResult(cached: Awaited<ReturnType<typeof getCachedWeather>>): LocationResult | null {
  if (!cached) {
    return null;
  }

  return {
    id: cached.id,
    title: cached.title,
    subtitle: cached.subtitle,
    weather: cached.weather,
    error: null,
    fetchedAt: cached.fetchedAt,
    fromCache: true,
  };
}

async function loadCurrentLocationWeather(): Promise<LocationResult> {
  const base = {
    id: 'current',
    title: getMyLocationTitle(),
  };

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return (
      cachedToLocationResult(await getCachedWeather('current')) ?? {
        ...base,
        weather: null,
        error: t('errors.locationDenied'),
      }
    );
  }

  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    return (
      cachedToLocationResult(await getCachedWeather('current')) ?? {
        ...base,
        weather: null,
        error: t('errors.gpsDisabled'),
      }
    );
  }

  try {
    const position = await resolveDevicePosition();
    const weather = await fetchWeather(
      position.coords.latitude,
      position.coords.longitude,
    );
    const fetchedAt = new Date().toISOString();

    await saveCachedWeather({
      id: 'current',
      title: base.title,
      subtitle: weather.city,
      weather,
      fetchedAt,
    });

    return {
      ...base,
      subtitle: weather.city,
      weather,
      error: null,
      fetchedAt,
      fromCache: false,
    };
  } catch (err) {
    const cached = cachedToLocationResult(await getCachedWeather('current'));
    if (cached) {
      return cached;
    }

    return {
      ...base,
      weather: null,
      error:
        err instanceof Error
          ? err.message
          : t('errors.locationFailed'),
    };
  }
}

async function loadSavedCityWeather(city: SavedCity): Promise<LocationResult> {
  const base = {
    id: city.id,
    title: city.label,
  };

  try {
    const weather = await fetchWeatherForSavedCity(city);
    const fetchedAt = new Date().toISOString();

    await saveCachedWeather({
      id: city.id,
      title: city.label,
      subtitle: weather.city,
      weather,
      fetchedAt,
    });

    return {
      ...base,
      subtitle: weather.city,
      weather,
      error: null,
      fetchedAt,
      fromCache: false,
    };
  } catch (err) {
    const cached = cachedToLocationResult(await getCachedWeather(city.id));
    if (cached) {
      return cached;
    }

    return {
      ...base,
      weather: null,
      error:
        err instanceof Error
          ? err.message
          : t('errors.forecastFailed'),
    };
  }
}

async function buildPlaceholderLocations(cities: SavedCity[]): Promise<LocationResult[]> {
  const cachedEntries = await Promise.all([
    getCachedWeather('current'),
    ...cities.map((city) => getCachedWeather(city.id)),
  ]);

  return [
    cachedToLocationResult(cachedEntries[0]) ?? {
      id: 'current',
      title: getMyLocationTitle(),
      weather: null,
      error: null,
    },
    ...cities.map((city, index) =>
      cachedToLocationResult(cachedEntries[index + 1]) ?? {
        id: city.id,
        title: city.label,
        weather: null,
        error: null,
      },
    ),
  ];
}

async function resolveDevicePosition(): Promise<Location.LocationObject> {
  const lastKnown = await Location.getLastKnownPositionAsync();
  if (lastKnown && Date.now() - lastKnown.timestamp < LOCATION_MAX_AGE_MS) {
    return lastKnown;
  }

  return Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
}

function CityGrid({
  locations,
  minHeight,
  onSelect,
}: {
  locations: LocationResult[];
  minHeight: number;
  onSelect: (location: LocationResult) => void;
}) {
  const rows = [locations.slice(0, 2), locations.slice(2, 4)];

  return (
    <View style={[styles.grid, { minHeight }]}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.gridRow}>
          {row.map((location) => (
            <CitySummaryTile
              key={location.id}
              locationId={location.id}
              title={location.title}
              subtitle={location.subtitle}
              weather={location.weather}
              error={location.error}
              fetchedAt={location.fetchedAt}
              fromCache={location.fromCache}
              onPress={() => onSelect(location)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export default function App() {
  const { height: windowHeight } = useWindowDimensions();
  const gridMinHeight = Math.max(420, windowHeight - 230);
  const [savedCities, setSavedCities] = useState<SavedCity[]>(DEFAULT_CITIES);
  const [locations, setLocations] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [widgetsVisible, setWidgetsVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const locationsRef = useRef<LocationResult[]>([]);
  const savedCitiesRef = useRef(savedCities);

  useEffect(() => {
    locationsRef.current = locations;
  }, [locations]);

  useEffect(() => {
    savedCitiesRef.current = savedCities;
  }, [savedCities]);

  const loadAllWeather = useCallback(async (cities: SavedCity[], options?: { refresh?: boolean }) => {
    const isRefresh = options?.refresh ?? false;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
      const placeholders = await buildPlaceholderLocations(cities);
      const hasCachedData = placeholders.some((location) => location.weather !== null);
      if (hasCachedData) {
        setLocations(placeholders);
        setLoading(false);
      }
    }
    setGlobalError(null);

    try {
      const results = await Promise.all([
        loadCurrentLocationWeather(),
        ...cities.map((city) => loadSavedCityWeather(city)),
      ]);

      setLocations(results);
      const { saveSnapshotsFromLocations, refreshTemperatureWidgets } = await import(
        './widgets/syncTemperatureWidget'
      );
      await saveSnapshotsFromLocations(results);
      await refreshTemperatureWidgets();

      const allFailed = results.every((result) => !result.weather);
      const anyOffline = results.some((result) => result.fromCache);
      if (allFailed) {
        setGlobalError(t('errors.allForecastsFailed'));
      } else if (anyOffline) {
        setGlobalError(t('errors.offlineUsingCache'));
      }
    } catch {
      const placeholders = await buildPlaceholderLocations(cities);
      if (placeholders.some((location) => location.weather !== null)) {
        setLocations(placeholders);
        setGlobalError(t('errors.offlineUsingCache'));
      } else {
        setGlobalError(t('errors.loadFailed'));
      }
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const cities = await getSavedCities();
      setSavedCities(cities);
      await loadAllWeather(cities);
    })();
  }, [loadAllWeather]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        return;
      }

      void (async () => {
        const staleAfterMs = await getRefreshIntervalMs();
        const hasStaleData = locationsRef.current.some((location) =>
          isDataStale(location.fetchedAt, staleAfterMs),
        );

        if (hasStaleData) {
          await loadAllWeather(savedCitiesRef.current, { refresh: true });
        } else {
          const { refreshTemperatureWidgets } = await import('./widgets/syncTemperatureWidget');
          await refreshTemperatureWidgets();
        }
      })();
    });

    return () => subscription.remove();
  }, [loadAllWeather]);

  const handleSaveCities = async (cities: SavedCity[]) => {
    await saveSavedCities(cities);
    setSavedCities(cities);
    setSelectedLocation(null);
    await loadAllWeather(cities, { refresh: true });
  };

  const handleRefresh = useCallback(() => {
    void loadAllWeather(savedCities, { refresh: true });
  }, [loadAllWeather, savedCities]);

  const openDetail = (location: LocationResult) => {
    if (location.weather) {
      setSelectedLocation(location);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text
            style={styles.title}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {t('app.title')}
          </Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.headerButton} onPress={() => setWidgetsVisible(true)}>
              <Text style={styles.headerButtonText}>{t('app.widgets')}</Text>
            </Pressable>
            <Pressable style={styles.headerButton} onPress={() => setEditorVisible(true)}>
              <Text style={styles.headerButtonText}>{t('app.cities')}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Text
        style={styles.subtitle}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {t('app.subtitle')}
      </Text>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.helperText}>{t('app.loading')}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FFFFFF"
              colors={['#3D7BFF']}
              progressBackgroundColor="#16325F"
            />
          }
        >
          {globalError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{globalError}</Text>
            </View>
          )}

          {locations.length === 4 && (
            <CityGrid
              locations={locations}
              minHeight={gridMinHeight}
              onSelect={(location) => openDetail(location)}
            />
          )}

          <Pressable style={styles.refreshButton} onPress={handleRefresh}>
            <Text style={styles.buttonText}>{t('app.refresh')}</Text>
          </Pressable>
        </ScrollView>
      )}

      <CityEditorModal
        visible={editorVisible}
        cities={savedCities}
        onClose={() => setEditorVisible(false)}
        onSave={(cities) => void handleSaveCities(cities)}
      />

      <WidgetSettingsModal
        visible={widgetsVisible}
        onClose={() => setWidgetsVisible(false)}
      />

      <WeatherDetailModal
        locationId={selectedLocation?.id ?? ''}
        visible={selectedLocation !== null}
        title={selectedLocation?.title ?? ''}
        subtitle={selectedLocation?.subtitle}
        weather={selectedLocation?.weather ?? null}
        fetchedAt={selectedLocation?.fetchedAt}
        fromCache={selectedLocation?.fromCache}
        onClose={() => setSelectedLocation(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0B1D3A',
    paddingTop: 52,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  header: {
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  headerButton: {
    backgroundColor: '#1A2F57',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  headerButtonText: {
    color: '#3D7BFF',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    paddingRight: 8,
  },
  subtitle: {
    color: '#9BB4DE',
    fontSize: 15,
    alignSelf: 'stretch',
    marginHorizontal: 6,
    marginBottom: 10,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 4,
  },
  grid: {
    flex: 1,
    gap: 10,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  helperText: {
    color: '#C7D7F2',
    fontSize: 16,
  },
  errorBox: {
    backgroundColor: '#1A2F57',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  errorText: {
    color: '#FFD1D1',
    fontSize: 14,
    lineHeight: 20,
  },
  refreshButton: {
    alignSelf: 'center',
    backgroundColor: '#3D7BFF',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
