import {
  citySearchTerm,
  resolveCountryCodeFromContext,
} from '../utils/resolveCountryCode';
import { buildCityLabel, shortCityName } from '../utils/formatCity';
import { getApiLanguage, t } from '../i18n';

export type CurrentWeather = {
  temperature: number;
  apparentTemperature?: number;
  humidity: number;
  windSpeed: number;
  windGust?: number;
  weatherCode: number;
  observedAt: string;
};

export type DailyForecast = {
  date: string;
  maxTemp: number;
  minTemp: number;
  maxHumidity: number;
  minHumidity: number;
  maxWindSpeed: number;
  minWindSpeed: number;
  maxWindGust: number;
  maxApparentTemp?: number;
  minApparentTemp?: number;
  maxPressure?: number;
  minPressure?: number;
  maxUvIndex?: number;
  precipitationSum?: number;
  weatherCode: number;
};

export type HourlyForecast = {
  time: string[];
  temperatures: number[];
  humidity: number[];
  windSpeed: number[];
  windGust?: number[];
  apparentTemperature?: number[];
  pressure?: number[];
  uvIndex?: number[];
  weatherCode?: number[];
  precipitation?: number[];
  cloudCover?: number[];
  visibility?: number[];
  shortwaveRadiation?: number[];
  globalTiltedIrradiance?: number[];
  sunshineDuration?: number[];
  evapotranspiration?: number[];
  soilTemperature?: number[];
  waveHeight?: number[];
  europeanAqi?: number[];
  pm25?: number[];
  allergens?: number[];
};

export type WeatherData = {
  city: string;
  region?: string;
  countryCodeAlpha2?: string;
  timezone?: string;
  current: CurrentWeather;
  daily: DailyForecast[];
  hourly?: HourlyForecast;
};

type GeocodingSearchResult = {
  results?: Array<{
    name: string;
    country: string;
    country_code?: string;
    admin1?: string;
    latitude: number;
    longitude: number;
  }>;
};

export type CitySearchResult = {
  name: string;
  country: string;
  countryCodeAlpha2?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
};

type GeocodingResult = GeocodingSearchResult;

function formatGeocodePlaceLabel(place: {
  name: string;
  admin1?: string;
  country: string;
}): string {
  return buildCityLabel(place.name, place.admin1, place.country);
}

type ForecastResponse = {
  timezone?: string;
  timezone_abbreviation?: string;
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature?: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_gusts_10m?: number;
    weather_code: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    relative_humidity_2m_max: number[];
    relative_humidity_2m_min: number[];
    wind_speed_10m_max: number[];
    wind_speed_10m_min: number[];
    wind_gusts_10m_max: number[];
    apparent_temperature_max?: number[];
    apparent_temperature_min?: number[];
    uv_index_max?: number[];
    precipitation_sum?: number[];
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
    wind_gusts_10m?: number[];
    apparent_temperature?: number[];
    surface_pressure?: number[];
    uv_index?: number[];
    weather_code?: number[];
    precipitation?: number[];
    cloud_cover?: number[];
    visibility?: number[];
    shortwave_radiation?: number[];
    global_tilted_irradiance?: number[];
    sunshine_duration?: number[];
    et0_fao_evapotranspiration?: number[];
    soil_temperature_0cm?: number[];
  };
};

type AirQualityResponse = {
  hourly?: {
    time: string[];
    european_aqi?: number[];
    pm2_5?: number[];
    alder_pollen?: number[];
    birch_pollen?: number[];
    grass_pollen?: number[];
    olive_pollen?: number[];
    ragweed_pollen?: number[];
  };
};

type MarineResponse = {
  hourly?: {
    time: string[];
    wave_height?: number[];
  };
};

function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes('network request failed') ||
    message.includes('failed to fetch') ||
    message.includes('network error') ||
    message.includes('unable to resolve host')
  );
}

function toUserError(error: unknown, fallback: string): Error {
  if (isNetworkError(error)) {
    return new Error(t('errors.noInternet'));
  }

  if (error instanceof Error && error.message) {
    return error;
  }

  return new Error(fallback);
}

async function fetchJson<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(t('errors.serverError', { status: response.status }));
    }
    return (await response.json()) as T;
  } catch (error) {
    throw toUserError(error, t('errors.weatherServiceFailed'));
  }
}

async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<{
  name: string;
  label: string;
  admin1?: string;
  countryCodeAlpha2?: string;
} | null> {
  try {
    const url =
      `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}` +
      `&longitude=${longitude}&language=${getApiLanguage()}&count=1`;
    const data = await fetchJson<GeocodingResult>(url);
    const place = data.results?.[0];
    if (!place) {
      return null;
    }
    return {
      name: place.name,
      label: formatGeocodePlaceLabel(place),
      admin1: place.admin1,
      countryCodeAlpha2: place.country_code,
    };
  } catch {
    return null;
  }
}

