import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Contacts from 'expo-contacts';
import { Image } from 'expo-image';
import { supabase } from '../lib/supabase';

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
}

interface SelectedFriend {
  id: string;
  name: string;
  phoneNumber: string;
  amount: number;
}

export default function SplitScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  // Step 1: Camera
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  // Step 2: Total amount
  const [totalAmount, setTotalAmount] = useState('');

  // Step 3: Contact Selection
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<SelectedFriend[]>([]);
  const [showContactPicker, setShowContactPicker] = useState(false);

  // Step 4: Split Calculation
  const [uploaderPhone, setUploaderPhone] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleCameraPermission = async () => {
    const { granted } = await requestPermission();
    if (granted) {
      setShowCamera(true);
    } else {
      Alert.alert('Camera permission required');
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });
      setPhotoUri(photo.uri);
      setShowCamera(false);
    }
  };

  const loadContacts = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === 'granted') {
      const allContacts = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });

      const formattedContacts = allContacts.contacts
        .filter(c => c.phoneNumbers && c.phoneNumbers.length > 0)
        .map(c => ({
          id: c.id,
          name: c.name || 'Unknown',
          phoneNumber: c.phoneNumbers[0].number || '',
        }));

      setContacts(formattedContacts);
      setShowContactPicker(true);
    } else {
      Alert.alert('Contacts permission required');
    }
  };

  const toggleFriend = (contact: Contact) => {
    const isSelected = selectedFriends.some(f => f.id === contact.id);
    if (isSelected) {
      setSelectedFriends(selectedFriends.filter(f => f.id !== contact.id));
    } else {
      const splitAmount = Number(totalAmount) / (selectedFriends.length + 2);
      setSelectedFriends([
        ...selectedFriends,
        {
          id: contact.id,
          name: contact.name,
          phoneNumber: contact.phoneNumber,
          amount: splitAmount,
        },
      ]);
    }
  };

  const calculateSplit = () => {
    const total = Number(totalAmount);
    const splitCount = selectedFriends.length;

    if (splitCount === 0) {
      Alert.alert('Select at least one friend');
      return;
    }

    const perPerson = total / splitCount;
    setSelectedFriends(
      selectedFriends.map(f => ({ ...f, amount: perPerson }))
    );
    setShowContactPicker(false);
  };

  const handleFinalize = async () => {
    if (!uploaderPhone || selectedFriends.length === 0 || !photoUri) {
      Alert.alert('Please complete all steps');
      return;
    }

    setIsUploading(true);
    try {
      // Upload image to Supabase
      const fileName = `receipts/${Date.now()}.jpg`;
      const response = await fetch(photoUri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      // Save split record
      const { data: splitRecord, error: insertError } = await supabase
        .from('splits')
        .insert({
          receipt_image_url: urlData.publicUrl,
          uploader_phone: uploaderPhone,
          total_amount: Number(totalAmount),
          split_data: selectedFriends.map(f => ({
            name: f.name,
            phone: f.phoneNumber,
            amount: f.amount,
          })),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Create split status records
      const statusRecords = selectedFriends.map(friend => ({
        split_id: splitRecord.id,
        recipient_phone: friend.phoneNumber,
        amount_owed: friend.amount,
        is_paid: false,
      }));

      await supabase.from('split_status').insert(statusRecords);

      // Send WhatsApp messages
      for (const friend of selectedFriends) {
        const message = `Hey ${friend.name}! I split a $${friend.amount.toFixed(2)} bill with you. Receipt: ${urlData.publicUrl}`;
        const encodedMsg = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${friend.phoneNumber.replace(/[^0-9]/g, '')}?text=${encodedMsg}`;
        try {
          await Linking.openURL(whatsappUrl);
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (e) {
          console.log('WhatsApp link error');
        }
      }

      Alert.alert('Success!', 'Split created and messages sent');

      // Reset
      setPhotoUri(null);
      setTotalAmount('');
      setSelectedFriends([]);
      setUploaderPhone('');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    }
    setIsUploading(false);
  };

  if (showCamera) {
    return (
      <CameraView ref={cameraRef} style={styles.camera}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={takePicture}>
            <Text style={styles.buttonText}>📸 Capture</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => setShowCamera(false)}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    );
  }

  if (showContactPicker) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Select Friends</Text>
        {contacts.map(contact => (
          <TouchableOpacity
            key={contact.id}
            style={[
              styles.contactItem,
              selectedFriends.some(f => f.id === contact.id) && styles.contactSelected,
            ]}
            onPress={() => toggleFriend(contact)}
          >
            <Text style={styles.contactName}>{contact.name}</Text>
            <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.primaryButton} onPress={calculateSplit}>
          <Text style={styles.primaryButtonText}>Next ({selectedFriends.length})</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Receipt Photo</Text>
        {photoUri ? (
          <View>
            <Image source={{ uri: photoUri }} style={styles.photo} />
            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: 10 }]}
              onPress={() => setPhotoUri(null)}
            >
              <Text style={styles.primaryButtonText}>Retake Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.primaryButton} onPress={handleCameraPermission}>
            <Text style={styles.primaryButtonText}>📷 Take Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      {photoUri && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Total Amount</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Enter amount ($):</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={totalAmount}
              onChangeText={setTotalAmount}
            />
          </View>

          {totalAmount && (
            <TouchableOpacity style={styles.primaryButton} onPress={loadContacts}>
              <Text style={styles.primaryButtonText}>👥 Select Friends</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {selectedFriends.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Your Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="+1234567890"
            keyboardType="phone-pad"
            value={uploaderPhone}
            onChangeText={setUploaderPhone}
          />

          <View style={styles.selectedList}>
            {selectedFriends.map(friend => (
              <View key={friend.id} style={styles.selectedItem}>
                <Text style={styles.friendName}>{friend.name}</Text>
                <Text style={styles.friendAmount}>${friend.amount.toFixed(2)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.summary}>
            <Text style={styles.summaryText}>Total: ${Number(totalAmount).toFixed(2)}</Text>
            <Text style={styles.summaryText}>Friends: {selectedFriends.length}</Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, styles.finalButton]}
            onPress={handleFinalize}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>✅ Create & Send</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 50,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#000',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  photo: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 10,
  },
  inputGroup: {
    marginTop: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  contactItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  contactSelected: {
    backgroundColor: '#e3f2fd',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  contactPhone: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  selectedList: {
    marginVertical: 16,
  },
  selectedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#f0f0f0',
    marginVertical: 4,
    borderRadius: 6,
  },
  friendName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  friendAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  summary: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#000',
    marginVertical: 4,
    fontWeight: '500',
  },
  finalButton: {
    marginTop: 16,
    paddingVertical: 14,
  },
});
