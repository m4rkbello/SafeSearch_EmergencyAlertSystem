import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageService {
  constructor() {
    this.CONTACTS_KEY = '@safesearch_contacts';
  }

  // Get all contacts from AsyncStorage
  async getContactsFromJSON() {
    try {
      const contactsJSON = await AsyncStorage.getItem(this.CONTACTS_KEY);
      return contactsJSON ? JSON.parse(contactsJSON) : [];
    } catch (error) {
      console.error('Error loading contacts:', error);
      return [];
    }
  }

  // Save all contacts to AsyncStorage
  async saveContacts(contacts) {
    try {
      await AsyncStorage.setItem(this.CONTACTS_KEY, JSON.stringify(contacts));
      return true;
    } catch (error) {
      console.error('Error saving contacts:', error);
      throw error;
    }
  }

  // Add a new contact
  async addContact(contactData) {
    try {
      const contacts = await this.getContactsFromJSON();
      const newContact = {
        id: Date.now().toString(),
        ...contactData,
        createdAt: new Date().toISOString(),
        history: [], // Array to store activity history
      };
      
      contacts.push(newContact);
      await this.saveContacts(contacts);
      return newContact;
    } catch (error) {
      console.error('Error adding contact:', error);
      throw error;
    }
  }

  // Update a contact
  async updateContact(contactId, updateData) {
    try {
      const contacts = await this.getContactsFromJSON();
      const index = contacts.findIndex(c => c.id === contactId);
      
      if (index === -1) {
        throw new Error('Contact not found');
      }
      
      contacts[index] = {
        ...contacts[index],
        ...updateData,
        updatedAt: new Date().toISOString(),
      };
      
      await this.saveContacts(contacts);
      return contacts[index];
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  }

  // Delete a contact
  async deleteContact(contactId) {
    try {
      let contacts = await this.getContactsFromJSON();
      contacts = contacts.filter(c => c.id !== contactId);
      await this.saveContacts(contacts);
      return true;
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }

  // Save location activity to contact history
  async saveLocationToContact(contactId, locationData) {
    try {
      const contacts = await this.getContactsFromJSON();
      const index = contacts.findIndex(c => c.id === contactId);
      
      if (index === -1) {
        throw new Error('Contact not found');
      }
      
      const historyItem = {
        type: 'location',
        ...locationData,
        timestamp: new Date().toISOString(),
      };
      
      if (!contacts[index].history) {
        contacts[index].history = [];
      }
      
      contacts[index].history.unshift(historyItem); // Add to beginning
      await this.saveContacts(contacts);
      return true;
    } catch (error) {
      console.error('Error saving location to contact:', error);
      throw error;
    }
  }

  // Save SMS activity to contact history
  async saveSMSToContact(contactId, smsData) {
    try {
      const contacts = await this.getContactsFromJSON();
      const index = contacts.findIndex(c => c.id === contactId);
      
      if (index === -1) {
        throw new Error('Contact not found');
      }
      
      const historyItem = {
        type: 'sms',
        ...smsData,
        timestamp: new Date().toISOString(),
      };
      
      if (!contacts[index].history) {
        contacts[index].history = [];
      }
      
      contacts[index].history.unshift(historyItem);
      await this.saveContacts(contacts);
      return true;
    } catch (error) {
      console.error('Error saving SMS to contact:', error);
      throw error;
    }
  }

  // Save recording activity to contact history
  async saveRecordingToContact(contactId, recordingData) {
    try {
      const contacts = await this.getContactsFromJSON();
      const index = contacts.findIndex(c => c.id === contactId);
      
      if (index === -1) {
        throw new Error('Contact not found');
      }
      
      const historyItem = {
        type: 'recording',
        ...recordingData,
        timestamp: new Date().toISOString(),
      };
      
      if (!contacts[index].history) {
        contacts[index].history = [];
      }
      
      contacts[index].history.unshift(historyItem);
      await this.saveContacts(contacts);
      return true;
    } catch (error) {
      console.error('Error saving recording to contact:', error);
      throw error;
    }
  }

  // Get contact by ID
  async getContactById(contactId) {
    try {
      const contacts = await this.getContactsFromJSON();
      return contacts.find(c => c.id === contactId) || null;
    } catch (error) {
      console.error('Error getting contact:', error);
      throw error;
    }
  }
}

export default new StorageService();