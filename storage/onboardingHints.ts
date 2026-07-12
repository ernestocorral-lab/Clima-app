import AsyncStorage from '@react-native-async-storage/async-storage';

export type HintId = 'addCities' | 'widgetLongPress' | 'addWidgetFromLauncher';

const DISMISSED_PREFIX = '@clima/hint/dismissed/';
const EDITOR_OPENED_KEY = '@clima/hint/editor-opened';
const FIRST_CITY_CUSTOMIZED_KEY = '@clima/hint/first-city-customized';

function dismissedKey(id: HintId): string {
  return `${DISMISSED_PREFIX}${id}`;
}

export async function isHintDismissed(id: HintId): Promise<boolean> {
  return (await AsyncStorage.getItem(dismissedKey(id))) === '1';
}

export async function dismissHint(id: HintId): Promise<void> {
  await AsyncStorage.setItem(dismissedKey(id), '1');
}

export async function resetAllHints(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const hintKeys = keys.filter(
    (key) =>
      key.startsWith(DISMISSED_PREFIX) ||
      key === EDITOR_OPENED_KEY ||
      key === FIRST_CITY_CUSTOMIZED_KEY,
  );
  if (hintKeys.length > 0) {
    await AsyncStorage.multiRemove(hintKeys);
  }
}

export async function markEditorOpened(): Promise<void> {
  await AsyncStorage.setItem(EDITOR_OPENED_KEY, '1');
}

export async function hasEditorBeenOpened(): Promise<boolean> {
  return (await AsyncStorage.getItem(EDITOR_OPENED_KEY)) === '1';
}

export async function markFirstCityCustomized(): Promise<void> {
  await AsyncStorage.setItem(FIRST_CITY_CUSTOMIZED_KEY, '1');
}

export async function hasFirstCityBeenCustomized(): Promise<boolean> {
  return (await AsyncStorage.getItem(FIRST_CITY_CUSTOMIZED_KEY)) === '1';
}
