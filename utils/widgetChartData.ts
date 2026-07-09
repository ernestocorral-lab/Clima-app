import { WeatherData } from '../services/weather';
import {
  buildApparentTemperatureChartSeries,
  buildHumidityChartSeries,
  buildMetricChartSeries,
  buildPressureChartSeries,
  buildTemperatureChartSeries,
  buildUvIndexChartSeries,
  buildWindChartSeries,
  buildWindGustChartSeries,
  ChartPoint,
  DailyEnvelope,
  getApparentTemperatureEnvelope,
  getHumidityEnvelope,
  getMetricEnvelope,
  getPrecipitationEnvelope,
  getPressureEnvelope,
  getTemperatureEnvelope,
  getUvIndexEnvelope,
  getWindEnvelope,
  getWindGustEnvelope,
  scaleHourlyValues,
} from './chartSeries';

import { getHourlyValueAtNow } from './widgetHourly';

export type WidgetChartType =
  | 'temperature'
  | 'apparent'
  | 'humidity'
  | 'precipitation'
  | 'wind'
  | 'windGust'
  | 'pressure'
  | 'uv'
  | 'radiation'
  | 'visibility'
  | 'gases'
  | 'particles'
  | 'allergens';

export type WidgetChartSeries = {
  label: string;
  subtitle?: string;
  points: ChartPoint[];
  envelope: DailyEnvelope[];
  currentLabel: string;
};

export const WIDGET_CHART_OPTIONS: { id: WidgetChartType; label: string }[] = [
  { id: 'temperature', label: 'Temperatura' },
  { id: 'apparent', label: 'Sensación térmica' },
  { id: 'humidity', label: 'Humedad' },
  { id: 'precipitation', label: 'Precipitaciones' },
  { id: 'wind', label: 'Viento' },
  { id: 'windGust', label: 'Ráfagas' },
  { id: 'pressure', label: 'Presión' },
  { id: 'uv', label: 'Índice UV' },
  { id: 'radiation', label: 'Radiación' },
  { id: 'visibility', label: 'Visibilidad' },
  { id: 'gases', label: 'Gases' },
  { id: 'particles', label: 'Partículas' },
  { id: 'allergens', label: 'Alergenos' },
];

export function buildWidgetChartsFromWeather(weather: WeatherData): Record<WidgetChartType, WidgetChartSeries> {
  const hourly = weather.hourly;
  const visibilityKm = scaleHourlyValues(hourly?.visibility, 1000);
  const precipNow = getHourlyValueAtNow(hourly, hourly?.precipitation) ?? 0;
  const gustNow = getHourlyValueAtNow(hourly, hourly?.windGust);
  const pressureNow = getHourlyValueAtNow(hourly, hourly?.pressure);
  const uvNow = getHourlyValueAtNow(hourly, hourly?.uvIndex);
  const radiationNow = getHourlyValueAtNow(hourly, hourly?.shortwaveRadiation);
  const visibilityNow = getHourlyValueAtNow(hourly, visibilityKm);
  const gasesNow = getHourlyValueAtNow(hourly, hourly?.europeanAqi);
  const particlesNow = getHourlyValueAtNow(hourly, hourly?.pm25);
  const allergensNow = getHourlyValueAtNow(hourly, hourly?.allergens);

  return {
    temperature: {
      label: 'Temperatura',
      points: buildTemperatureChartSeries(hourly, weather.daily).points,
      envelope: getTemperatureEnvelope(hourly, weather.daily),
      currentLabel: `${Math.round(weather.current.temperature)}°`,
    },
    apparent: {
      label: 'Sensación térmica',
      points: buildApparentTemperatureChartSeries(hourly, weather.daily).points,
      envelope: getApparentTemperatureEnvelope(hourly, weather.daily),
      currentLabel: `${Math.round(weather.current.apparentTemperature ?? weather.current.temperature)}°`,
    },
    humidity: {
      label: 'Humedad',
      points: buildHumidityChartSeries(hourly, weather.daily).points,
      envelope: getHumidityEnvelope(hourly, weather.daily),
      currentLabel: `${Math.round(weather.current.humidity)}%`,
    },
    precipitation: {
      label: 'Precipitaciones',
      subtitle: 'Pico horario (mm/h)',
      points: buildMetricChartSeries(hourly, hourly?.precipitation, weather.daily).points,
      envelope: getPrecipitationEnvelope(hourly, hourly?.precipitation, weather.daily),
      currentLabel: `${precipNow.toFixed(1)} mm/h`,
    },
    wind: {
      label: 'Viento',
      points: buildWindChartSeries(hourly, weather.daily).points,
      envelope: getWindEnvelope(hourly, weather.daily),
      currentLabel: `${Math.round(weather.current.windSpeed)} km/h`,
    },
    windGust: {
      label: 'Ráfagas',
      points: buildWindGustChartSeries(hourly, weather.daily).points,
      envelope: getWindGustEnvelope(hourly, weather.daily),
      currentLabel: `${Math.round(gustNow ?? weather.daily[0]?.maxWindGust ?? 0)} km/h`,
    },
    pressure: {
      label: 'Presión',
      points: buildPressureChartSeries(hourly, weather.daily).points,
      envelope: getPressureEnvelope(hourly, weather.daily),
      currentLabel: `${Math.round(pressureNow ?? 1013)} mbar`,
    },
    uv: {
      label: 'Índice UV',
      points: buildUvIndexChartSeries(hourly, weather.daily).points,
      envelope: getUvIndexEnvelope(hourly, weather.daily),
      currentLabel: (uvNow ?? 0).toFixed(1),
    },
    radiation: {
      label: 'Radiación',
      points: buildMetricChartSeries(hourly, hourly?.shortwaveRadiation, weather.daily).points,
      envelope: getMetricEnvelope(hourly, hourly?.shortwaveRadiation, weather.daily),
      currentLabel: `${Math.round(radiationNow ?? 0)} W/m²`,
    },
    visibility: {
      label: 'Visibilidad',
      points: buildMetricChartSeries(hourly, visibilityKm, weather.daily).points,
      envelope: getMetricEnvelope(hourly, visibilityKm, weather.daily),
      currentLabel: `${(visibilityNow ?? 0).toFixed(1)} km`,
    },
    gases: {
      label: 'Gases',
      points: buildMetricChartSeries(hourly, hourly?.europeanAqi, weather.daily).points,
      envelope: getMetricEnvelope(hourly, hourly?.europeanAqi, weather.daily),
      currentLabel: `${Math.round(gasesNow ?? 0)} EAQI`,
    },
    particles: {
      label: 'Partículas',
      points: buildMetricChartSeries(hourly, hourly?.pm25, weather.daily).points,
      envelope: getMetricEnvelope(hourly, hourly?.pm25, weather.daily),
      currentLabel: `${Math.round(particlesNow ?? 0)} µg/m³`,
    },
    allergens: {
      label: 'Alergenos',
      points: buildMetricChartSeries(hourly, hourly?.allergens, weather.daily).points,
      envelope: getMetricEnvelope(hourly, hourly?.allergens, weather.daily),
      currentLabel: `${Math.round(allergensNow ?? 0)} grains/m³`,
    },
  };
}
