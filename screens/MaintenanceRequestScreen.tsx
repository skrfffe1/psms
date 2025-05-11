import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import {  useNavigation } from '@react-navigation/native';
import { globalStyles } from '@/styles/global';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import { Button, Card, TextInput } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';

interface Log {
  id: string;
  supplyName: string;
  supplyId: string;
  requester: string;
  issuedAt: Date | null;
  returnedAt: Date | null;
  conditionOnReturn: string | null;
}

interface MaintenanceRequestScreenProps {
  navigation: StackNavigationProp<RootStackParamList, 'MaintenanceRequest'>;
}

const MaintenanceRequestScreen = ({ navigation }: MaintenanceRequestScreenProps) => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [selectedLogId, setSelectedLogId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true); // Added loading state
  const [user, setUser] = useState('Staff User'); //Simplified user.  Replace with actual user data.

  // Fetch logs for the current user
    useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        // 1. Get logs where the current user is the requester AND the item has been issued but not returned.
        const logsQuery = query(
          collection(db, 'issuanceLogs'),
          where('requester', '==', user), // Replace 'currentUser' with actual user identifier
          where('returnedAt', '==', null) // Only get items not yet returned
        );

        const logsSnapshot = await getDocs(logsQuery);
        const userLogs = logsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            supplyName: data.supplyName,
            supplyId: data.supplyId,
            requester: data.requester,
            issuedAt: data.issuedAt?.toDate() || null,  // Convert to Date
            returnedAt: data.returnedAt?.toDate() || null,
            conditionOnReturn: data.conditionOnReturn || null,
          };
        });
        setLogs(userLogs);
      } catch (error: any) {
        console.error('Error fetching logs:', error.message);
        Alert.alert('Error', 'Failed to load your borrowed items.');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [user]);

  const handleSubmit = async () => {
    if (!selectedLogId || !reason.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    const selectedLog = logs.find(log => log.id === selectedLogId);
     if (!selectedLog) {
      Alert.alert('Error', 'Selected item log not found.');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'maintenanceRequests'), {
        supplyId: selectedLog.supplyId,
        supplyName: selectedLog.supplyName,
        requester: user, // Use the user variable
        reason,
        requestDate: serverTimestamp(),
        status: 'pending', // Initial status
      });

      Alert.alert('Success', 'Request submitted ✅', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error: any) {
      console.error('Error submitting request:', error.message);
      Alert.alert('Error', 'Failed to submit maintenance request.');
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
            selectedValue={selectedLogId}
            onValueChange={(itemValue) => setSelectedLogId(itemValue)}
            style={[styles.input, styles.picker]}
            mode="dropdown"
            dropdownIconColor="#fff"
          >
            <Picker.Item label="Select Item" value="" />
            {logs.map((log) => (
              <Picker.Item key={log.id} label={log.supplyName} value={log.id} />
            ))}
          </Picker>

          <TextInput
            style={styles.input}
            value={reason}
            onChangeText={text => setReason(text.trim())}
            mode="outlined"
            placeholder="Reason for Maintenance"
            autoCapitalize="sentences"
            returnKeyType="done"
            label="Reason for Maintenance"
          />
          <Button
            style={styles.btn}
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            icon="wrench"
          >
            Request Maintenance
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
    backgroundColor: '#222831',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  picker: {
    marginBottom: 15,
    width: '100%',
    backgroundColor: '#222831',
    color: '#fff',
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

export default MaintenanceRequestScreen;
