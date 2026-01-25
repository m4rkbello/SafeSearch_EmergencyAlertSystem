import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useContacts } from '../contexts/ContactContext';

const AddContactScreen = ({ navigation }) => {
  const { addContact } = useContacts();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: '',
    notes: '',
  });

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    // Basic phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{1,14}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    try {
      const newContact = await addContact(formData);
      if (newContact) {
        Alert.alert(
          'Success',
          'Contact added successfully',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add contact: ' + error.message);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Emergency Contact</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Icon name="person" size={16} color="#666" /> Name *
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter full name"
              value={formData.name}
              onChangeText={(text) => updateField('name', text)}
              autoFocus
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Icon name="phone" size={16} color="#666" /> Phone Number *
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              value={formData.phone}
              onChangeText={(text) => updateField('phone', text)}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Icon name="email" size={16} color="#666" /> Email
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email address"
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Icon name="groups" size={16} color="#666" /> Relationship
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Spouse, Parent, Friend"
              value={formData.relationship}
              onChangeText={(text) => updateField('relationship', text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Icon name="notes" size={16} color="#666" /> Notes
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Additional notes about this contact"
              value={formData.notes}
              onChangeText={(text) => updateField('notes', text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.infoBox}>
            <Icon name="info" size={20} color="#2196F3" />
            <Text style={styles.infoText}>
              This contact will receive emergency messages including your location and audio recordings.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.saveButtonLarge} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Contact</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  textArea: {
    minHeight: 100,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    color: '#1565C0',
    fontSize: 14,
  },
  saveButtonLarge: {
    backgroundColor: '#2196F3',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddContactScreen;