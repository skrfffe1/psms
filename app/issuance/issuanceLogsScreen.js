import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput, Alert, ScrollView
} from 'react-native';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { globalStyles } from '@/styles/global';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export default function IssuanceLogsScreen() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editingLogId, setEditingLogId] = useState(null);
  const [conditionInput, setConditionInput] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    applyFilter(filter);
  }, [logs, filter]);

  const fetchLogs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'issuanceLogs'));
      const logData = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.issuedAt?.toDate() - a.issuedAt?.toDate());
      setLogs(logData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const applyFilter = (status) => {
    let filtered = logs;
    if (status === 'returned') {
      filtered = logs.filter(log => log.returnedAt);
    } else if (status === 'notReturned') {
      filtered = logs.filter(log => !log.returnedAt);
    }
    setFilteredLogs(filtered);
  };

  const markAsReturned = async (logId) => {
    if (!conditionInput.trim()) {
      Alert.alert('Error', 'Please enter condition on return.');
      return;
    }

    try {
      await updateDoc(doc(db, 'issuanceLogs', logId), {
        returnedAt: new Date(),
        conditionOnReturn: conditionInput,
      });
      Alert.alert('Success', 'Item marked as returned.');
      setEditingLogId(null);
      setConditionInput('');
      fetchLogs();
    } catch (error) {
      console.error('Error updating log:', error);
      Alert.alert('Error', 'Failed to update return info.');
    }
  };

  const generateReport = async () => {
    const lines = filteredLogs.map(item => {
      return `
      Item: ${item.supplyName}
      User: ${item.requester || 'N/A'}
      Quantity: ${item.quantity}
      Issued At: ${item.issuedAt?.toDate().toLocaleString()}
      ${item.returnedAt ? `Returned At: ${item.returnedAt?.toDate().toLocaleString()}\nCondition: ${item.conditionOnReturn}` : 'Not yet returned'}
----------------------`;
    });

    const content = lines.join('\n');
    const fileUri = FileSystem.documentDirectory + 'issuance_report.txt';
    await FileSystem.writeAsStringAsync(fileUri, content);

    Sharing.isAvailableAsync().then((available) => {
      if (available) {
        Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Report generated', 'Report saved at: ' + fileUri);
      }
    });
  };

  const renderItem = ({ item }) => {
    const returned = !!item.returnedAt;

    return (
      <View style={globalStyles.card}>
        
          <Text style={globalStyles.sectionTitle}>{item.supplyName}</Text>
          <Text>User: {item.requester || 'N/A'}</Text>
          <Text>Quantity: {item.quantity}</Text>
          <Text>Issued At: {item.issuedAt?.toDate().toLocaleString() || 'Unknown'}</Text>

          {returned ? (
            <>
              <Text>Returned At: {item.returnedAt?.toDate().toLocaleString()}</Text>
              <Text>Condition: {item.conditionOnReturn}</Text>
            </>
          ) : (
            <>
              {editingLogId === item.id ? (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Condition on return"
                    value={conditionInput}
                    onChangeText={setConditionInput}
                  />
                  <TouchableOpacity
                    style={styles.returnBtn}
                    onPress={() => markAsReturned(item.id)}
                  >
                    <Text style={globalStyles.buttonText}>Confirm Return</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.markBtn}
                  onPress={() => setEditingLogId(item.id)}
                >
                  <Text style={globalStyles.buttonText}>Mark as Returned</Text>
                </TouchableOpacity>
              )}
            </>
          )}
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={globalStyles.container}>
      <Text style={globalStyles.header}>Issuance Logs</Text>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'all' && styles.activeFilter]}
          onPress={() => setFilter('all')}
        >
          <Text>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'returned' && styles.activeFilter]}
          onPress={() => setFilter('returned')}
        >
          <Text>Returned</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'notReturned' && styles.activeFilter]}
          onPress={() => setFilter('notReturned')}
        >
          <Text>Not Returned</Text>
        </TouchableOpacity>
      </View>

      {/* Generate Report */}
      <TouchableOpacity style={styles.reportBtn} onPress={generateReport}>
        <Text style={globalStyles.buttonText}>Generate Report</Text>
      </TouchableOpacity>

      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <ScrollView>
          <FlatList
            data={filteredLogs}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            scrollEnabled={false}
          />
        </ScrollView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  markBtn: {
    backgroundColor: '#007AFF',
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  returnBtn: {
    backgroundColor: '#4CAF50',
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  activeFilter: {
    backgroundColor: '#bde0fe',
  },
  reportBtn: {
    backgroundColor: '#f0a500',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
});
