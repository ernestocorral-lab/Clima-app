import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { clearAllWidgetConfigs } from '../storage/widgetData';

const INSTALL_MARKER_KEY = 'weather-app-install-marker';

/**
 * SecureStore survives app updates but is wiped on uninstall.
 * AsyncStorage can be restored from Android backup on reinstall, which revives
 * deleted widget configs — clear them when the install identity changes.
 */
export async function resetWidgetRegistryOnFreshInstall(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  let installTime: string;
  try {
    installTime = String((await Application.getInstallationTimeAsync()).getTime());
  } catch {
    return false;
  }

  const storedInstallTime = await SecureStore.getItemAsync(INSTALL_MARKER_KEY);
  if (storedInstallTime === installTime) {
    return false;
  }

  await clearAllWidgetConfigs();
  await SecureStore.setItemAsync(INSTALL_MARKER_KEY, installTime);
  return true;
}
