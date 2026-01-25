import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  Linking,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useContacts } from '../context/ContactContext';
import { useAudio } from '../context/AudioContext';
import SMSService from '../services/SMSService';
import EnhancedLocationService from '../services/EnhanceLocationService';
import ContactCard from '../components/ContactCard';

const HomeScreen = ({ navigation }) => {
  const { contacts, loading, saveLocationToContact, saveRecordingToContact } = useContacts();
  const { isRecording, startRecording, stopRecording, uploadToFirebase } = useAudio();
  
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [sendingLocation, setSendingLocation] = useState(false);
  const [sendingAudio, setSendingAudio] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState({
    sms: false,
    location: false,
  });
  const [progress, setProgress] = useState(null);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const smsGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.SEND_SMS
        );
        
        const locationGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        
        setPermissionStatus({
          sms: smsGranted,
          location: locationGranted,
        });
        
        if (!smsGranted || !locationGranted) {
          showPermissionAlert();
        }
      } catch (error) {
        console.error('Permission check error:', error);
      }
    }
  };

  const showPermissionAlert = () => {
    Alert.alert(
      'Permissions Required',
      'SafeSearch needs SMS and Location permissions to send emergency alerts. Please grant these permissions.',
      [
        { text: 'Later', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            if (Platform.OS === 'android') {
              Linking.openSettings();
            }
          },
        },
      ]
    );
  };

  const handleSendLocation = async () => {
    if (selectedContacts.length === 0) {
      Alert.alert('No Contacts Selected', 'Please select at least one contact to send location to.');
      return;
    }

    // Check permissions
    if (!permissionStatus.location) {
      const granted = await EnhancedLocationService.requestLocationPermission();
      if (!granted) {
        Alert.alert('Location Permission Required', 'Cannot send location without permission.');
        return;
      }
      setPermissionStatus(prev => ({ ...prev, location: true }));
    }

    if (!permissionStatus.sms) {
      const granted = await SMSService.requestSMSPermission();
      if (!granted) {
        Alert.alert('SMS Permission Required', 'Cannot send SMS without permission.');
        return;
      }
      setPermissionStatus(prev => ({ ...prev, sms: true }));
    }

    setSendingLocation(true);
    setProgress({ current: 0, total: selectedContacts.length, status: 'getting_location' });

    try {
      // Show getting location alert
      Alert.alert('Getting Location', 'Acquiring your GPS coordinates...', [], { cancelable: false });

      // Get location with high accuracy
      const location = await EnhancedLocationService.getCurrentLocation({
        enableHighAccuracy: true,
        timeout: 15000,
        retries: 2,
      });

      // Get address if possible
      let address = null;
      try {
        address = await EnhancedLocationService.getAddressFromCoordinates(
          location.latitude,
          location.longitude
        );
      } catch (e) {
        console.warn('Could not get address:', e);
      }

      // Generate location message
      const locationMessage = EnhancedLocationService.generateLocationMessage(location, address);

      // Close the getting location alert
      // Alert dismissal is handled by the system

      // Confirm sending
      Alert.alert(
        'Location Ready',
        `Accuracy: ${location.accuracy ? `${Math.round(location.accuracy)} meters` : 'Good'}\n\nSend to ${selectedContacts.length} contact(s)?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setSendingLocation(false) },
          {
            text: 'Send Now',
            style: 'destructive',
            onPress: async () => {
              await sendLocationToContacts(location, locationMessage, address);
            },
          },
        ]
      );

    } catch (error) {
      setSendingLocation(false);
      setProgress(null);
      
      Alert.alert(
        'Location Error',
        error.userMessage || error.message + '\n\nPlease ensure:\n• GPS is enabled\n• Location permission granted\n• You are outdoors',
        [
          { text: 'OK' },
          {
            text: 'Try Again',
            onPress: handleSendLocation,
          },
        ]
      );
    }
  };

  const sendLocationToContacts = async (location, message, address) => {
    const selectedContactObjects = contacts.filter(contact => 
      selectedContacts.includes(contact.id)
    );

    const results = await SMSService.sendBulkSMS(
      selectedContactObjects,
      message,
      (progressUpdate) => {
        setProgress(progressUpdate);
      }
    );

    // Save to each contact's history
    for (const contact of selectedContactObjects) {
      try {
        await saveLocationToContact(contact.id, {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          address: address?.formattedAddress,
          timestamp: new Date().toISOString(),
          messageSent: message.substring(0, 100) + '...',
        });
      } catch (e) {
        console.error('Error saving location history:', e);
      }
    }

    // Show results
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    if (failed === 0) {
      Alert.alert('✅ Success', `Location sent to ${successful} contact(s)`);
    } else {
      Alert.alert(
        '⚠️ Partial Success',
        `Sent to ${successful} contact(s), failed for ${failed} contact(s)\n\nCheck SMS permissions and try again.`,
        [
          { text: 'OK' },
          {
            text: 'View Details',
            onPress: () => {
              const failedContacts = results
                .filter(r => !r.success)
                .map(r => `• ${r.contactName}: ${r.error}`)
                .join('\n');
              
              Alert.alert('Failed to Send', failedContacts || 'All messages sent successfully');
            },
          },
        ]
      );
    }

    setSendingLocation(false);
    setProgress(null);
  };

  const handleRecordAndSend = async () => {
    if (selectedContacts.length === 0) {
      Alert.alert('No Contacts Selected', 'Please select at least one contact to send audio to.');
      return;
    }

    if (!permissionStatus.sms) {
      const granted = await SMSService.requestSMSPermission();
      if (!granted) {
        Alert.alert('SMS Permission Required', 'Cannot send audio without SMS permission.');
        return;
      }
      setPermissionStatus(prev => ({ ...prev, sms: true }));
    }

    if (isRecording) {
      // Stop recording and send
      await handleStopAndSendAudio();
    } else {
      // Start recording
      await handleStartRecording();
    }
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
      
      Alert.alert(
        '🎤 Recording Started',
        'Recording your audio message...\n\nTap the red button again to stop and send.',
        [
          {
            text: 'Cancel Recording',
            style: 'destructive',
            onPress: async () => {
              try {
                await stopRecording();
                Alert.alert('Recording Cancelled', 'Audio recording was cancelled.');
              } catch (error) {
                console.error('Error cancelling recording:', error);
              }
            },
          },
          { text: 'OK', style: 'cancel' },
        ]
      );
    } catch (error) {
      Alert.alert('Recording Error', 'Could not start recording: ' + error.message);
    }
  };

  const handleStopAndSendAudio = async () => {
    setSendingAudio(true);
    setProgress({ current: 0, total: selectedContacts.length, status: 'processing_audio' });

    try {
      // Stop recording
      const result = await stopRecording();
      
      // Upload to Firebase
      setProgress({ ...progress, status: 'uploading_audio' });
      const downloadUrl = await uploadToFirebase(result.path);
      
      // Send to contacts
      const selectedContactObjects = contacts.filter(contact => 
        selectedContacts.includes(contact.id)
      );

      const audioMessage = `🚨 EMERGENCY AUDIO MESSAGE 🚨\n\n` +
                         `I've sent an emergency audio message (${Math.round(result.duration || 0)} seconds).\n\n` +
                         `Listen here: ${downloadUrl}\n\n` +
                         `Time: ${new Date().toLocaleString()}\n` +
                         `📍 Sent via SafeSearch App`;

      const smsResults = await SMSService.sendBulkSMS(
        selectedContactObjects,
        audioMessage,
        (progressUpdate) => {
          setProgress({ ...progressUpdate, status: 'sending_audio' });
        }
      );

      // Save to each contact's history
      for (const contact of selectedContactObjects) {
        try {
          await saveRecordingToContact(contact.id, {
            url: downloadUrl,
            duration: result.duration,
            timestamp: new Date().toISOString(),
            messageSent: 'Audio message sent',
          });
        } catch (e) {
          console.error('Error saving recording history:', e);
        }
      }

      // Show results
      const successful = smsResults.filter(r => r.success).length;
      const failed = smsResults.filter(r => !r.success).length;

      if (failed === 0) {
        Alert.alert('✅ Success', `Audio sent to ${successful} contact(s)`);
      } else {
        Alert.alert(
          '⚠️ Partial Success',
          `Audio sent to ${successful} contact(s), failed for ${failed} contact(s)`
        );
      }

    } catch (error) {
      Alert.alert('Error', 'Failed to send audio: ' + error.message);
    } finally {
      setSendingAudio(false);
      setProgress(null);
    }
  };

  const handleCall = (phone) => {
    Linking.openURL(`tel:${phone}`).catch(err => 
      Alert.alert('Call Error', 'Could not make call: ' + err.message)
    );
  };

  const handleEmail = (email) => {
    if (!email) {
      Alert.alert('No Email', 'This contact has no email address');
      return;
    }
    
    const emailUrl = `mailto:${email}?subject=Emergency%20Alert&body=This%20is%20an%20emergency%20alert%20from%20SafeSearch%20App`;
    
    Linking.openURL(emailUrl).catch(err =>
      Alert.alert('Email Error', 'Could not open email: ' + err.message)
    );
  };

  const toggleContactSelection = (contactId) => {
    setSelectedContacts(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId);
      } else {
        return [...prev, contactId];
      }
    });
  };

  const selectAllContacts = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map(c => c.id));
    }
  };

  const renderContact = ({ item }) => (
    <ContactCard
      contact={item}
      isSelected={selectedContacts.includes(item.id)}
      onSelect={() => toggleContactSelection(item.id)}
      onPress={() => navigation.navigate('ContactDetails', { contactId: item.id })}
      onCall={() => handleCall(item.phone)}
      onEmail={() => handleEmail(item.email)}
    />
  );

  const getProgressText = () => {
    if (!progress) return null;
    
    switch(progress.status) {
      case 'getting_location':
        return 'Getting GPS location...';
      case 'processing_audio':
        return 'Processing audio...';
      case 'uploading_audio':
        return 'Uploading audio...';
      case 'sending_audio':
        return `Sending audio... (${progress.current}/${progress.total})`;
      case 'sending':
        return `Sending... (${progress.current}/${progress.total})`;
      case 'sent':
        return `Sent to ${progress.contactName}`;
      default:
        return `Processing... (${progress.current}/${progress.total})`;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>SafeSearch</Text>
          <Text style={styles.subtitle}>Emergency Alert System</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddContact')}>
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Permission Status Bar */}
        {(!permissionStatus.sms || !permissionStatus.location) && (
          <TouchableOpacity 
            style={styles.permissionBar}
            onPress={showPermissionAlert}>
            <Icon name="warning" size={20} color="#FF9800" />
            <Text style={styles.permissionText}>
              {!permissionStatus.sms && !permissionStatus.location 
                ? 'SMS & Location permissions needed'
                : !permissionStatus.sms 
                  ? 'SMS permission needed'
                  : 'Location permission needed'}
            </Text>
            <Icon name="chevron-right" size={20} color="#666" />
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Emergency Actions</Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                selectedContacts.length === 0 && styles.disabledButton,
                sendingLocation && styles.processingButton,
              ]}
              onPress={handleSendLocation}
              disabled={selectedContacts.length === 0 || sendingLocation}>
              {sendingLocation ? (
                <View style={styles.processingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  {progress && <Text style={styles.processingText}>Processing...</Text>}
                </View>
              ) : (
                <>
                  <Icon 
                    name="location-on" 
                    size={32} 
                    color={selectedContacts.length === 0 ? "#aaa" : "#fff"} 
                  />
                  <Text style={[
                    styles.actionText,
                    selectedContacts.length === 0 && styles.disabledText
                  ]}>
                    Send GPS Location
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                selectedContacts.length === 0 && styles.disabledButton,
                (isRecording || sendingAudio) && styles.recordingButton,
              ]}
              onPress={handleRecordAndSend}
              disabled={selectedContacts.length === 0 || sendingAudio}>
              {(sendingAudio || isRecording) ? (
                <View style={styles.processingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.processingText}>
                    {isRecording ? 'Recording...' : 'Sending...'}
                  </Text>
                </View>
              ) : (
                <>
                  <Icon 
                    name="mic" 
                    size={32} 
                    color={selectedContacts.length === 0 ? "#aaa" : "#fff"} 
                  />
                  <Text style={[
                    styles.actionText,
                    selectedContacts.length === 0 && styles.disabledText
                  ]}>
                    Record & Send Audio
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Progress Indicator */}
          {progress && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>{getProgressText()}</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${(progress.current / progress.total) * 100}%` }
                  ]} 
                />
              </View>
            </View>
          )}

          {/* Selection Status */}
          <View style={styles.selectionContainer}>
            <Text style={styles.selectionText}>
              {selectedContacts.length > 0 
                ? `📱 ${selectedContacts.length} contact(s) selected`
                : '👆 Tap and hold contacts to select multiple'}
            </Text>
            
            {contacts.length > 0 && (
              <TouchableOpacity onPress={selectAllContacts}>
                <Text style={styles.selectAllText}>
                  {selectedContacts.length === contacts.length ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Contacts List */}
        <View style={styles.contactsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            <Text style={styles.contactsCount}>{contacts.length} contacts</Text>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.loadingText}>Loading contacts...</Text>
            </View>
          ) : contacts.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="people" size={80} color="#ddd" />
              <Text style={styles.emptyText}>No emergency contacts yet</Text>
              <Text style={styles.emptySubText}>Add contacts to send emergency alerts</Text>
              <TouchableOpacity 
                style={styles.addFirstButton}
                onPress={() => navigation.navigate('AddContact')}>
                <Text style={styles.addFirstButtonText}>➕ Add First Contact</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={contacts}
              renderItem={renderContact}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              ListHeaderComponent={
                selectedContacts.length > 0 ? (
                  <View style={styles.selectedHeader}>
                    <Text style={styles.selectedHeaderText}>
                      Selected: {selectedContacts.length} of {contacts.length}
                    </Text>
                  </View>
                ) : null
              }
            />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2196F3',
    paddingTop: Platform.OS === 'android' ? 10 : 16,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    color: '#E3F2FD',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#1976D2',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  permissionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  permissionText: {
    flex: 1,
    marginLeft: 10,
    color: '#E65100',
    fontWeight: '500',
  },
  quickActions: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 10,
    marginHorizontal: 10,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flex: 0.48,
    minHeight: 120,
    justifyContent: 'center',
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
    elevation: 0,
  },
  recordingButton: {
    backgroundColor: '#f44336',
  },
  processingButton: {
    backgroundColor: '#FF9800',
  },
  processingContainer: {
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 12,
  },
  actionText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledText: {
    color: '#aaa',
  },
  progressContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  selectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  selectionText: {
    color: '#1565C0',
    fontWeight: '500',
    fontSize: 14,
  },
  selectAllText: {
    color: '#2196F3',
    fontWeight: '600',
    fontSize: 14,
  },
  contactsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactsCount: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedHeader: {
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  selectedHeaderText: {
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  addFirstButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    marginTop: 24,
    elevation: 2,
  },
  addFirstButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default HomeScreen;