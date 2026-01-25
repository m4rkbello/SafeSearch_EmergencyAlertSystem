import React, {createContext, useState, useContext, useEffect} from 'react';
import StorageService from '../services/StorageService';

const ContactContext = createContext();

export const ContactProvider = ({children}) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    const data = await StorageService.getContactsFromJSON();
    setContacts(data);
    setLoading(false);
  };

  const addContact = async (contactData) => {
    const newContact = await StorageService.addContact(contactData);
    if (newContact) {
      setContacts(prev => [...prev, newContact]);
      return newContact;
    }
    return null;
  };

  const updateContact = async (contactId, updateData) => {
    const updated = await StorageService.updateContact(contactId, updateData);
    if (updated) {
      setContacts(prev => prev.map(c => (c.id === contactId ? updated : c)));
      return updated;
    }
    return null;
  };

  const deleteContact = async (contactId) => {
    const success = await StorageService.deleteContact(contactId);
    if (success) {
      setContacts(prev => prev.filter(c => c.id !== contactId));
      return true;
    }
    return false;
  };

  const saveLocationToContact = async (contactId, locationData) => {
    await StorageService.saveLocationToContact(contactId, locationData);
    await loadContacts();
  };

  const saveSMSToContact = async (contactId, smsData) => {
    await StorageService.saveSMSToContact(contactId, smsData);
    await loadContacts();
  };

  const saveRecordingToContact = async (contactId, recordingData) => {
    await StorageService.saveRecordingToContact(contactId, recordingData);
    await loadContacts();
  };

  return (
    <ContactContext.Provider
      value={{
        contacts,
        loading,
        addContact,
        updateContact,
        deleteContact,
        loadContacts,
        saveLocationToContact,
        saveSMSToContact,
        saveRecordingToContact,
      }}>
      {children}
    </ContactContext.Provider>
  );
};

export const useContacts = () => {
  const context = useContext(ContactContext);
  if (!context) {
    throw new Error('useContacts must be used within ContactProvider');
  }
  return context;
};