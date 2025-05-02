import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { globalStyles } from '@/styles/global';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function ApprovedHistoryScreen() {
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchApprovedRequests();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchApprovedRequests();
  }, []);

  const fetchApprovedRequests = async () => {
    try {
      const q = query(collection(db, 'requests'), where('status', '==', 'approved'));
      const querySnapshot = await getDocs(q);
      const approvedData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      setApprovedRequests(approvedData);
      setError('');
      setLoading(false);
    } catch (error) {
      console.error('Error fetching approved requests:', error.message);
      setError('Failed to fetch approved requests.');
      setLoading(false);
    }
  };

  if (error) {
    return (
      <View style={globalStyles.container}>
        <Text style={globalStyles.header}>{error}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={globalStyles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (approvedRequests.length === 0) {
    return (
      <View style={globalStyles.container}>
        <Text style={globalStyles.header}>No Approved Requests</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <View style={globalStyles.card}>
      <Text style={globalStyles.sectionTitle}>{item.supplyName}</Text>
      <Text style={globalStyles.smallText}>Quantity: {item.quantity}</Text>
      <Text style={globalStyles.smallText}>Requester: {item.requester}</Text>
      <Text style={globalStyles.smallText}>Approved for: {item.reason}</Text>
      <Text style={[globalStyles.smallText, { fontStyle: 'italic', color: '#4CAF50' }]}>{item.status}</Text>
    </View>
  );

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.header}>Approved Requests</Text>
      <FlatList
         data={approvedRequests}
         keyExtractor={(item) => item.id}
         renderItem={renderItem}
         showsVerticalScrollIndicator={false}
         refreshing={refreshing}
         onRefresh={onRefresh}
      />
    </View>
  );
}
