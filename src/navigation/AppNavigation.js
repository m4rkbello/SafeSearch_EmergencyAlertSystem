import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import AddContactScreen from '../screens/AddContactScreen';
import ContactDetailsScreen from '../screens/ContactDetailsScreen';

import { AudioProvider } from '../contexts/AudioContext';
import { ContactProvider } from '../contexts/ContactContext';
import { LocationProvider } from '../contexts/LocationContext';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <SafeAreaProvider>
      <ContactProvider>
        <LocationProvider>
          <AudioProvider>
            <NavigationContainer>
              <Stack.Navigator
                initialRouteName="Home"
                screenOptions={{
                  headerShown: false,
                  animation: 'slide_from_right',
                }}>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="AddContact" component={AddContactScreen} />
                <Stack.Screen name="ContactDetails" component={ContactDetailsScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </AudioProvider>
        </LocationProvider>
      </ContactProvider>
    </SafeAreaProvider>
  );
};

export default AppNavigator;