async function resolvePlaceInfo(
  latitude: number,
  longitude: number,
  cityName?: string,
  countryCodeAlpha2?: string,
  timezone?: string,
): Promise<{ city: string; region?: string; countryCodeAlpha2?: string }> {
  const reverse = cityName ? null : await reverseGeocode(latitude, longitude);
  const yourLocation = t('location.yourLocation');
  const city = cityName
    ? shortCityName(cityName)
    : reverse?.name ?? yourLocation;
  const region = reverse?.admin1;

  if (countryCodeAlpha2) {
    return { city, region, countryCodeAlpha2 };
  }

  const searchTerm = citySearchTerm(cityName ?? reverse?.label ?? reverse?.name);
  const searchResults = searchTerm ? await searchCities(searchTerm) : [];

  const resolvedCountry = resolveCountryCodeFromContext({
    countryCodeAlpha2: reverse?.countryCodeAlpha2,
    cityLabel: city,
    timezone,
    searchResults,
    latitude,
    longitude,
  });

  return {
    city,
    region,
    countryCodeAlpha2: resolvedCountry,
  };
}

export async function searchCities(query: string): Promise<CitySearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const url =
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}` +
    `&count=8&language=${getApiLanguage()}`;
  const data = await fetchJson<GeocodingSearchResult>(url);

  return (data.results ?? []).map((place) => ({
    name: place.name,
    country: place.country,
    countryCodeAlpha2: place.country_code,
    admin1: place.admin1,
    latitude: place.latitude,
    longitude: place.longitude,
  }));
}

export async function geocodeCity(query: string): Promise<{
  latitude: number;
  longitude: number;
  city: string;
  countryCodeAlpha2?: string;
}> {
  const url =
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}` +
    '&count=1&language=' + getApiLanguage();
  const data = await fetchJson<GeocodingSearchResult>(url);
  const place = data.results?.[0];
  if (!place) {
    throw new Error(t('errors.cityNotFound', { query }));
  }

  return {
    latitude: place.latitude,
    longitude: place.longitude,
    city: formatGeocodePlaceLabel(place),
    countryCodeAlpha2: place.country_code,
  };
}

function alignHourlyValues(
  canonicalTimes: string[],
  sourceTimes: string[] | undefined,
  sourceValues: number[] | undefined,
): number[] | undefined {
  if (!sourceTimes || !sourceValues) {
    return undefined;
  }

  if (
    sourceTimes.length === canonicalTimes.length &&
    sourceTimes.every((time, index) => time === canonicalTimes[index])
  ) {
    return sanitizeHourlyArray(sourceValues);
  }

  const byTime = new Map(sourceTimes.map((time, index) => [time, sourceValues[index]]));
  return canonicalTimes.map((time) => {
    const raw = byTime.get(time);
    return typeof raw === 'number' && !Number.isNaN(raw) ? raw : 0;
  });
}

function sanitizeHourlyArray(values: number[] | undefined): number[] | undefined {
  if (!values) {
    return undefined;
  }

  return values.map((value) =>
    typeof value === 'number' && !Number.isNaN(value) ? value : 0,
  );
}

function sumAllergenValues(
  hourly: NonNullable<AirQualityResponse['hourly']>,
  index: number,
): number {
  return (
    (hourly.alder_pollen?.[index] ?? 0) +
    (hourly.birch_pollen?.[index] ?? 0) +
    (hourly.grass_pollen?.[index] ?? 0) +
    (hourly.olive_pollen?.[index] ?? 0) +
    (hourly.ragweed_pollen?.[index] ?? 0)
  );
}

