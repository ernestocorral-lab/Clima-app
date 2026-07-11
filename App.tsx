import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
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
import { WidgetChartType } from './utils/widgetChartData';
import { MetricScrollTarget } from './utils/weatherMetrics';
import { parseWidgetDeepLink } from './utils/widgetDeepLink';
import { t } from './i18n';
import { getMyLocationTitle } from './utils/formatCity';
import { getRefreshIntervalMs } from './storage/appSettings';
import { isDataStale } from './utils/dataStaleness';
import { hapticLight, hapticSuccess } from './utils/haptics';
import { colors, fontFamily, radii, spacing, typography } from './theme';
import { useAppFonts } from './hooks/useAppFonts';

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
  onSelect,
}: {
  locations: LocationResult[];
  onSelect: (location: LocationResult) => void;
}) {
  const rows = [locations.slice(0, 2), locations.slice(2, 4)];

  return (
    <View style={styles.grid}>
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
  const { fontsLoaded } = useAppFonts();
  const [savedCities, setSavedCities] = useState<SavedCity[]>(DEFAULT_CITIES);
  const [locations, setLocations] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [widgetsVisible, setWidgetsVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const [initialScrollTarget, setInitialScrollTarget] = useState<MetricScrollTarget | null>(null);
  const locationsRef = useRef<LocationResult[]>([]);
  const savedCitiesRef = useRef(savedCities);
  const pendingWidgetOpenRef = useRef<{ cityId: string; chartType: WidgetChartType } | null>(null);

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
      if (allFailed) {
        setGlobalError(t('errors.allForecastsFailed'));
      }
    } catch {
      const placeholders = await buildPlaceholderLocations(cities);
      if (placeholders.some((location) => location.weather !== null)) {
        setLocations(placeholders);
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
    hapticSuccess();
    await loadAllWeather(cities, { refresh: true });
  };

  const handleRefresh = useCallback(() => {
    hapticLight();
    void loadAllWeather(savedCities, { refresh: true });
  }, [loadAllWeather, savedCities]);

  const openDetail = (location: LocationResult) => {
    if (location.weather) {
      setInitialScrollTarget(null);
      setSelectedLocation(location);
    }
  };

  const openDetailFromWidget = useCallback((cityId: string, chartType: WidgetChartType) => {
    const location = locationsRef.current.find((entry) => entry.id === cityId);
    if (!location?.weather) {
      pendingWidgetOpenRef.current = { cityId, chartType };
      return;
    }

    setWidgetsVisible(false);
    setInitialScrollTarget(chartType);
    setSelectedLocation(location);
    hapticLight();
  }, []);

  useEffect(() => {
    const pending = pendingWidgetOpenRef.current;
    if (!pending) {
      return;
    }

    const location = locations.find((entry) => entry.id === pending.cityId);
    if (!location?.weather) {
      return;
    }

    pendingWidgetOpenRef.current = null;
    setWidgetsVisible(false);
    setInitialScrollTarget(pending.chartType);
    setSelectedLocation(location);
  }, [locations]);

  useEffect(() => {
    const handleDeepLink = (url: string | null) => {
      const parsed = parseWidgetDeepLink(url);
      if (!parsed) {
        return;
      }
      openDetailFromWidget(parsed.cityId, parsed.chartType);
    };

    void Linking.getInitialURL().then(handleDeepLink);
    const subscription = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    return () => subscription.remove();
  }, [openDetailFromWidget]);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text
            style={styles.title}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
          >
            {t('app.title')}
          </Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.headerButton} onPress={() => setWidgetsVisible(true)}>
              <Text style={styles.headerButtonText} numberOfLines={1}>
                {t('app.widgets')}
              </Text>
            </Pressable>
            <Pressable style={styles.headerButton} onPress={() => setEditorVisible(true)}>
              <Text style={styles.headerButtonText} numberOfLines={1}>
                {t('app.cities')}
              </Text>
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

      {loading || !fontsLoaded ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.textPrimary} />
          <Text style={styles.helperText}>{t('app.loading')}</Text>
        </View>
      ) : (
        <View style={styles.main}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            scrollEnabled={Boolean(globalError)}
            overScrollMode="always"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.textPrimary}
                colors={[colors.accent]}
                progressBackgroundColor={colors.surfaceElevated}
              />
            }
          >
            {globalError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{globalError}</Text>
              </View>
            )}

            <View style={styles.gridWrap}>
              {locations.length === 4 && (
                <CityGrid
                  locations={locations}
                  onSelect={(location) => openDetail(location)}
                />
              )}
            </View>
          </ScrollView>

          <Pressable style={styles.refreshButton} onPress={handleRefresh} disabled={refreshing}>
            <Text style={styles.buttonText}>
              {refreshing ? t('app.loading') : t('app.refresh')}
            </Text>
          </Pressable>
        </View>
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
        onSelectWidget={openDetailFromWidget}
      />

      <WeatherDetailModal
        locationId={selectedLocation?.id ?? ''}
        visible={selectedLocation !== null}
        title={selectedLocation?.title ?? ''}
        subtitle={selectedLocation?.subtitle}
        weather={selectedLocation?.weather ?? null}
        fetchedAt={selectedLocation?.fetchedAt}
        fromCache={selectedLocation?.fromCache}
        initialScrollTarget={initialScrollTarget}
        onClose={() => {
          setSelectedLocation(null);
          setInitialScrollTarget(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.screen,
    paddingTop: 30,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  header: {
    marginBottom: 0,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 3,
    flexShrink: 0,
  },
  headerButton: {
    backgroundColor: colors.surfaceInset,
    borderRadius: radii.sm,
    paddingHorizontal: 5,
    paddingVertical: 6,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  headerButtonText: {
    color: colors.accent,
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    lineHeight: 13,
    includeFontPadding: false,
    textAlign: 'center',
    flexShrink: 0,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
    fontSize: 23,
    lineHeight: 26,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  subtitle: {
    color: colors.textMuted,
    ...typography.appSubtitle,
    fontSize: 12,
    lineHeight: 15,
    alignSelf: 'stretch',
    marginHorizontal: 4,
    marginBottom: 4,
    textAlign: 'center',
  },
  main: {
    flex: 1,
    minHeight: 0,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    flexGrow: 1,
  },
  gridWrap: {
    flex: 1,
    minHeight: 0,
  },
  grid: {
    flex: 1,
    gap: 10,
    minHeight: 0,
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
    color: colors.textSecondary,
    ...typography.body,
  },
  errorBox: {
    backgroundColor: colors.surfaceInset,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.errorText,
    ...typography.bodySmall,
  },
  refreshButton: {
    alignSelf: 'center',
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginTop: 4,
    minHeight: 40,
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.textOnAccent,
    ...typography.button,
  },
});
