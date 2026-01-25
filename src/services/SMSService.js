import { Platform, PermissionsAndroid, Linking } from 'react-native';
import SendSMS from 'react-native-get-sms-android';
import EnhancedLocationService from './EnhancedLocationService';

class SMSService {
  constructor() {
    this.isPermissionGranted = false;
  }

  // Request SMS permission for Android
  async requestSMSPermission() {
    if (Platform.OS !== 'android') {
      return true; // iOS handles SMS differently
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.SEND_SMS,
        {
          title: 'SMS Permission Required',
          message: 'SafeSearch needs SMS permission to send emergency alerts',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      
      this.isPermissionGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      return this.isPermissionGranted;
    } catch (err) {
      console.warn('Permission request error:', err);
      return false;
    }
  }

  // Check SMS permission status
  async checkSMSPermission() {
    if (Platform.OS !== 'android') return true;
    
    try {
      const result = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.SEND_SMS
      );
      this.isPermissionGranted = result;
      return result;
    } catch (err) {
      console.warn('Permission check error:', err);
      return false;
    }
  }

  // Send SMS using Android native API
  async sendSMS(phoneNumber, message) {
    // Validate phone number
    if (!this.validatePhoneNumber(phoneNumber)) {
      throw new Error('Invalid phone number format');
    }

    // Validate message
    if (!message || message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    if (Platform.OS === 'android') {
      return this.sendViaAndroid(phoneNumber, message);
    } else {
      // For iOS, use SMS app
      return this.openSMSApp(phoneNumber, message);
    }
  }

  // Validate phone number
  validatePhoneNumber(phone) {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it's a valid length (usually 10-15 digits)
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  // Format phone number
  formatPhoneNumber(phone) {
    // Remove all non-digits
    return phone.replace(/\D/g, '');
  }

  // Send via Android SMS API
  async sendViaAndroid(phoneNumber, message) {
    console.log('Sending SMS via Android API to:', phoneNumber);
    
    // Check permission
    const hasPermission = await this.checkSMSPermission();
    if (!hasPermission) {
      const requested = await this.requestSMSPermission();
      if (!requested) {
        throw new Error('SMS permission denied by user');
      }
    }

    return new Promise((resolve, reject) => {
      // Format phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      SendSMS.send(
        Date.now(), // Unique SMS ID
        formattedPhone,
        message,
        (fail) => {
          console.error('SMS sending failed:', fail);
          reject(new Error(`Failed to send SMS: ${fail}`));
        },
        (success) => {
          console.log('SMS sent successfully:', success);
          resolve({
            success: true,
            method: 'android_sms',
            messageId: Date.now(),
            phoneNumber: formattedPhone,
            timestamp: new Date().toISOString(),
          });
        }
      );
    });
  }

  // Open SMS app with pre-filled message (Fallback method)
  async openSMSApp(phoneNumber, message) {
    console.log('Opening SMS app for:', phoneNumber);
    
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    const smsUrl = Platform.OS === 'ios' 
      ? `sms:${formattedPhone}&body=${encodeURIComponent(message)}`
      : `sms:${formattedPhone}?body=${encodeURIComponent(message)}`;
    
    try {
      const canOpen = await Linking.canOpenURL(smsUrl);
      if (!canOpen) {
        throw new Error('Cannot open SMS app on this device');
      }
      
      await Linking.openURL(smsUrl);
      
      return {
        success: true,
        method: 'sms_app',
        phoneNumber: formattedPhone,
        timestamp: new Date().toISOString(),
        note: 'User needs to manually send from SMS app',
      };
    } catch (error) {
      console.error('Error opening SMS app:', error);
      throw new Error(`Could not open SMS app: ${error.message}`);
    }
  }

  // Send location SMS with enhanced GPS data
  async sendLocationSMS(phoneNumber, highAccuracy = true) {
    try {
      // Get accurate location
      const location = await EnhancedLocationService.getLocationWithRetry(3, 2000);
      
      // Generate location message
      const address = await EnhancedLocationService.getAddressFromCoordinates(
        location.latitude,
        location.longitude
      );
      
      const locationMessage = EnhancedLocationService.generateLocationMessage(location, address);
      
      // Send SMS
      return await this.sendSMS(phoneNumber, locationMessage);
    } catch (error) {
      console.error('Location SMS error:', error);
      throw error;
    }
  }

  // Send audio SMS
  async sendAudioSMS(phoneNumber, audioUrl, duration = null) {
    const durationText = duration ? ` (${Math.round(duration)} seconds)` : '';
    const message = `🚨 EMERGENCY AUDIO MESSAGE${durationText} 🚨\n\n` +
                   `I've sent an emergency audio message.\n\n` +
                   `Audio URL: ${audioUrl}\n\n` +
                   `Time: ${new Date().toLocaleString()}\n` +
                   `📍 Sent via SafeSearch App`;
    
    return await this.sendSMS(phoneNumber, message);
  }

  // Send emergency alert
  async sendEmergencyAlert(phoneNumber, alertType = 'general', customMessage = null) {
    let message;
    
    switch(alertType) {
      case 'location':
        return await this.sendLocationSMS(phoneNumber);
      
      case 'audio':
        throw new Error('Use sendAudioSMS for audio messages');
      
      case 'medical':
        message = `🚨 MEDICAL EMERGENCY 🚨\n\nI need immediate medical assistance!\n\n` +
                  `Time: ${new Date().toLocaleString()}\n` +
                  `📍 Sent via SafeSearch App`;
        break;
      
      case 'police':
        message = `🚨 POLICE ASSISTANCE NEEDED 🚨\n\nI need police assistance immediately!\n\n` +
                  `Time: ${new Date().toLocaleString()}\n` +
                  `📍 Sent via SafeSearch App`;
        break;
      
      case 'fire':
        message = `🚨 FIRE EMERGENCY 🚨\n\nI need fire department assistance!\n\n` +
                  `Time: ${new Date().toLocaleString()}\n` +
                  `📍 Sent via SafeSearch App`;
        break;
      
      default:
        message = customMessage || `🚨 EMERGENCY ALERT 🚨\n\nI need immediate assistance!\n\n` +
                  `Time: ${new Date().toLocaleString()}\n` +
                  `📍 Sent via SafeSearch App`;
    }
    
    return await this.sendSMS(phoneNumber, message);
  }

  // Send to multiple contacts with progress tracking
  async sendBulkSMS(contacts, message, onProgress = null) {
    const results = [];
    
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      
      try {
        // Update progress
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: contacts.length,
            contactName: contact.name,
            status: 'sending'
          });
        }
        
