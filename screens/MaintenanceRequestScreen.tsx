import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Alert, ActivityIndicator, Text } from 'react-native';

import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import { Button, Card, TextInput, PaperProvider } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { getAuth } from 'firebase/auth';
import { ScrollView } from 'react-native';

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
  const [error, setError] = useState<string | null>(null);

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
      //  Query to get logs for the current user
      const logsQuery = query(
        collection(db, "issuanceLogs"),
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
          'No Items Found',
          'There are no items associated with your account.',
          [{ text: 'OK', onPress: () => navigation.canGoBack() ? navigation.goBack() : null }]
        );
        setLoading(false);
        return;
      }

      const userLogs = logsSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('fetchLogs: Log data for doc ID', doc.id, ':', data);
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
      setError('Please fill in all fields.');
      return;
    }
    setError(null); // Clear error on new submission attempt

    const selectedLog = logs.find(log => log.id === selectedLogId);
    if (!selectedLog) {
      setError('Selected item log not found.');
      return;
    }

    setLoading(true);
    try {
      // **Add this query to validate the log**
      const logQuery = query(
        collection(db, 'issuanceLogs'),
        where('id', '==', selectedLogId),
        where('requester', '==', user)
      );
      const logSnapshot = await getDocs(logQuery);

      if (logSnapshot.empty) {
        Alert.alert(
          'Error',
          'The selected item log is not valid. It does not belong to the current user, or does not exist.'
        );
        setLoading(false);
        return;
      }
      // If the query succeeds, proceed with submitting the maintenance request
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
      Alert.alert('Success', 'Request submitted ✅', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error: any) {
      console.error('Error submitting request:', error.message);
      Alert.alert('Error', `Failed to submit maintenance request: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <PaperProvider>
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card} mode="outlined">
          <Card.Content style={styles.center}>
            <Text style={styles.title}>Maintenance Request</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedLogId}
                onValueChange={(itemValue) => setSelectedLogId(itemValue)}
                style={[styles.picker, { backgroundColor: '#f5f5f4', color: '#0c0a09' }]}
                mode="dropdown"
                dropdownIconColor="#0c0a09"
              >
                <Picker.Item label="Select Item" value="" />
                {logs.map((log) => {
                  const displayLabel = `${log.supplyName} (ID: ${log.supplyId.substring(0, 8)})`;
                  return (
                    <Picker.Item key={log.id} label={displayLabel} value={log.id} />
                  );
                })}
              </Picker>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: '#f5f5f4' }]}
              value={reason}
              onChangeText={text => setReason(text.trim())}
              placeholder="Reason for Maintenance"
              autoCapitalize="sentences"
              returnKeyType="done"
              placeholderTextColor={'#a6a09b'}
              underlineColor='#0c0a09'
              activeUnderlineColor='#57534d'
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
            <Button
              style={[styles.btn]}
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              labelStyle={{ color: '#fafaf9' }}
              disabled={loading}

            >
              Request Maintenance
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    paddingVertical: 20,
  },
  card: {
    width: '90%',
    backgroundColor: '#fafaf9',
    borderRadius: 8,
    elevation: 2,
    marginTop: 10,
  },
  picker: {
    width: '100%',
    color: '#0c0a09',
  },
  pickerContainer: {
    marginBottom: 15,
    width: '100%',
  },
  input: {
    marginBottom: 10,
    width: '100%',
  },
  btn: {
    marginTop: 10,
    width: '100%',
    height: 40,
    backgroundColor: '#1c398e',
    borderRadius: 5,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    color: '#0c0a09',
    fontFamily: 'roboto',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  errorText: {
    color: '#FF6B6B',
    marginBottom: 10,
    fontSize: 14,
    alignSelf: 'flex-start',
  },
});

export default MaintenanceRequestScreen;
