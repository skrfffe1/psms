import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import Toast from 'react-native-toast-message';

interface Supply {
  supplyName: string;
  quantity: string;
  description: string;
  category: string;
}

interface EditSupplyScreenProps {
  navigation: StackNavigationProp<RootStackParamList, 'EditSupply'>;
  setRefreshSupplyList: React.Dispatch<React.SetStateAction<boolean>>;
}

type EditSupplyRouteProp = RouteProp<RootStackParamList, 'EditSupply'>;

const EditSupplyScreen: React.FC<EditSupplyScreenProps> = ({ navigation }) => {
  const route = useRoute<EditSupplyRouteProp>();
  const { id } = route.params;
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

  useEffect(() => {
    const fetchSupply = async () => {
      try {
        const docRef = doc(db, 'supplies', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const supplyData = docSnap.data() as Supply;
          setSupplyName(supplyData.supplyName);
          setQuantity(supplyData.quantity);
          setCategory(supplyData.category || '');
          setDescription(supplyData.description || '');
        } else {
          Toast.show({ type: 'error', text1: 'Supply not found.' });
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error fetching supply:', error);
        Toast.show({ type: 'error', text1: 'Failed to load supply.' });
      } finally {
        setLoading(false);
      }
    };
    fetchSupply();
  }, [id, navigation]);

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
      navigation.goBack(); // Use goBack to return to ViewSupplyScreen
    } catch (error) {
      console.error('Error updating supply:', error);
      Toast.show({ type: 'error', text1: 'Failed to update supply.' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Supply Name</Text>
      <TextInput
        style={styles.input}
        value={supplyName}
        onChangeText={setSupplyName}
        placeholder="Enter supply name"
      />

      <Text style={styles.label}>Quantity</Text>
      <TextInput
        style={styles.input}
        value={quantity}
        onChangeText={setQuantity}
        placeholder="Enter quantity"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="Enter description"
      />

      <Text style={styles.label}>Category</Text>
      <Picker
        selectedValue={category}
        style={styles.picker}
        onValueChange={(itemValue) => setCategory(itemValue)}
      >
        {itemValues.map((item) => (
          <Picker.Item key={item} label={item} value={item} />
        ))}
      </Picker>

      <Button title="Update Supply" onPress={handleUpdateSupply} disabled={loading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 4,
    marginBottom: 12,
  },
  picker: {
    height: 50,
    width: '100%',
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 12,
  },
});

export default EditSupplyScreen;