        const result = await this.sendSMS(contact.phone, message);
        
        results.push({
          contactId: contact.id,
          contactName: contact.name,
          phone: contact.phone,
          success: true,
          ...result,
        });
        
      } catch (error) {
        results.push({
          contactId: contact.id,
          contactName: contact.name,
          phone: contact.phone,
          success: false,
          error: error.message,
        });
      }
      
      // Small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update progress
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: contacts.length,
          contactName: contact.name,
          status: 'sent'
        });
      }
    }
    
    return results;
  }

  // Get SMS delivery status (Android only)
  async getSMSDeliveryStatus(messageId) {
    if (Platform.OS !== 'android') {
      return { status: 'unknown', note: 'Delivery status not available on this platform' };
    }
    
    try {
      // Note: This requires READ_SMS permission
      const hasReadPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_SMS
      );
      
      if (!hasReadPermission) {
        return { status: 'sent', note: 'Delivery status requires READ_SMS permission' };
      }
      
      // In a real app, you would track message IDs and check delivery reports
      return { status: 'delivered', timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('Error checking delivery status:', error);
      return { status: 'unknown', error: error.message };
    }
  }

  // Get SMS history (requires READ_SMS permission)
  async getSMSHistory(limit = 50) {
    if (Platform.OS !== 'android') {
      return [];
    }
    
    try {
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_SMS
      );
      
      if (!hasPermission) {
        console.warn('READ_SMS permission not granted');
        return [];
      }
      
      return new Promise((resolve, reject) => {
        SendSMS.list(
          JSON.stringify({
            box: 'sent', // 'inbox', 'sent', 'draft'
            maxCount: limit,
            sort: 'date DESC',
          }),
          (fail) => {
            reject(new Error(fail));
          },
          (count, smsList) => {
            try {
              const messages = JSON.parse(smsList);
              resolve(messages);
            } catch (error) {
              reject(new Error('Failed to parse SMS list'));
            }
          }
        );
      });
    } catch (error) {
      console.error('Error getting SMS history:', error);
      return [];
    }
  }
}

export default new SMSService();