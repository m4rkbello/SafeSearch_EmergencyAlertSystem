import { AudioRecorder, AudioPlayer, AudioUtils } from 'react-native-audio-toolkit';
import RNFS from 'react-native-fs';

class AudioService {
  constructor() {
    this.recordingPath = null;
    this.currentPlayer = null;
    this.isRecording = false;
    this.isPlaying = false;
  }

  async startRecording() {
    try {
      // Create unique file path
      const path = `${AudioUtils.DocumentDirectoryPath}/recording_${Date.now()}.mp3`;
      
      // Prepare recording with MP3 settings
      AudioRecorder.prepareRecordingAtPath(path, {
        SampleRate: 44100,           // Standard sample rate
        Channels: 1,                 // Mono (1) or Stereo (2)
        AudioQuality: 'High',        // Low, Medium, High
        AudioEncoding: 'mp3',        // Can also use 'aac', 'wav'
      });

      // Start recording
      AudioRecorder.startRecording();
      this.isRecording = true;
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
      if (!this.isRecording) {
        throw new Error('No recording in progress');
      }

      // Stop recording
      AudioRecorder.stopRecording();
      this.isRecording = false;
      
      // Wait a moment for file to be finalized
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get file info
      const fileInfo = await RNFS.stat(this.recordingPath);
      const duration = await this.getAudioDuration(this.recordingPath);
      
      return {
        path: this.recordingPath,
        duration: duration,
        size: fileInfo.size,
      };
    } catch (error) {
      console.error('Error stopping recording:', error);
      throw error;
    }
  }

  async getAudioDuration(filePath) {
    try {
      // Create a player to get duration
      const player = new AudioPlayer(filePath, {
        autoDestroy: false
      });
      
      return new Promise((resolve, reject) => {
        player.on('loaded', (data) => {
          resolve(data.duration);
          player.destroy();
        });
        
        player.on('error', (error) => {
          console.error('Error getting duration:', error);
          player.destroy();
          resolve(0);
        });
        
        player.prepare();
      });
    } catch (error) {
      console.error('Error getting audio duration:', error);
      return 0;
    }
  }

  async playRecording(filePath) {
    try {
      if (this.currentPlayer) {
        await this.stopPlayback();
      }
      
      this.currentPlayer = new AudioPlayer(filePath);
      
      return new Promise((resolve, reject) => {
        this.currentPlayer.on('prepared', () => {
          this.currentPlayer.play();
          this.isPlaying = true;
          resolve();
        });
        
        this.currentPlayer.on('error', (error) => {
          reject(error);
        });
        
        this.currentPlayer.prepare();
      });
    } catch (error) {
      console.error('Error playing recording:', error);
      throw error;
    }
  }

  async pausePlayback() {
    if (this.currentPlayer && this.isPlaying) {
      this.currentPlayer.pause();
      this.isPlaying = false;
    }
  }

  async resumePlayback() {
    if (this.currentPlayer && !this.isPlaying) {
      this.currentPlayer.play();
      this.isPlaying = true;
    }
  }

  async stopPlayback() {
    if (this.currentPlayer) {
      this.currentPlayer.stop();
      this.currentPlayer.destroy();
      this.currentPlayer = null;
      this.isPlaying = false;
    }
  }

  cleanup() {
    this.stopPlayback();
    this.isRecording = false;
  }
}

export default new AudioService();