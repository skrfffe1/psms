import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { globalStyles } from '@/styles/global';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy, FirestoreError } from 'firebase/firestore'; // Import FirestoreError
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
  requesterFirstName: string;
  requesterLastName: string;
  issuedAt: Date | null;
  returnedAt: Date | null;
  conditionOnReturn: string | null;
  status: string;
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

  // Fetch logs for the current user, specifically for items that are currently checked out
  const fetchLogs = useCallback(async () => {
    if (!user) {
      console.log('fetchLogs: User is not defined. Exiting.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('fetchLogs: Fetching logs for user:', user);
      //  Simplest possible query - get everything in 'issuanceLogs'
      const logsQuery = query(
        collection(db, "issuanceLogs"), // Replace with your collection name
        where("requester", "==", user)
      );
      
      getDocs(logsQuery).then(snapshot => {
        snapshot.forEach(doc => console.log(doc.id, doc.data()));
      });

      console.log('fetchLogs: Query created:', logsQuery);

      const logsSnapshot = await getDocs(logsQuery);
      console.log('fetchLogs: Number of logs found:', logsSnapshot.size);

      if (logsSnapshot.empty) {
        console.log('fetchLogs: No logs found at all in Firestore.');
        setLogs([]);
        Alert.alert(
          'No Items Found',  // Changed alert title
          'There are no items in the issuance logs.', // More general message
          [{ text: 'OK', onPress: () => navigation.canGoBack() ? navigation.goBack() : null }]
        );
        setLoading(false);
        return;
      }

      const userLogs = logsSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('fetchLogs: Log data for doc ID', doc.id, ':', data);  //show all the data
        return {
          id: doc.id,
          supplyName: data.supplyName,
          supplyId: data.supplyId,
          requester: data.requester,
          requesterFirstName: data.requesterFirstName,
          requesterLastName: data.requesterLastName,
          issuedAt: data.issuedAt?.toDate() || null,
          returnedAt: data.returnedAt?.toDate() || null,
          conditionOnReturn: data.conditionOnReturn || null,
          status: data.status || '',
        };
      });
      setLogs(userLogs);
      console.log('fetchLogs: Fetched logs:', userLogs);

    } catch (error: any) {
      console.error('fetchLogs: Error fetching logs:', error);
      Alert.alert('Error', `Failed to load items: ${error.message}`);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, [user, navigation]);

  // Get User ID
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        setUser(authUser.uid);
        console.log('useEffect: User ID set to:', authUser.uid);
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
        requesterFirstName: selectedLog.requesterFirstName,
        requesterLastName: selectedLog.requesterLastName,
        requester: user,
        reason,
        requestDate: serverTimestamp(),
        status: 'pending',
        logId: selectedLog.id, // Add the logId
      });

      console.log("Document written with ID: ", docRef.id);
      Alert.alert('Success', 'Request submitted ✅', [{ text: 'OK', onPress: () => navigation.canGoBack() }]);
    } catch (error: any) {
      console.error('Error submitting request:', error.message);
      Alert.alert('Error', `Failed to submit maintenance request: ${error.message}`);
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

