import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { getCityLayout, saveCityLayout } from './storage/cityLayout';
import { getCachedWeather, saveCachedWeather } from './storage/weatherCache';
import { DEFAULT_CITIES, SavedCity } from './types/city';
import { buildDefaultCityLayout, CityLayoutItem } from './types/cityLayout';

import { LocationResult } from './types/location';
import { getVisibleLocations, orderLocationsByLayout } from './utils/cityLayout';
import { WidgetChartType } from './utils/widgetChartData';
import { MetricScrollTarget } from './utils/weatherMetrics';
import { parseWidgetDeepLink } from './utils/widgetDeepLink';
import { t } from './i18n';
import { getMyLocationTitle, shortCityName } from './utils/formatCity';
import { getRefreshIntervalMs } from './storage/appSettings';
import { isDataStale } from './utils/dataStaleness';
import { hapticLight, hapticSuccess } from './utils/haptics';
import { colors, fontFamily, radii, spacing, typography } from './theme';
import { useAppFonts } from './hooks/useAppFonts';
import { HEADER_BUTTON_LAYOUT } from './utils/headerButtonLayout';

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

async function resolveDevicePosition(): Promise<Location.LocationObject> {
  const lastKnown = await Location.getLastKnownPositionAsync();
  if (lastKnown && Date.now() - lastKnown.timestamp < LOCATION_MAX_AGE_MS) {
    return lastKnown;
  }

  return Promise.race([
    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('location timeout')), 15000);
    }),
  ]);
}

