import storage from '@react-native-firebase/storage';
import { Platform } from 'react-native';

class FirebaseService {
  constructor() {
    this.storageRef = storage();
  }

  // Upload audio file to Firebase Storage
  async uploadAudio(filePath) {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const filename = `audio_${timestamp}.m4a`;
      
      // Create reference
      const reference = this.storageRef.ref(`audios/${filename}`);
      
      // Upload file
      await reference.putFile(filePath);
      
      // Get download URL
      const downloadUrl = await reference.getDownloadURL();
      
      console.log('File uploaded successfully:', downloadUrl);
      return downloadUrl;
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw error;
    }
  }

  // Delete file from storage
  async deleteFile(downloadUrl) {
    try {
      // Extract file path from URL
      const fileRef = this.storageRef.refFromURL(downloadUrl);
      await fileRef.delete();
      console.log('File deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // List all audio files for a user
  async listUserAudios(userId) {
    try {
      const listRef = this.storageRef.ref(`audios/`);
      const result = await listRef.listAll();
      
      const files = [];
      for (const item of result.items) {
        const url = await item.getDownloadURL();
        files.push({
          name: item.name,
          url: url,
          fullPath: item.fullPath,
        });
      }
      
      return files;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  // Get file metadata
  async getFileMetadata(downloadUrl) {
    try {
      const fileRef = this.storageRef.refFromURL(downloadUrl);
      const metadata = await fileRef.getMetadata();
      return metadata;
    } catch (error) {
      console.error('Error getting metadata:', error);
      throw error;
    }
  }
}

export default new FirebaseService();