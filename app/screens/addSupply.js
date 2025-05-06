import * as React from 'react';
import { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { globalStyles } from '@/styles/global';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

import { Button, Card, TextInput } from 'react-native-paper';
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
      <View style={styles.container}>
        <Card  style={styles.card}>
          <Card.Content style={styles.center}>
            <Picker
              selectedValue={category}
              onValueChange={(itemValue) => setCategory(itemValue)}
              style={[styles.input, styles.picker]}
              mode="dropdown"
              dropdownIconColor="#fff"
              dropdownIconRippleColor="#fff"
              itemStyle={{ color: '#fff' }}
              selectedItemStyle={{ color: '#fff' }}
              
            >
              <Picker.Item label="Select Category..." value="" />
              {itemValues.map((item, index) => (
                <Picker.Item key={index} label={item} value={item} />
              ))}
            </Picker>
            <TextInput
              style={styles.input}
              value={supplyName}
              onChangeText={text => setSupplyName(text)}
              mode="outlined"
              placeholder=""
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="default"

              returnKeyType="next"
              onFocus={() => setSupplyName('')}
              onBlur={() => setSupplyName(supplyName.trim())}
              label="Supply Name"
              right={<TextInput.Icon icon={'cart'} />}
            />
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={text => setQuantity(text)}
              mode="outlined"
              placeholder=""
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onFocus={() => setQuantity('')}
              onBlur={() => setQuantity(quantity.trim())}
              label="Quantity"
              secureTextEntry
              right={<TextInput.Icon icon="eye" />}
            />
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={text => setDescription(text)}
              mode="outlined"
              placeholder="Description"
              autoCapitalize="none"
              right={<TextInput.Icon icon="text" />}
            />
            <Button
              style={styles.btn}
              icon="plus"
              mode="contained"
              onPress={handleAddSupply}
            >
              Add Supply
            </Button>
          </Card.Content>
        </Card>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222831',
  },
  card: {
    width: '90%',
    backgroundColor: '#222831',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  picker: {
    marginBottom: 15,
    width: '100%',
    backgroundColor: '#222831',
    color: '#fff'
  },
  input: {
    marginBottom: 10,
    width: '100%',
  },
  text: {
    fontFamily: 'Poppins',
    marginBottom: 10,
  },
  btn: {
    marginTop: 10,
    width: '80%',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});