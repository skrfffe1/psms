import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { globalStyles } from '@/styles/global';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';

export default function RequestSupplyScreen() {
  const router = useRouter();
  const [category, setCategory] = useState('');
  const [supplyName, setSupplyName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  const itemValues = [
    'Office Supplies',
    'Electronics',
    'Furniture',
    'Medical Supplies',
    'Other',
  ];

  const handleSubmit = async () => {
    if (!category.trim() || !supplyName.trim() || !quantity.trim() || !reason.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      await addDoc(collection(db, 'requests'), {
        category,
        supplyName,
        quantity: parseInt(quantity),
        reason,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Supply request sent successfully! ✅');
      router.back(); // Go back to dashboard after submitting
    } catch (error) {
      console.error('Error sending request:', error.message);
      Alert.alert('Error', 'Failed to send request.');
    }
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.header}>Request Supplies</Text>

      <View style={globalStyles.card}>
        {/* Category Picker */}
        <Picker
          selectedValue={category}
          onValueChange={(itemValue) => setCategory(itemValue)}
          style={[styles.input, { marginBottom: 15 }]}
        >
          <Picker.Item label="Select Category..." value="" />
          {itemValues.map((item, index) => (
            <Picker.Item key={index} label={item} value={item} />
          ))}
        </Picker>

        {/* Supply Name Input */}
        <TextInput
          style={styles.input}
          placeholder="Supply Name"
          value={supplyName}
          onChangeText={setSupplyName}
        />

        {/* Quantity Input */}
        <TextInput
          style={styles.input}
          placeholder="Quantity Needed"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
        />

        {/* Reason Input */}
        <TextInput
          style={[styles.input, { height: 100 }]}
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
