import React, {createContext, useState, useContext} from 'react';
import AudioService from '../services/AudioService';
import FirebaseService from '../services/FirebaseService';

const AudioContext = createContext();

export const AudioProvider = ({children}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentRecording, setCurrentRecording] = useState(null);

  const startRecording = async () => {
    const result = await AudioService.startRecording();
    setIsRecording(true);
    setCurrentRecording(result);
    return result;
  };

  const stopRecording = async () => {
    const result = await AudioService.stopRecording();
    setIsRecording(false);
    setCurrentRecording(result);
    return result;
  };

  const uploadToFirebase = async (filePath) => {
    const url = await FirebaseService.uploadAudio(filePath);
    return url;
  };

  return (
    <AudioContext.Provider
      value={{
        isRecording,
        currentRecording,
        startRecording,
        stopRecording,
        uploadToFirebase,
      }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => useContext(AudioContext);