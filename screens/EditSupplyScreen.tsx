import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { globalStyles } from '@/styles/global';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useLocalSearchParams, router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Picker } from '@react-native-picker/picker';

interface Supply {
  supplyName: string;
  quantity: string;
  description: string;
  category: string;
}

interface EditSupplyScreenProps {}

export default function EditSupplyScreen(props: EditSupplyScreenProps) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [supply, setSupply] = useState<Supply | null>(null);
  const [supplyName, setSupplyName] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const itemValues: string[] = [
    'Office Supplies',
    'Electronics',
    'Furniture',
    'Medical Supplies',
    'Other',
  ];

  useEffect(() => {
    const fetchSupply = async () => {
      try {
        const docRef = doc(db, 'supplies', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const supplyData = docSnap.data() as Supply;
          setSupply(supplyData);
          setSupplyName(supplyData.supplyName);
          setQuantity(supplyData.quantity);
          setCategory(supplyData.category || '');
          setDescription(supplyData.description || '');
        } else {
          Toast.show({ type: 'error', text1: 'Supply not found.' });
          router.back();
        }
      } catch (error) {
        console.error('Error fetching supply:', error);
        Toast.show({ type: 'error', text1: 'Failed to load supply.' });
      } finally {
        setLoading(false);
      }
    };
    fetchSupply();
  }, [id]);

  const handleUpdateSupply = async () => {
    if (!supplyName || !quantity || !description || !category) {
      Toast.show({ type: 'error', text1: 'All fields are required!' });
      return;
    }

    setLoading(true);
    try {
      const supplyDocRef = doc(db, 'supplies', id);
      await updateDoc(supplyDocRef, {
        supplyName,
        quantity,
        description,
        category,
      });

      Toast.show({ type: 'success', text1: 'Supply updated successfully!' });
      router.replace('/supplies/viewSupplyScreen'); // Navigate back to supplies list
    } catch (error) {
      console.error('Error updating supply:', error);
      Toast.show({ type: 'error', text1: 'Failed to update supply.' });
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
      <Text style={[globalStyles.header, { fontSize: 24, marginBottom: 20 }]}>Edit Supply</Text>

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

      <TouchableOpacity style={globalStyles.button} onPress={handleUpdateSupply}>
        <Text style={globalStyles.buttonText}>Update</Text>
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