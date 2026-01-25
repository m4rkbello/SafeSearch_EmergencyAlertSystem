// src/context/AudioContext.js
import React, {createContext, useState, useContext, useCallback} from 'react';
import AudioService from '../services/AudioService';

const AudioContext = createContext();

export const AudioProvider = ({children}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentRecording, setCurrentRecording] = useState(null);
  const [recordingError, setRecordingError] = useState(null);

  const startRecording = useCallback(async () => {
    try {
      setRecordingError(null);
      const result = await AudioService.startRecording();
      setIsRecording(true);
      setCurrentRecording(result);
      return result;
    } catch (error) {
      setRecordingError(error.message);
      console.error('Failed to start recording:', error);
      throw error;
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      if (!isRecording) {
        throw new Error('No active recording to stop');
      }
      
      const result = await AudioService.stopRecording();
      setIsRecording(false);
      setCurrentRecording(result);
      return result;
    } catch (error) {
      setRecordingError(error.message);
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }, [isRecording]);

  const clearError = useCallback(() => {
    setRecordingError(null);
  }, []);

  const contextValue = {
    isRecording,
    currentRecording,
    recordingError,
    startRecording,
    stopRecording,
    clearError,
  };

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};