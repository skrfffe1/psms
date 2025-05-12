import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { globalStyles } from '@/styles/global';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp, getDocs, doc, getDoc } from 'firebase/firestore'; // Import doc and getDoc
import { Picker } from '@react-native-picker/picker';
import { Button, Card, TextInput } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { useAuth } from '../context/AuthContext';

interface Supply {
  id: string;
  supplyName: string;
  category: string;
  quantity: number;
}

interface RequestSupplyScreenProps {
  navigation: StackNavigationProp<RootStackParamList, 'RequestSupply'>;
}

const RequestSupplyScreen = ({ navigation }: RequestSupplyScreenProps) => {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [selectedSupplyId, setSelectedSupplyId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Fetch available supplies
  useEffect(() => {
    const fetchSupplies = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, 'supplies'));
        const availableSupplies = snapshot.docs.map(doc => {
          const data = doc.data() as Supply;
          const { id: _, ...rest } = data;
          return { id: doc.id, ...rest };
        }).filter(item => item.quantity > 0);
        setSupplies(availableSupplies);
      } catch (error: any) {
        console.error('Error fetching supplies:', error.message);
        Alert.alert('Error', 'Failed to load supplies');
      } finally {
        setLoading(false);
      }
    };
    fetchSupplies();
  }, []);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data() as { firstName: string; lastName: string };
            setFirstName(userData.firstName);
            setLastName(userData.lastName);
          } else {
            console.warn("User document not found in 'users' collection.");
            // Handle the case where the user document doesn't exist.
            setFirstName('');
            setLastName('');
          }
        } catch (error) {
          console.error("Error fetching user data: ", error);
          Alert.alert("Error", "Failed to load user data. Please check your connection.");
          setFirstName('');
          setLastName('');
        }
      }
    };
    fetchUserData();
  }, [user]);

  const handleSubmit = async () => {
    if (!selectedSupplyId || !quantity.trim() || !reason.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    const selectedSupply = supplies.find(s => s.id === selectedSupplyId);
    if (!selectedSupply) {
      Alert.alert('Error', 'Selected supply not found.');
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Error', 'Invalid quantity.');
      return;
    }

    if (qty > selectedSupply.quantity) {
      Alert.alert('Insufficient Stock', `Only ${selectedSupply.quantity} available.`);
      return;
    }

    setLoading(true);
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }
      await addDoc(collection(db, 'requests'), {
        supplyId: selectedSupplyId,
        supplyName: selectedSupply.supplyName,
        category: selectedSupply.category,
        quantity: qty,
        reason,
        requester: user.uid,
        requesterFirstName: firstName, // Save first name
        requesterLastName: lastName,   // Save last name
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      Alert.alert(
        'Success',
        'Request submitted ✅',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Error:', error.message);
      Alert.alert('Error', error.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  // Render
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
            textColor='#0c0a09'
            style={styles.input}
            value={reason}
            onChangeText={(text) => setReason(text)}
            mode="outlined"
            placeholder="Reason for Request"
            autoCapitalize="sentences"
            returnKeyType="done"
          />
          <TextInput
            mode='outlined'
            textColor='#0c0a09'
            style={styles.input}
            value={quantity}
            onChangeText={(text) => setQuantity(text)}       
            placeholder="Quantity"
            keyboardType="number-pad"
            returnKeyType="done"
          />
          <Button
            style={styles.btn}
            mode="elevated"
            onPress={handleSubmit}
            icon="cart-plus"
            loading={loading}
            labelStyle={{ color: '#09090b' }}           
          >
            Request
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
    backgroundColor: '#FAFAFA',
  },
  card: {
    width: '90%',
    backgroundColor: '#1c398e',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  picker: {
    marginBottom: 15,
    width: '100%',
    backgroundColor: '#fafafa',
    color: '#0c0a09',
  },
  input: {
    marginBottom: 10,
    width: '100%',
    backgroundColor: '#fafafa',
    color: '#0c0a09',
  },
  btn: {
    marginTop: 10,
    width: '45%',
    backgroundColor: '#ffcc00',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RequestSupplyScreen;
