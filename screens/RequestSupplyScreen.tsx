import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { globalStyles } from '@/styles/global';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import { Button, Card, TextInput } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack'; // Added
import { RootStackParamList } from '@/types/navigation'; // Added


interface Supply {
  id: string;
  supplyName: string;
  category: string;
  quantity: number;
}

interface RequestSupplyScreenProps {
  navigation: StackNavigationProp<RootStackParamList, 'RequestSupply'>; // Added navigation
}

const RequestSupplyScreen = ({ navigation }: RequestSupplyScreenProps) => { // Added navigation
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [selectedSupplyId, setSelectedSupplyId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [requester, setRequester] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false); // Added loading state


  // Fetch available supplies
  useEffect(() => {
    const fetchSupplies = async () => {
      setLoading(true); //start loading
      try {
        const snapshot = await getDocs(collection(db, 'supplies'));
        const availableSupplies = snapshot.docs
          .map(doc => {
            const data = doc.data() as Supply;
            const { id, ...rest } = data;
            return { id: doc.id, ...rest };
          })
          .filter(item => item.quantity > 0);
        setSupplies(availableSupplies);
      } catch (error: any) {
        console.error('Error fetching supplies:', error.message);
        Alert.alert('Error', 'Failed to load supplies');
      } finally {
        setLoading(false); //stop loading
      }
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

    const qty = parseInt(quantity, 10); //added radix
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Error', 'Invalid quantity.');
      return;
    }

    if (qty > selectedSupply.quantity) {
      Alert.alert('Insufficient Stock', `Only ${selectedSupply.quantity} available.`);
      return;
    }
    setLoading(true); // start loading
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

      Alert.alert('Success', 'Request submitted ✅', [{ text: 'OK', onPress: () => navigation.goBack() }]); //added navigation
    } catch (error: any) {
      console.error('Error:', error.message);
      Alert.alert('Error', 'Failed to submit request.');
    } finally {
      setLoading(false); //stop loading
    }
  };

  //render
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
            selectedValue={selectedSupplyId}
            onValueChange={(itemValue) => setSelectedSupplyId(itemValue)}
            style={[styles.input, styles.picker]}
            mode="dropdown"
            dropdownIconColor="#fff"
            dropdownIconRippleColor="#fff"
          >
            <Picker.Item label="Select Supply" value="" />
            {supplies.map((supply) => (
              <Picker.Item key={supply.id} label={supply.supplyName} value={supply.id} />
            ))}
          </Picker>

          <TextInput
            style={styles.input}
            value={requester}
            onChangeText={text => setRequester(text)} // Trim input
            mode="outlined"
            placeholder="Requester Name"
            autoCapitalize="words" // Improve input
            autoCorrect={false}
            returnKeyType="next"
            label="Requester Name"
          />
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={text => setQuantity(text.trim())} // Trim
            mode="outlined"
            placeholder="Quantity"
            keyboardType="number-pad" // Use number-pad
            returnKeyType="done"
            label="Quantity"
          />
          <TextInput
            style={styles.input}
            value={reason}
            onChangeText={text => setReason(text.trim())} // Trim
            mode="outlined"
            placeholder="Reason for Request"
            autoCapitalize="sentences"
            returnKeyType="done"
            label="Reason for Request"
          />
          <Button
            style={styles.btn}
            mode="contained"
            onPress={handleSubmit}
            icon="cart-plus"
            loading={loading} // Disable button when loading
          >
            Request Supply
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

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
  btn: {
    marginTop: 10,
    width: '80%',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RequestSupplyScreen;
