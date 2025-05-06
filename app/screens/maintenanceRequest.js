import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Button, FlatList,
  TouchableOpacity, Alert, StyleSheet
} from 'react-native';
import { globalStyles } from '@/styles/global';
import { db } from '@/firebase/config';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where
} from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ManageMaintenanceScreen() {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [form, setForm] = useState({
    item: '',
    issue: '',
    status: 'pending',
    dateRequested: new Date().toISOString(),
  });

  const fetchRequests = async () => {
    let q = collection(db, 'maintenanceRequests');

    // Apply filters
    const conditions = [];
    if (statusFilter) {
      conditions.push(where('status', '==', statusFilter));
    }
    if (startDate && endDate) {
      conditions.push(where('dateRequested', '>=', startDate.toISOString()));
      conditions.push(where('dateRequested', '<=', endDate.toISOString()));
    }

    if (conditions.length) {
      q = query(q, ...conditions);
    }

    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setRequests(data);
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, startDate, endDate]);

  const handleCreate = async () => {
    if (!form.item || !form.issue) return Alert.alert('Fill all fields');
    await addDoc(collection(db, 'maintenanceRequests'), form);
    setForm({ item: '', issue: '', status: 'pending', dateRequested: new Date().toISOString() });
    fetchRequests();
  };

  const handleUpdate = async (id) => {
    await updateDoc(doc(db, 'maintenanceRequests', id), form);
    setForm({ item: '', issue: '', status: 'pending', dateRequested: new Date().toISOString() });
    fetchRequests();
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'maintenanceRequests', id));
    fetchRequests();
  };

  const handleEdit = (item) => {
    setForm(item);
  };

  return (
    <View style={styles.container}>   
      {/* Form */}
      <TextInput
        placeholder="Item"
        value={form.item}
        onChangeText={text => setForm({ ...form, item: text })}
        style={styles.input}
      />
      <TextInput
        placeholder="Issue"
        value={form.issue}
        onChangeText={text => setForm({ ...form, issue: text })}
        style={styles.input}
      />
      <TextInput
        placeholder="Status (pending/completed)"
        value={form.status}
        onChangeText={text => setForm({ ...form, status: text })}
        style={styles.input}
      />

      <Button
        title={form.id ? 'Update Request' : 'Create Request'}
        onPress={form.id ? () => handleUpdate(form.id) : handleCreate}
      />

      {/* Filters */}
      <View style={styles.filterContainer}>
        <TextInput
          placeholder="Filter by status"
          value={statusFilter}
          onChangeText={setStatusFilter}
          style={styles.input}
        />
        <TouchableOpacity onPress={() => setShowStartPicker(true)}>
          <Text style={styles.dateFilter}>
            Start: {startDate ? startDate.toDateString() : 'Select'}
          </Text>
        </TouchableOpacity>
        {showStartPicker && (
          <DateTimePicker
            value={startDate || new Date()}
            mode="date"
            display="default"
            onChange={(_, date) => {
              setShowStartPicker(false);
              if (date) setStartDate(date);
            }}
          />
        )}
        <TouchableOpacity onPress={() => setShowEndPicker(true)}>
          <Text style={styles.dateFilter}>
            End: {endDate ? endDate.toDateString() : 'Select'}
          </Text>
        </TouchableOpacity>
        {showEndPicker && (
          <DateTimePicker
            value={endDate || new Date()}
            mode="date"
            display="default"
            onChange={(_, date) => {
              setShowEndPicker(false);
              if (date) setEndDate(date);
            }}
          />
        )}
        <Button title="Clear Filters" onPress={() => {
          setStatusFilter('');
          setStartDate(null);
          setEndDate(null);
        }} />
      </View>

      {/* List */}
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>Item: {item.item}</Text>
            <Text>Issue: {item.issue}</Text>
            <Text>Status: {item.status}</Text>
            <Text>Date: {new Date(item.dateRequested).toDateString()}</Text>
            <View style={styles.actions}>
              <Button title="Edit" onPress={() => handleEdit(item)} />
              <Button title="Delete" color="red" onPress={() => handleDelete(item.id)} />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15, flex: 1 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 5,
    padding: 8, marginVertical: 5,
  },
  filterContainer: {
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderRadius: 6,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9'
  },
  dateFilter: { color: '#007AFF', marginVertical: 5 },
  card: {
    padding: 10, borderWidth: 1, borderRadius: 8,
    borderColor: '#ccc', marginVertical: 6
  },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }
});
