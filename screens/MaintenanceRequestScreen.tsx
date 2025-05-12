import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { globalStyles } from '@/styles/global';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import { Button, Card, TextInput } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { getAuth } from 'firebase/auth';

interface Log {
  id: string;
  supplyName: string;
  supplyId: string;
  requester: string;
  issuedAt: Date | null;
  returnedAt: Date | null;
  conditionOnReturn: string | null;
  status: string; // Added status field to Log
}

interface MaintenanceRequestScreenProps {
  navigation: StackNavigationProp<RootStackParamList, 'MaintenanceRequest'>;
}

const MaintenanceRequestScreen = ({ navigation }: MaintenanceRequestScreenProps) => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [selectedLogId, setSelectedLogId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState('');
  const auth = getAuth();

  // Fetch logs for the current user
  const fetchLogs = useCallback(async () => {
    if (!user) {
      console.log('fetchLogs: User is not defined. Exiting.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('fetchLogs: Fetching logs for user:', user);
      // Query for issuanceLogs where the requester is the current user AND the status is "Approved" AND returnedAt is null
      const logsQuery = query(
        collection(db, 'issuanceLogs'),
        where('requester', '==', user),
        where('status', '==', 'Approved'), // Only fetch approved items
        where('returnedAt', '==', null),
        orderBy('issuedAt', 'desc')
      );
      const logsSnapshot = await getDocs(logsQuery);
      console.log('fetchLogs: Number of logs found:', logsSnapshot.size);
      const userLogs = logsSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('fetchLogs: Log data:', data);
        return {
          id: doc.id,
          supplyName: data.supplyName,
          supplyId: data.supplyId,
          requester: data.requester,
          issuedAt: data.issuedAt?.toDate() || null,
          returnedAt: data.returnedAt?.toDate() || null,
          conditionOnReturn: data.conditionOnReturn || null,
          status: data.status || '', // Get the status of the item
        };
      });
      setLogs(userLogs);
      console.log('fetchLogs: Fetched logs:', userLogs);

      if (userLogs.length === 0) {
        Alert.alert(
          'No Items Found',
          'You currently have no approved items to request maintenance for.',
          [{ text: 'OK', onPress: () => navigation.canGoBack() ? navigation.goBack() : null }] // Check if canGoBack
        );
      }
    } catch (error: any) {
      console.error('fetchLogs: Error fetching logs:', error.message);
      Alert.alert('Error', `Failed to load your approved borrowed items: ${error.message}`); // Improved error message
    } finally {
      setLoading(false);
    }
  }, [user, navigation]); // Dependency on user and navigation

  // Get User ID
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        setUser(authUser.uid);
        console.log('useEffect: User ID set to:', authUser.uid); // Log the user ID
      } else {
        setUser('');
        setLogs([]);
        setLoading(false);
        console.log('useEffect: User is logged out.');
      }
    });

    return () => unsubscribe();
  }, [auth]);

  // Call fetchLogs whenever the user state changes
  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [fetchLogs, user]);

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
      const docRef = await addDoc(collection(db, 'maintenanceRequests'), {
        supplyId: selectedLog.supplyId,
        supplyName: selectedLog.supplyName,
        requester: user,
        reason,
        requestDate: serverTimestamp(),
        status: 'pending',
      });

      console.log("Document written with ID: ", docRef.id); // Added log
      Alert.alert('Success', 'Request submitted ✅', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error: any) {
      console.error('Error submitting request:', error.message);
      Alert.alert('Error', `Failed to submit maintenance request: ${error.message}`); // Improved error message
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
            placeholder="Reason for Maintenance"
            autoCapitalize="sentences"
            returnKeyType="done"
          />
          <Button
            style={styles.btn}
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            icon="wrench"
            labelStyle={{ color: '#09090b' }}
            elevation={5}
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
    backgroundColor: '#1c398e',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  picker: {
    marginBottom: 15,
    width: '100%',
    backgroundColor: '#fafaf9',
    color: '#0c0a09',
  },
  input: {
    marginBottom: 10,
    width: '100%',
    backgroundColor: '#fafaf9',
  },
  btn: {
    marginTop: 10,
    width: '48%',
    backgroundColor: '#ffcc00',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MaintenanceRequestScreen;
