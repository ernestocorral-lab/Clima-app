import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_STALE_AFTER_MS } from '../utils/dataStaleness';

const REFRESH_INTERVAL_KEY = '@weather-app/refresh-interval-ms';

export const REFRESH_INTERVAL_OPTIONS = [
  { ms: 15 * 60 * 1000, key: '15' as const },
  { ms: 30 * 60 * 1000, key: '30' as const },
  { ms: 60 * 60 * 1000, key: '60' as const },
];

export type RefreshIntervalKey = (typeof REFRESH_INTERVAL_OPTIONS)[number]['key'];

export async function getRefreshIntervalMs(): Promise<number> {
  const raw = await AsyncStorage.getItem(REFRESH_INTERVAL_KEY);
  const option = REFRESH_INTERVAL_OPTIONS.find((entry) => entry.key === raw);
  return option?.ms ?? DEFAULT_STALE_AFTER_MS;
}

export async function setRefreshIntervalKey(key: RefreshIntervalKey): Promise<void> {
  await AsyncStorage.setItem(REFRESH_INTERVAL_KEY, key);
}

export async function getRefreshIntervalKey(): Promise<RefreshIntervalKey> {
  const raw = await AsyncStorage.getItem(REFRESH_INTERVAL_KEY);
  const option = REFRESH_INTERVAL_OPTIONS.find((entry) => entry.key === raw);
  return option?.key ?? '30';
}
