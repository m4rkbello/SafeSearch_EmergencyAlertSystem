import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';

const audioRecorderPlayer = new AudioRecorderPlayer();

class AudioService {
  constructor() {
    this.audioRecorderPlayer = audioRecorderPlayer;
    this.recordingPath = null;
  }

  async startRecording() {
    try {
      const path = `${RNFS.DocumentDirectoryPath}/recording_${Date.now()}.m4a`;
      
      const audioSet = {
        AudioEncoderAndroid: 3, // AAC
        AudioSourceAndroid: 1, // MIC
        AVEncoderAudioQualityKeyIOS: 50,
        AVNumberOfChannelsKeyIOS: 2,
        AVFormatIDKeyIOS: 'm4a',
      };
      
      await this.audioRecorderPlayer.startRecorder(path, audioSet);
      this.recordingPath = path;
      
      return {
        path: path,
        startTime: Date.now(),
      };
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  async stopRecording() {
    try {
      const result = await this.audioRecorderPlayer.stopRecorder();
      this.audioRecorderPlayer.removeRecordBackListener();
      
      const duration = await this.getAudioDuration(this.recordingPath);
      
      return {
        path: this.recordingPath,
        duration: duration,
      };
    } catch (error) {
      console.error('Error stopping recording:', error);
      throw error;
    }
  }

  async getAudioDuration(filePath) {
    try {
      const info = await this.audioRecorderPlayer.getInfo(filePath);
      return info.duration;
    } catch (error) {
      console.error('Error getting audio duration:', error);
      return 0;
    }
  }

  async playRecording(filePath) {
    try {
      await this.audioRecorderPlayer.startPlayer(filePath);
    } catch (error) {
      console.error('Error playing recording:', error);
      throw error;
    }
  }

  async pauseRecording() {
    try {
      await this.audioRecorderPlayer.pausePlayer();
    } catch (error) {
      console.error('Error pausing recording:', error);
      throw error;
    }
  }

  async stopPlayback() {
    try {
      await this.audioRecorderPlayer.stopPlayer();
    } catch (error) {
      console.error('Error stopping playback:', error);
      throw error;
    }
  }
}

export default new AudioService();