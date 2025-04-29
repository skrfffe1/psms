import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { globalStyles } from '@/styles/global';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function RejectedHistoryScreen() {
  const [rejectedRequests, setRejectedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRejectedRequests();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchRejectedRequests();
  }, []);

  const fetchRejectedRequests = async () => {
    try {
      const q = query(collection(db, 'requests'), where('status', '==', 'rejected'));
      const querySnapshot = await getDocs(q);
      const rejectedData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      setRejectedRequests(rejectedData);
      setError('');
      setLoading(false);
    } catch (error) {
      console.error('Error fetching rejected requests:', error.message);
      setError('Failed to fetch rejected requests.');
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
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  if (rejectedRequests.length === 0) {
    return (
      <View style={globalStyles.container}>
        <Text style={globalStyles.header}>No Rejected Requests</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <View style={globalStyles.card}>
      <Text style={globalStyles.sectionTitle}>{item.supplyName}</Text>
      <Text style={globalStyles.smallText}>Quantity: {item.quantity}</Text>
      <Text style={globalStyles.smallText}>Requested Reason: {item.reason}</Text>
      <Text style={[globalStyles.smallText, { fontStyle: 'italic', color: '#FF3B30' }]}>{item.status}</Text>
    </View>
  );

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.header}>Rejected Requests</Text>
      <FlatList
        data={rejectedRequests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </View>
  );
}
