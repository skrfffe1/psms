import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { globalStyles } from '@/styles/global';
import { db } from '@/firebase/config';
import {
  collection, addDoc, serverTimestamp, getDocs, updateDoc, doc
} from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';

export default function RequestSupplyScreen() {
  const router = useRouter();
  const [supplies, setSupplies] = useState([]);
  const [selectedSupplyId, setSelectedSupplyId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [requester, setRequester] = useState('');
  const [reason, setReason] = useState('');

  // Fetch available supplies
  useEffect(() => {
    const fetchSupplies = async () => {
      const snapshot = await getDocs(collection(db, 'supplies'));
      const availableSupplies = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => item.quantity > 0);
      setSupplies(availableSupplies);
    };
    fetchSupplies();
  }, []);

  const handleSubmit = async () => {
    if (!selectedSupplyId || !quantity.trim() || !reason.trim() || !requester.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
  
    const selectedSupply = supplies.find(s => s.id === selectedSupplyId);
    if (!selectedSupply) {
      Alert.alert('Error', 'Selected supply not found.');
      return;
    }
  
    const qty = parseInt(quantity);
    if (qty > selectedSupply.quantity) {
      Alert.alert('Insufficient Stock', `Only ${selectedSupply.quantity} available.`);
      return;
    }
  
    try {
      await addDoc(collection(db, 'requests'), {
        supplyId: selectedSupplyId,
        supplyName: selectedSupply.supplyName,
        category: selectedSupply.category,
        quantity: qty,
        reason,
        requester,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
  
      Alert.alert('Success', 'Request submitted ✅');
      router.back();
    } catch (error) {
      console.error('Error:', error.message);
      Alert.alert('Error', 'Failed to submit request.');
    }
  };
  

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.header}>Request Supplies</Text>

      <View style={globalStyles.card}>
        {/* Supply Picker */}
        <Picker
          selectedValue={selectedSupplyId}
          onValueChange={(itemValue) => setSelectedSupplyId(String(itemValue))}
          style={[styles.input, { marginBottom: 15 }]}
        >
          <Picker.Item label="Select Supply..." value="" />
          {supplies.map((item) => (
            <Picker.Item
              key={item.id}
              label={`${item.supplyName} (${item.quantity} available)`}
              value={item.id}
            />
          ))}
        </Picker>

        {/* Quantity Input */}
        <TextInput
          style={styles.input}
          placeholder="Quantity Needed"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
        />

        {/* Requester */}
        <TextInput
          style={[styles.input, { height: 45 }]}
          placeholder="Requester Name"
          value={requester}
          onChangeText={setRequester}
          multiline
        />

        {/* Reason Input */}
        <TextInput
          style={[styles.input, { height: 45 }]}
          placeholder="Reason for Request"
          value={reason}
          onChangeText={setReason}
          multiline
        />

        {/* Submit Button */}
        <TouchableOpacity style={globalStyles.button} onPress={handleSubmit}>
          <Text style={globalStyles.buttonText}>Submit Request</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    fontSize: 16,
  },
});
