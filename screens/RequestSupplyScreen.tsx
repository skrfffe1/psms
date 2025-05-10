import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { globalStyles } from '@/styles/global';
import { db } from '@/firebase/config';
import {
  collection, addDoc, serverTimestamp, getDocs, updateDoc, doc
} from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import { Button, Card, TextInput } from 'react-native-paper';


export default function RequestSupplyScreen() {
  const router = useRouter();
  interface Supply {
    id: string;
    supplyName: string;
    category: string;
    quantity: number;
  }

  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [selectedSupplyId, setSelectedSupplyId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [requester, setRequester] = useState('');
  const [reason, setReason] = useState('');

  // Fetch available supplies
  useEffect(() => {
    const fetchSupplies = async () => {
      const snapshot = await getDocs(collection(db, 'supplies'));
      const availableSupplies = snapshot.docs
        .map(doc => {
          const { id, ...data } = doc.data() as Supply;
          return { id: doc.id, ...data };
        })
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
      console.error('Error:', (error as Error).message);
      Alert.alert('Error', 'Failed to submit request.');
    }
  };


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
            itemStyle={{ color: '#fff' }}
          >
            <Picker.Item label="Select Supply" value="" />
            {supplies.map((supply) => (
              <Picker.Item key={supply.id} label={supply.supplyName} value={supply.id} />
            ))}

          </Picker>

          <TextInput
            style={styles.input}
            value={requester}
            onChangeText={text => setRequester(text)}
            mode="outlined"
            placeholder="Requester Name"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onFocus={() => setRequester('')}
            onBlur={() => setRequester(requester.trim())}
            label="Requester Name"
          />
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={text => setQuantity(text)}
            mode="outlined"
            placeholder="Quantity"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="numeric"
            returnKeyType="done"
            onFocus={() => setQuantity('')}
            onBlur={() => setQuantity(quantity.trim())}
            label="Quantity"
          />
          <TextInput
            style={styles.input}
            value={reason}
            onChangeText={text => setReason(text)}
            mode="outlined"
            placeholder="Reason for Request"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onFocus={() => setReason('')}
            onBlur={() => setReason(reason.trim())}
            label="Reason for Request"
          />
          <Button
            style={styles.btn}
            mode="contained"
            onPress={handleSubmit}
            icon="cart-plus"
          >
            Request Supply
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
