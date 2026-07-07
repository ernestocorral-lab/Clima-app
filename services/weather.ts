export type CurrentWeather = {
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
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
  weatherCode: number;
};

export type HourlyForecast = {
  time: string[];
  temperatures: number[];
  humidity: number[];
  windSpeed: number[];
};

export type WeatherData = {
  city: string;
  current: CurrentWeather;
  daily: DailyForecast[];
  hourly?: HourlyForecast;
};

type GeocodingSearchResult = {
  results?: Array<{
    name: string;
    country: string;
    admin1?: string;
    latitude: number;
    longitude: number;
  }>;
};

export type CitySearchResult = {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
};

type GeocodingResult = GeocodingSearchResult;

type ForecastResponse = {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
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
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
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
    return new Error(
      'Sin conexión a internet. Comprueba el WiFi o los datos móviles e inténtalo de nuevo.',
    );
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
      throw new Error(`Error del servidor (${response.status})`);
    }
    return (await response.json()) as T;
  } catch (error) {
    throw toUserError(error, 'No se pudo conectar con el servicio del tiempo');
  }
}

async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  try {
    const url =
      `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}` +
      `&longitude=${longitude}&language=es&count=1`;
    const data = await fetchJson<GeocodingResult>(url);
    const place = data.results?.[0];
    if (!place) {
      return 'Tu ubicación';
    }
    return `${place.name}, ${place.country}`;
  } catch {
    return 'Tu ubicación';
  }
}

export async function searchCities(query: string): Promise<CitySearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const url =
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}` +
    '&count=8&language=es';
  const data = await fetchJson<GeocodingSearchResult>(url);

  return (data.results ?? []).map((place) => ({
    name: place.name,
    country: place.country,
    admin1: place.admin1,
    latitude: place.latitude,
    longitude: place.longitude,
  }));
}

export async function geocodeCity(query: string): Promise<{
  latitude: number;
  longitude: number;
  city: string;
}> {
  const url =
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}` +
    '&count=1&language=es';
  const data = await fetchJson<GeocodingSearchResult>(url);
  const place = data.results?.[0];
  if (!place) {
    throw new Error(`No se encontró: ${query}`);
  }

  return {
    latitude: place.latitude,
    longitude: place.longitude,
    city: `${place.name}, ${place.country}`,
  };
}

export async function fetchWeather(
  latitude: number,
  longitude: number,
  cityName?: string,
): Promise<WeatherData> {
  const forecastUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,relative_humidity_2m_max,relative_humidity_2m_min,wind_speed_10m_max,wind_speed_10m_min,wind_gusts_10m_max' +
    '&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m' +
    '&timezone=auto&forecast_days=7';

  const [city, forecast] = await Promise.all([
    cityName ? Promise.resolve(cityName) : reverseGeocode(latitude, longitude),
    fetchJson<ForecastResponse>(forecastUrl),
  ]);

  return {
    city,
    current: {
      temperature: forecast.current.temperature_2m,
      humidity: forecast.current.relative_humidity_2m,
      windSpeed: forecast.current.wind_speed_10m,
      weatherCode: forecast.current.weather_code,
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
      weatherCode: forecast.daily.weather_code[index],
    })),
    hourly:
      forecast.hourly?.time?.length &&
      forecast.hourly.temperature_2m?.length &&
      forecast.hourly.relative_humidity_2m?.length &&
      forecast.hourly.wind_speed_10m?.length
        ? {
            time: forecast.hourly.time,
            temperatures: forecast.hourly.temperature_2m,
            humidity: forecast.hourly.relative_humidity_2m,
            windSpeed: forecast.hourly.wind_speed_10m,
          }
        : undefined,
  };
}

export async function fetchWeatherForSavedCity(city: {
  label: string;
  latitude: number;
  longitude: number;
}): Promise<WeatherData> {
  return fetchWeather(city.latitude, city.longitude, city.label);
}

export async function fetchWeatherForQuery(
  query: string,
  label?: string,
): Promise<WeatherData> {
  const { latitude, longitude, city } = await geocodeCity(query);
  return fetchWeather(latitude, longitude, label ?? city);
}