export async function fetchWeather(
  latitude: number,
  longitude: number,
  cityName?: string,
  countryCodeAlpha2?: string,
): Promise<WeatherData> {
  const forecastUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    '&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,relative_humidity_2m_max,relative_humidity_2m_min,wind_speed_10m_max,wind_speed_10m_min,wind_gusts_10m_max,apparent_temperature_max,apparent_temperature_min,uv_index_max,precipitation_sum' +
    '&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,apparent_temperature,surface_pressure,uv_index,weather_code,precipitation,cloud_cover,visibility,shortwave_radiation,global_tilted_irradiance,sunshine_duration,et0_fao_evapotranspiration,soil_temperature_0cm' +
    '&tilt=30&azimuth=180&timezone=auto&forecast_days=7';
  const airQualityUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}` +
    '&hourly=european_aqi,pm2_5,alder_pollen,birch_pollen,grass_pollen,olive_pollen,ragweed_pollen' +
    '&timezone=auto&forecast_days=7';
  const marineUrl =
    `https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}` +
    '&hourly=wave_height&timezone=auto&forecast_days=7';

  const [forecast, airQuality, marine] = await Promise.all([
    fetchJson<ForecastResponse>(forecastUrl),
    fetchJson<AirQualityResponse>(airQualityUrl).catch(() => ({ hourly: undefined })),
    fetchJson<MarineResponse>(marineUrl).catch(() => ({ hourly: undefined })),
  ]);
  const place = await resolvePlaceInfo(
    latitude,
    longitude,
    cityName,
    countryCodeAlpha2,
    forecast.timezone,
  );
  const canonicalTimes = forecast.hourly?.time ?? [];
  const allergens =
    airQuality.hourly && canonicalTimes.length
      ? canonicalTimes.map((_, index) => {
          const sourceIndex = airQuality.hourly?.time.indexOf(canonicalTimes[index]) ?? -1;
          if (sourceIndex < 0 || !airQuality.hourly) {
            return 0;
          }
          return sumAllergenValues(airQuality.hourly, sourceIndex);
        })
      : undefined;

  return {
    city: place.city,
    region: place.region,
    countryCodeAlpha2: place.countryCodeAlpha2,
    timezone: forecast.timezone,
    current: {
      temperature: forecast.current.temperature_2m,
      apparentTemperature: forecast.current.apparent_temperature,
      humidity: forecast.current.relative_humidity_2m,
      windSpeed: forecast.current.wind_speed_10m,
      windGust: forecast.current.wind_gusts_10m,
      weatherCode: forecast.current.weather_code,
      observedAt: forecast.current.time,
    },
    daily: forecast.daily.time.map((date, index) => ({
      date,
      maxTemp: forecast.daily.temperature_2m_max[index],
      minTemp: forecast.daily.temperature_2m_min[index],
      maxHumidity: forecast.daily.relative_humidity_2m_max[index],
      minHumidity: forecast.daily.relative_humidity_2m_min[index],
      maxWindSpeed: forecast.daily.wind_speed_10m_max[index],
      minWindSpeed: forecast.daily.wind_speed_10m_min[index],
      maxWindGust: forecast.daily.wind_gusts_10m_max[index],
      maxApparentTemp: forecast.daily.apparent_temperature_max?.[index],
      minApparentTemp: forecast.daily.apparent_temperature_min?.[index],
      maxUvIndex: forecast.daily.uv_index_max?.[index],
      precipitationSum: forecast.daily.precipitation_sum?.[index],
      weatherCode: forecast.daily.weather_code[index],
    })),
    hourly:
      forecast.hourly?.time?.length &&
      forecast.hourly.temperature_2m?.length &&
      forecast.hourly.relative_humidity_2m?.length &&
      forecast.hourly.wind_speed_10m?.length
        ? {
            time: forecast.hourly.time,
            temperatures: sanitizeHourlyArray(forecast.hourly.temperature_2m)!,
            humidity: sanitizeHourlyArray(forecast.hourly.relative_humidity_2m)!,
            windSpeed: sanitizeHourlyArray(forecast.hourly.wind_speed_10m)!,
            windGust: sanitizeHourlyArray(forecast.hourly.wind_gusts_10m),
            apparentTemperature: sanitizeHourlyArray(forecast.hourly.apparent_temperature),
            pressure: sanitizeHourlyArray(forecast.hourly.surface_pressure),
            uvIndex: sanitizeHourlyArray(forecast.hourly.uv_index),
            weatherCode: sanitizeHourlyArray(forecast.hourly.weather_code),
            precipitation: sanitizeHourlyArray(forecast.hourly.precipitation),
            cloudCover: sanitizeHourlyArray(forecast.hourly.cloud_cover),
            visibility: sanitizeHourlyArray(forecast.hourly.visibility),
            shortwaveRadiation: sanitizeHourlyArray(forecast.hourly.shortwave_radiation),
            globalTiltedIrradiance: sanitizeHourlyArray(forecast.hourly.global_tilted_irradiance),
            sunshineDuration: sanitizeHourlyArray(forecast.hourly.sunshine_duration),
            evapotranspiration: sanitizeHourlyArray(forecast.hourly.et0_fao_evapotranspiration),
            soilTemperature: sanitizeHourlyArray(forecast.hourly.soil_temperature_0cm),
            waveHeight:
              alignHourlyValues(
                canonicalTimes,
                marine.hourly?.time,
                marine.hourly?.wave_height,
              ) ?? canonicalTimes.map(() => 0),
            europeanAqi:
              alignHourlyValues(
                canonicalTimes,
                airQuality.hourly?.time,
                airQuality.hourly?.european_aqi,
              ) ?? canonicalTimes.map(() => 0),
            pm25:
              alignHourlyValues(
                canonicalTimes,
                airQuality.hourly?.time,
                airQuality.hourly?.pm2_5,
              ) ?? canonicalTimes.map(() => 0),
            allergens,
          }
        : undefined,
  };
}

export async function fetchWeatherForSavedCity(city: {
  label: string;
  latitude: number;
  longitude: number;
  countryCodeAlpha2?: string;
}): Promise<WeatherData> {
  return fetchWeather(city.latitude, city.longitude, city.label, city.countryCodeAlpha2);
}

export async function fetchWeatherForQuery(
  query: string,
  label?: string,
): Promise<WeatherData> {
  const { latitude, longitude, city, countryCodeAlpha2 } = await geocodeCity(query);
  return fetchWeather(latitude, longitude, label ?? city, countryCodeAlpha2);
}
