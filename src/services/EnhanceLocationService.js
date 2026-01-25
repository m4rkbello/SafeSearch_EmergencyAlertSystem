import Geolocation from '@react-native-community/geolocation';
import { Platform, PermissionsAndroid } from 'react-native';

class EnhancedLocationService {
  constructor() {
    this.watchId = null;
    this.lastLocation = null;
  }

  // Request location permission
  async requestLocationPermission() {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission Required',
            message: 'SafeSearch needs precise location access for emergency alerts',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Location permission granted');
          return true;
        } else {
          console.log('Location permission denied');
          return false;
        }
      } catch (err) {
        console.warn('Permission error:', err);
        return false;
      }
    }
    
    // iOS - permissions are handled differently
    return true;
  }

  // Get current location with retry logic
  async getCurrentLocation(options = {}) {
    const {
      enableHighAccuracy = true,
      timeout = 30000,
      maximumAge = 10000,
      retries = 3,
      retryDelay = 2000
    } = options;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Location attempt ${attempt}/${retries}`);
        
        const location = await new Promise((resolve, reject) => {
          Geolocation.getCurrentPosition(
            (position) => {
              const locationData = this.formatLocation(position);
              this.lastLocation = locationData;
              resolve(locationData);
            },
            (error) => {
              reject(this.formatError(error));
            },
            {
              enableHighAccuracy,
              timeout,
              maximumAge,
            }
          );
        });

        console.log('Location acquired:', location);
        return location;

      } catch (error) {
        console.warn(`Attempt ${attempt} failed:`, error.message);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  // Format location data
  formatLocation(position) {
    const coords = position.coords;
    
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy, // meters
      altitude: coords.altitude,
      altitudeAccuracy: coords.altitudeAccuracy,
      speed: coords.speed, // m/s
      heading: coords.heading, // degrees
      timestamp: position.timestamp,
      provider: coords.provider || 'gps',
      formattedTime: new Date(position.timestamp).toLocaleString(),
    };
  }

  // Format error
  formatError(error) {
    let message = 'Unable to get location';
    let userMessage = 'Location service unavailable';
    
    switch(error.code) {
      case 1: // PERMISSION_DENIED
        message = 'Location permission denied';
        userMessage = 'Please enable location permissions in settings';
        break;
      case 2: // POSITION_UNAVAILABLE
        message = 'Location unavailable';
        userMessage = 'Check if GPS is enabled and you have clear sky view';
        break;
      case 3: // TIMEOUT
        message = 'Location request timed out';
        userMessage = 'Taking too long to get location. Try moving to open area';
        break;
    }
    
    return {
      code: error.code,
      message: message,
      userMessage: userMessage,
      details: error.message,
    };
  }

  // Get location with address (reverse geocoding)
  async getLocationWithAddress() {
    try {
      const location = await this.getCurrentLocation();
      const address = await this.getAddressFromCoordinates(
        location.latitude,
        location.longitude
      );
      
      return {
        ...location,
        address: address,
        fullMessage: this.generateLocationMessage(location, address),
      };
    } catch (error) {
      throw error;
    }
  }

  // Reverse geocoding to get address
  async getAddressFromCoordinates(latitude, longitude) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      const address = data.address;
      let formattedAddress = '';
      
      // Build address string
      if (address.road) formattedAddress += address.road;
      if (address.suburb) formattedAddress += `, ${address.suburb}`;
      if (address.city || address.town || address.village) {
        formattedAddress += `, ${address.city || address.town || address.village}`;
      }
      if (address.state) formattedAddress += `, ${address.state}`;
      if (address.country) formattedAddress += `, ${address.country}`;
      
      return {
        ...data,
        formattedAddress: formattedAddress.replace(/^,\s*/, ''),
        shortAddress: address.road || address.suburb || address.city || 'Unknown location',
      };
    } catch (error) {
      console.warn('Geocoding failed:', error);
      return null;
    }
  }

  // Generate SMS message with location
  generateLocationMessage(location, address = null) {
    const googleMapsLink = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    const appleMapsLink = `http://maps.apple.com/?ll=${location.latitude},${location.longitude}`;
    
    let message = `🚨 EMERGENCY LOCATION ALERT 🚨\n\n`;
    message += `I need immediate assistance at this location:\n\n`;
    
    if (address?.formattedAddress) {
      message += `📍 ADDRESS:\n${address.formattedAddress}\n\n`;
    }
    
    message += `📍 COORDINATES:\n`;
    message += `Lat: ${location.latitude.toFixed(6)}\n`;
    message += `Lon: ${location.longitude.toFixed(6)}\n\n`;
    
    message += `📍 MAP LINKS:\n`;
    message += `Google Maps: ${googleMapsLink}\n`;
    message += `Apple Maps: ${appleMapsLink}\n\n`;
    
    message += `📍 ACCURACY:\n`;
    message += `${location.accuracy ? `${location.accuracy.toFixed(1)} meters` : 'High precision'}\n\n`;
    
    message += `🕒 TIME: ${location.formattedTime || new Date().toLocaleString()}\n\n`;
    message += `📍 Sent via SafeSearch Emergency App`;
    
    return message;
  }

  // Start continuous location tracking
  startLocationTracking(onLocationUpdate, onError = null) {
    if (this.watchId !== null) {
      this.stopLocationTracking();
    }
    
    this.watchId = Geolocation.watchPosition(
      (position) => {
        const location = this.formatLocation(position);
        this.lastLocation = location;
        onLocationUpdate(location);
      },
      (error) => {
        if (onError) {
          onError(this.formatError(error));
        }
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // meters
        interval: 5000, // milliseconds
        fastestInterval: 2000,
      }
    );
    
    return this.watchId;
  }

  // Stop location tracking
  stopLocationTracking() {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Get last known location
  getLastKnownLocation() {
    return this.lastLocation;
  }

  // Calculate distance between two coordinates (in meters)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }
}

export default new EnhancedLocationService();