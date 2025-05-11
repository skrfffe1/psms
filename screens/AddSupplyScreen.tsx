import * as React from 'react';
import { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { globalStyles } from '@/styles/global';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import {  useNavigation } from '@react-navigation/native'; // Changed
import Toast from 'react-native-toast-message';
import { Button, Card, TextInput } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { StackNavigationProp } from '@react-navigation/stack'; //Added
import { RootStackParamList } from '@/types/navigation'; //Added

interface AddSupplyScreenProps {
  navigation: StackNavigationProp<RootStackParamList, 'AddSupply'>; // Added navigation
}

interface Supply {
  supplyName: string;
  quantity: string;
  description: string;
  category: string;
  createdAt: Date;
}

export default function AddSupplyScreen({navigation}: AddSupplyScreenProps): JSX.Element { // Added navigation prop
  const [supplyName, setSupplyName] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const itemValues: string[] = [
    'Office Supplies',
    'Electronics',
    'Furniture',
    'Medical Supplies',
    'Other',
  ];

  const handleAddSupply = async (): Promise<void> => {
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
      const newSupply: Supply = {
        supplyName,
        quantity,
        description,
        category,
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'supplies'), newSupply);

      Toast.show({ type: 'success', text1: 'Supply added successfully!' });
      navigation.goBack(); // changed
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
      <Card style={styles.card}>
        <Card.Content style={styles.center}>
          <Picker
            selectedValue={category}
            onValueChange={(itemValue: string) => setCategory(itemValue)}
            style={[styles.input, styles.picker]}
            mode="dropdown"
            dropdownIconColor="#fff"
            dropdownIconRippleColor="#fff"
            itemStyle={{ color: '#fff' }}
          >
            <Picker.Item label="Select Category..." value="" />
            {itemValues.map((item, index) => (
              <Picker.Item key={index} label={item} value={item} />
            ))}
          </Picker>
          <TextInput
            style={styles.input}
            value={supplyName}
            onChangeText={(text: string) => setSupplyName(text)}
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
            onChangeText={(text: string) => setQuantity(text)}
            mode="outlined"
            placeholder=""
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onFocus={() => setQuantity('')}
            onBlur={() => setQuantity(quantity.trim())}
            label="Quantity"
            keyboardType="numeric" //added
            right={<TextInput.Icon icon="eye" />}
          />
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={(text: string) => setDescription(text)}
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
