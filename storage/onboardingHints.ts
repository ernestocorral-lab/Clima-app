import AsyncStorage from '@react-native-async-storage/async-storage';

export type HintId = 'widgetLongPress' | 'addWidgetFromLauncher';

const DISMISSED_PREFIX = '@clima/hint/dismissed/';

function dismissedKey(id: HintId): string {
  return `${DISMISSED_PREFIX}${id}`;
}

export async function isHintDismissed(id: HintId): Promise<boolean> {
  return (await AsyncStorage.getItem(dismissedKey(id))) === '1';
}

export async function dismissHint(id: HintId): Promise<void> {
  await AsyncStorage.setItem(dismissedKey(id), '1');
}
