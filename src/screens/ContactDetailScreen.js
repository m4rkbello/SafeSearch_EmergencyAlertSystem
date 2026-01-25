import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useContacts } from '../contexts/ContactContext';
import { useLocation } from '../contexts/LocationContext';
import { useAudio } from '../contexts/AudioContext';
import SMSService from '../services/SMSService';

const ContactDetailsScreen = ({ route, navigation }) => {
  const { contactId } = route.params;
  // ADD saveSMSToContact here ↓
  const { contacts, deleteContact, saveLocationToContact, saveRecordingToContact, saveSMSToContact } = useContacts();
  const { fetchCurrentLocation } = useLocation();
  const { startRecording, stopRecording, uploadToFirebase } = useAudio();
  
  const [isRecording, setIsRecording] = useState(false);

  const contact = contacts.find(c => c.id === contactId);

  if (!contact) {
    return (
      <View style={styles.container}>
        <Text>Contact not found</Text>
      </View>
    );
  }

  const handleCall = () => {
    Linking.openURL(`tel:${contact.phone}`).catch(err =>
      Alert.alert('Error', 'Could not make call: ' + err.message)
    );
  };

  const handleSMS = async () => {
    try {
      await SMSService.sendSMS(contact.phone, 'Emergency! I need help!');
      Alert.alert('Success', 'SMS sent successfully');
      // Now saveSMSToContact is defined ↓
      await saveSMSToContact(contactId, {
        message: 'Emergency! I need help!',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to send SMS: ' + error.message);
    }
  };

  const handleSendLocation = async () => {
    try {
      const location = await fetchCurrentLocation();
      const message = `Emergency! My location: https://maps.google.com/?q=${location.latitude},${location.longitude}`;
      
      await SMSService.sendSMS(contact.phone, message);
      
      // Save to contact history
      await saveLocationToContact(contactId, {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date().toISOString(),
        sent: true,
      });
      
      Alert.alert('Success', 'Location sent successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to send location: ' + error.message);
    }
  };

  const handleRecordAudio = async () => {
    if (isRecording) {
      try {
        setIsRecording(false);
        const result = await stopRecording();
        const downloadUrl = await uploadToFirebase(result.path);
        
        const message = `Emergency audio message: ${downloadUrl}`;
        await SMSService.sendSMS(contact.phone, message);
        
        await saveRecordingToContact(contactId, {
          url: downloadUrl,
          timestamp: new Date().toISOString(),
          duration: result.duration,
        });
        
        Alert.alert('Success', 'Audio message sent');
      } catch (error) {
        Alert.alert('Error', 'Failed to send audio: ' + error.message);
      }
    } else {
      try {
        await startRecording();
        setIsRecording(true);
        Alert.alert('Recording', 'Recording started...');
      } catch (error) {
        Alert.alert('Error', 'Failed to start recording: ' + error.message);
      }
    }
  };

  const handleDeleteContact = () => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteContact(contactId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete contact');
            }
          },
        },
      ]
    );
  };

  const handleEmail = () => {
    if (!contact.email) {
      Alert.alert('No Email', 'This contact has no email address');
      return;
    }
    
    Linking.openURL(`mailto:${contact.email}`).catch(err =>
      Alert.alert('Error', 'Could not open email: ' + err.message)
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact Details</Text>
          <TouchableOpacity onPress={handleDeleteContact}>
            <Icon name="delete" size={24} color="#f44336" />
          </TouchableOpacity>
        </View>

        <View style={styles.contactInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {contact.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{contact.name}</Text>
          {contact.relationship && (
            <Text style={styles.relationship}>{contact.relationship}</Text>
          )}
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={handleCall}>
            <Icon name="call" size={28} color="#2196F3" />
            <Text style={styles.quickActionText}>Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} onPress={handleSMS}>
            <Icon name="message" size={28} color="#4CAF50" />
            <Text style={styles.quickActionText}>SMS</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} onPress={handleEmail}>
            <Icon name="email" size={28} color="#FF9800" />
            <Text style={styles.quickActionText}>Email</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.infoItem}>
            <Icon name="phone" size={20} color="#666" />
            <Text style={styles.infoText}>{contact.phone}</Text>
          </View>
          
          {contact.email && (
            <View style={styles.infoItem}>
              <Icon name="email" size={20} color="#666" />
              <Text style={styles.infoText}>{contact.email}</Text>
            </View>
          )}
          
          {contact.notes && (
            <View style={styles.infoItem}>
              <Icon name="notes" size={20} color="#666" />
              <Text style={styles.infoText}>{contact.notes}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Actions</Text>
          
          <TouchableOpacity 
            style={styles.emergencyButton} 
            onPress={handleSendLocation}>
            <Icon name="location-on" size={24} color="#fff" />
            <Text style={styles.emergencyButtonText}>Send Current Location</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.emergencyButton, isRecording && styles.recordingButton]} 
            onPress={handleRecordAudio}>
            <Icon 
              name={isRecording ? "stop" : "mic"} 
              size={24} 
              color="#fff" 
            />
            <Text style={styles.emergencyButtonText}>
              {isRecording ? 'Stop Recording & Send' : 'Record & Send Audio'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity History</Text>
          
          {contact.history && contact.history.length > 0 ? (
            contact.history.map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <Icon 
                  name={
                    item.type === 'location' ? 'location-on' : 
                    item.type === 'sms' ? 'message' : 
                    item.type === 'recording' ? 'mic' : 'history'
                  } 
                  size={20} 
                  color="#2196F3" 
                />
                <View style={styles.historyContent}>
                  <Text style={styles.historyTitle}>
                    {item.type === 'location' ? 'Location Sent' :
                     item.type === 'sms' ? 'SMS Sent' :
                     item.type === 'recording' ? 'Audio Sent' : 'Activity'}
                  </Text>
                  <Text style={styles.historyTime}>
                    {new Date(item.timestamp).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noHistory}>No activity yet</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  contactInfo: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  relationship: {
    fontSize: 16,
    color: '#666',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 16,
    flex: 1,
  },
  emergencyButton: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  recordingButton: {
    backgroundColor: '#f44336',
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  historyContent: {
    marginLeft: 12,
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  historyTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  noHistory: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
});

export default ContactDetailsScreen;