import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { globalStyles } from '@/styles/global';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Picker } from '@react-native-picker/picker';

export default function AddSupplyScreen(props) {
  const [supplyName, setSupplyName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const itemValues = [
    'Office Supplies',
    'Electronics',
    'Furniture',
    'Medical Supplies',
    'Other',
  ];

  const handleAddSupply = async () => {
    if (!supplyName || !quantity || !description || !category) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill in all fields.',
      });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'supplies'), {
        supplyName,
        quantity,
        description,
        category,
        createdAt: new Date(),
      });

      Toast.show({ type: 'success', text1: 'Supply added successfully!' });
      router.push('/supplies/viewSupplyScreen'); // Navigate back to supplies list
    } catch (error) {
      console.error('Error adding supply:', error);
      Toast.show({ type: 'error', text1: 'Error adding supply.' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={globalStyles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={[globalStyles.card, { marginTop: 150 }]}>
      <Text style={[globalStyles.title, { fontSize: 24, marginBottom: 20 }]}>Add Supply</Text>

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

      <TextInput
        style={[globalStyles.input, styles.input]}
        placeholder="Supply Name"
        value={supplyName}
        onChangeText={setSupplyName}
      />
      <TextInput
        style={[globalStyles.input, styles.input]}
        placeholder="Quantity"
        value={quantity}
        keyboardType="numeric"
        onChangeText={setQuantity}
      />
      <TextInput
        style={[globalStyles.input, styles.input]}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />

      <TouchableOpacity style={globalStyles.button} onPress={handleAddSupply}>
                <Text style={globalStyles.buttonText}>Add Supply</Text>
      </TouchableOpacity>
      <Toast />
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