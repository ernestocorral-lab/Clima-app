import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

import App from './App';

if (Platform.OS === 'android') {
  require('./widgets/registerWidgets');
}

registerRootComponent(App);
