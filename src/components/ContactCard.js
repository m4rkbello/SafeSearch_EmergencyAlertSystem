import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ContactCard = ({ contact, isSelected, onSelect, onPress, onCall, onEmail }) => {
  return (
    
    <TouchableOpacity 
      style={[styles.card, isSelected && styles.selectedCard]} 
      onPress={onPress}
      onLongPress={onSelect}
      delayLongPress={200}>
      
      <TouchableOpacity 
        style={styles.selectButton} 
        onPress={onSelect}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Icon 
          name={isSelected ? "check-circle" : "radio-button-unchecked"} 
          size={24} 
          color={isSelected ? "#2196F3" : "#ccc"} 
        />
      </TouchableOpacity>
      
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {contact.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.name}>{contact.name}</Text>
        <Text style={styles.phone}>{contact.phone}</Text>
        {contact.relationship && (
          <Text style={styles.relationship}>{contact.relationship}</Text>
        )}
      </View>
      
      <View style={styles.actions}>
        {onCall && (
          <TouchableOpacity onPress={() => onCall(contact.phone)} style={styles.iconButton}>
            <Icon name="call" size={20} color="#2196F3" />
          </TouchableOpacity>
        )}
        
        {onEmail && contact.email && (
          <TouchableOpacity onPress={() => onEmail(contact.email)} style={styles.iconButton}>
            <Icon name="email" size={20} color="#FF9800" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedCard: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  selectButton: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  phone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  relationship: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 4,
  },
});

export default ContactCard;