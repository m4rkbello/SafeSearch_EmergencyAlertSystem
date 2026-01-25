import React, {createContext, useState, useContext} from 'react';
import LocationService from '../services/EnhanceLocationService';

const LocationContext = createContext();

export const LocationProvider = ({children}) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCurrentLocation = async () => {
    setLoading(true);
    try {
      const location = await LocationService.getCurrentLocation();
      setCurrentLocation(location);
      return location;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocationContext.Provider
      value={{currentLocation, loading, fetchCurrentLocation}}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);