async function loadCurrentLocationWeather(
  previous?: LocationResult | null,
  options?: { requestPermission?: boolean },
): Promise<LocationResult> {
  const base = {
    id: 'current',
    title: getMyLocationTitle(),
  };
  const cached = cachedToLocationResult(await getCachedWeather('current'));

  const keepExistingCurrent = (error: string | null): LocationResult => {
    if (previous) {
      return previous;
    }
    if (cached) {
      return cached;
    }
    return {
      ...base,
      weather: null,
      error,
    };
  };

  const { status } = options?.requestPermission
    ? await Location.requestForegroundPermissionsAsync()
    : await Location.getForegroundPermissionsAsync();
  if (status !== 'granted') {
    return keepExistingCurrent(t('errors.locationDenied'));
  }

  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    return keepExistingCurrent(t('errors.gpsDisabled'));
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
    if (previous) {
      return previous;
    }
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

async function buildPlaceholderLocations(
  cities: SavedCity[],
  layout: CityLayoutItem[],
): Promise<LocationResult[]> {
  const cachedEntries = await Promise.all([
    getCachedWeather('current'),
    ...cities.map((city) => getCachedWeather(city.id)),
  ]);

  const byId = new Map<string, LocationResult>();
  byId.set(
    'current',
    cachedToLocationResult(cachedEntries[0]) ?? {
      id: 'current',
      title: getMyLocationTitle(),
      weather: null,
      error: null,
    },
  );

  cities.forEach((city, index) => {
    byId.set(
      city.id,
      cachedToLocationResult(cachedEntries[index + 1]) ?? {
        id: city.id,
        title: city.label,
        weather: null,
        error: null,
      },
    );
  });

  return orderLocationsByLayout(Array.from(byId.values()), layout);
}

function CityGrid({
  layout,
  locations,
  onSelect,
}: {
  layout: CityLayoutItem[];
  locations: LocationResult[];
  onSelect: (location: LocationResult) => void;
}) {
  const locationsById = new Map(locations.map((location) => [location.id, location]));
  const slots = layout.map((item) => ({
    ...item,
    location: locationsById.get(item.id),
  }));
  const rows = [slots.slice(0, 2), slots.slice(2, 4)];

  return (
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.gridRow}>
          {row.map((slot) => (
            <View key={slot.id} style={styles.gridCell}>
              {slot.visible && slot.location ? (
                <CitySummaryTile
                  locationId={slot.location.id}
                  title={slot.location.title}
                  subtitle={slot.location.subtitle}
                  weather={slot.location.weather}
                  error={slot.location.error}
                  fetchedAt={slot.location.fetchedAt}
                  fromCache={slot.location.fromCache}
                  onPress={() => onSelect(slot.location!)}
                />
              ) : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export default function App() {
  const { fontsLoaded } = useAppFonts();
  const [savedCities, setSavedCities] = useState<SavedCity[]>(DEFAULT_CITIES);
  const [cityLayout, setCityLayout] = useState<CityLayoutItem[]>(
    buildDefaultCityLayout(DEFAULT_CITIES.map((city) => city.id)),
  );
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
  const cityLayoutRef = useRef(cityLayout);
  const pendingWidgetOpenRef = useRef<{ cityId: string; chartType: WidgetChartType | null } | null>(
    null,
  );
  const weatherLoadRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    locationsRef.current = locations;
  }, [locations]);

  useEffect(() => {
    savedCitiesRef.current = savedCities;
  }, [savedCities]);

  useEffect(() => {
    cityLayoutRef.current = cityLayout;
  }, [cityLayout]);

  const visibleLocations = useMemo(
    () => getVisibleLocations(locations, cityLayout),
    [locations, cityLayout],
  );

  const currentLocationLabel = useMemo(() => {
    const current = locations.find((location) => location.id === 'current');
    if (!current) {
      return '';
    }

    return shortCityName(current.weather?.city ?? current.subtitle ?? '');
  }, [locations]);

  const loadAllWeather = useCallback(async (
    cities: SavedCity[],
    layout: CityLayoutItem[],
    options?: { refresh?: boolean },
  ) => {
    if (weatherLoadRef.current) {
      return weatherLoadRef.current;
    }

    const run = (async () => {
    const isRefresh = options?.refresh ?? false;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
      const placeholders = await buildPlaceholderLocations(cities, layout);
      const hasCachedData = placeholders.some((location) => location.weather !== null);
      if (hasCachedData) {
        setLocations(placeholders);
        setLoading(false);
      }
    }
    setGlobalError(null);

    try {
      const previousCurrent = locationsRef.current.find((location) => location.id === 'current');
      const rawResults = await Promise.all([
        loadCurrentLocationWeather(previousCurrent, { requestPermission: !isRefresh }),
        ...cities.map((city) => loadSavedCityWeather(city)),
      ]);
      const results = orderLocationsByLayout(rawResults, layout);

      setLocations(results);
      try {
        const { saveSnapshotsFromLocations, refreshTemperatureWidgets } = await import(
          './widgets/syncTemperatureWidget'
        );
        await saveSnapshotsFromLocations(results);
        await refreshTemperatureWidgets();
      } catch {
        // Widget sync must not block or crash the main weather refresh.
      }

      const visibleResults = getVisibleLocations(results, layout);
      const allFailed = visibleResults.length > 0 && visibleResults.every((result) => !result.weather);
      if (allFailed) {
        setGlobalError(t('errors.allForecastsFailed'));
      }
    } catch {
      const placeholders = await buildPlaceholderLocations(cities, layout);
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
    })();

    weatherLoadRef.current = run;
    try {
      await run;
    } finally {
      weatherLoadRef.current = null;
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const cities = await getSavedCities();
      const layout = await getCityLayout(cities);
      setSavedCities(cities);
      setCityLayout(layout);
      await loadAllWeather(cities, layout);
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
          await loadAllWeather(savedCitiesRef.current, cityLayoutRef.current, { refresh: true });
        } else {
          const { refreshTemperatureWidgets } = await import('./widgets/syncTemperatureWidget');
          await refreshTemperatureWidgets();
        }
      })();
    });

    return () => subscription.remove();
  }, [loadAllWeather]);

  const handleSaveCities = async (cities: SavedCity[], layout: CityLayoutItem[]) => {
    await saveSavedCities(cities);
    await saveCityLayout(layout);
    setSavedCities(cities);
    setCityLayout(layout);
    setSelectedLocation(null);
    hapticSuccess();
    await loadAllWeather(cities, layout, { refresh: true });
  };

  const handleRefresh = useCallback(() => {
    hapticLight();
    void loadAllWeather(savedCities, cityLayout, { refresh: true });
  }, [loadAllWeather, savedCities, cityLayout]);

  const openDetail = (location: LocationResult) => {
    if (location.weather) {
      setInitialScrollTarget(null);
      setSelectedLocation(location);
    }
  };

  const openDetailFromWidget = useCallback(
    (cityId: string, chartType: WidgetChartType | null) => {
      const location = locationsRef.current.find((entry) => entry.id === cityId);
      if (!location?.weather) {
        pendingWidgetOpenRef.current = { cityId, chartType };
        return;
      }

      setWidgetsVisible(false);
      setInitialScrollTarget(chartType);
      setSelectedLocation(location);
      hapticLight();
    },
    [],
  );

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
            <Pressable style={styles.headerButton} onPress={() => setEditorVisible(true)}>
              <Text
                style={styles.headerButtonText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={HEADER_BUTTON_LAYOUT.minimumFontScale}
              >
                {t('app.cities')}
              </Text>
            </Pressable>
            <Pressable style={styles.headerButton} onPress={() => setWidgetsVisible(true)}>
              <Text
                style={styles.headerButtonText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={HEADER_BUTTON_LAYOUT.minimumFontScale}
              >
                {t('app.widgets')}
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
              {visibleLocations.length > 0 && (
                <CityGrid
                  layout={cityLayout}
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
        layout={cityLayout}
        currentLocationLabel={currentLocationLabel}
        onClose={() => setEditorVisible(false)}
        onSave={(cities, layout) => void handleSaveCities(cities, layout)}
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
    width: HEADER_BUTTON_LAYOUT.width,
    paddingHorizontal: HEADER_BUTTON_LAYOUT.paddingHorizontal,
    paddingVertical: HEADER_BUTTON_LAYOUT.paddingVertical,
    minHeight: HEADER_BUTTON_LAYOUT.minHeight,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  headerButtonText: {
    color: colors.accent,
    fontFamily: fontFamily.semiBold,
    fontSize: HEADER_BUTTON_LAYOUT.fontSize,
    lineHeight: HEADER_BUTTON_LAYOUT.lineHeight,
    includeFontPadding: false,
    textAlign: 'center',
    width: '100%',
    maxWidth: '100%',
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 18,
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
    alignSelf: 'stretch',
  },
  grid: {
    gap: 10,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  gridCell: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
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
