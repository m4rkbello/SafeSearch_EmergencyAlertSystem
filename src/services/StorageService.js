import AsyncStorage from '@react-native-async-storage/async-storage';
import {STORAGE_KEYS} from '../utils/constants';

class StorageService {
  async saveContactsToJSON(contacts) {
    try {
      const jsonData = JSON.stringify(contacts, null, 2);
      await AsyncStorage.setItem(STORAGE_KEYS.CONTACTS, jsonData);
      console.log('✅ Contacts saved to JSON');
      return true;
    } catch (error) {
      console.error('❌ Save error:', error);
      return false;
    }
  }

  async getContactsFromJSON() {
    try {
      const jsonData = await AsyncStorage.getItem(STORAGE_KEYS.CONTACTS);
      if (jsonData) {
        return JSON.parse(jsonData);
      }
      return [];
    } catch (error) {
      console.error('❌ Load error:', error);
      return [];
    }
  }

  async addContact(contactData) {
    try {
      const contacts = await this.getContactsFromJSON();
      const newContact = {
        id: Date.now().toString(),
        firstName: contactData.firstName,
        middleName: contactData.middleName || '',
        lastName: contactData.lastName,
        contactNo: contactData.contactNo,
        email: contactData.email || '',
        address: contactData.address || '',
        createdAt: new Date().toISOString(),
        lastLocation: null,
        smsHistory: [],
        audioRecordings: [],
      };
      
      contacts.push(newContact);
      await this.saveContactsToJSON(contacts);
      return newContact;
    } catch (error) {
      console.error('❌ Add contact error:', error);
      return null;
    }
  }

  async updateContact(contactId, updateData) {
    try {
      const contacts = await this.getContactsFromJSON();
      const index = contacts.findIndex(c => c.id === contactId);
      
      if (index !== -1) {
        contacts[index] = {...contacts[index], ...updateData};
        await this.saveContactsToJSON(contacts);
        return contacts[index];
      }
      return null;
    } catch (error) {
      console.error('❌ Update error:', error);
      return null;
    }
  }

  async deleteContact(contactId) {
    try {
      const contacts = await this.getContactsFromJSON();
      const filtered = contacts.filter(c => c.id !== contactId);
      await this.saveContactsToJSON(filtered);
      return true;
    } catch (error) {
      console.error('❌ Delete error:', error);
      return false;
    }
  }

  async saveLocationToContact(contactId, locationData) {
    try {
      const contacts = await this.getContactsFromJSON();
      const contact = contacts.find(c => c.id === contactId);
      
      if (contact) {
        contact.lastLocation = {
          ...locationData,
          timestamp: new Date().toISOString(),
        };
        await this.saveContactsToJSON(contacts);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Save location error:', error);
      return false;
    }
  }

  async saveSMSToContact(contactId, smsData) {
    try {
      const contacts = await this.getContactsFromJSON();
      const contact = contacts.find(c => c.id === contactId);
      
      if (contact) {
        if (!contact.smsHistory) contact.smsHistory = [];
        
        contact.smsHistory.push({
          message: smsData.message,
          type: smsData.type,
          timestamp: new Date().toISOString(),
        });
        
        await this.saveContactsToJSON(contacts);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Save SMS error:', error);
      return false;
    }
  }

  async saveRecordingToContact(contactId, recordingData) {
    try {
      const contacts = await this.getContactsFromJSON();
      const contact = contacts.find(c => c.id === contactId);
      
      if (contact) {
        if (!contact.audioRecordings) contact.audioRecordings = [];
        
        contact.audioRecordings.push({
          id: Date.now().toString(),
          localPath: recordingData.localPath,
          firebaseUrl: recordingData.firebaseUrl,
          duration: recordingData.duration || 0,
          timestamp: new Date().toISOString(),
        });
        
        await this.saveContactsToJSON(contacts);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Save recording error:', error);
      return false;
    }
  }
}

export default new StorageService();