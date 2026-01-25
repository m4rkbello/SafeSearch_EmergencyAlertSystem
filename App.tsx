import React, { useEffect } from 'react';
import { LogBox, PermissionsAndroid, Platform, Alert } from 'react-native';
import AppNavigator from './src/navigation/AppNavigation';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

const App = () => {
  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.SEND_SMS,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          PermissionsAndroid.PERMISSIONS.CALL_PHONE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ]);
        
        // Check individual permissions and show alerts if denied
        if (granted['android.permission.ACCESS_FINE_LOCATION'] !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Location Permission Required',
            'This app needs location permission to send your GPS location during emergencies.',
            [
              { text: 'OK' },
              {
                text: 'Open Settings',
                onPress: () => {
                  if (Platform.OS === 'android') {
                    // Open app settings
                  }
                }
              }
            ]
          );
        }
        
        if (granted['android.permission.SEND_SMS'] !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'SMS Permission Required',
            'This app needs SMS permission to send emergency messages.',
            [{ text: 'OK' }]
          );
        }

        if (granted['android.permission.RECORD_AUDIO'] !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Microphone Permission Required',
            'This app needs microphone permission to record audio emergency messages.',
            [{ text: 'OK' }]
          );
        }
      } catch (err) {
        console.warn('Permission request error:', err);
      }
    }
  };

  return <AppNavigator />;
};

export default App;