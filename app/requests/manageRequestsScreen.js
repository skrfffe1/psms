import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator, Animated } from 'react-native';
import { globalStyles } from '@/styles/global';
import { db } from '@/firebase/config';
import { collection, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';

export default function ManageRequestsScreen() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'requests'));
      
      const requestsData = querySnapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      setRequests(requestsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching requests:', error.message);
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus, itemData) => {
    try {
      const requestRef = doc(db, 'requests', id);
  
      const {
        supplyName = '',
        quantity = 0,
        category = '',
        reason = '',
      } = itemData || {};
  
      if (!supplyName || !quantity || !category || !reason) {
        throw new Error('Missing fields in request data.');
      }
  
      // Update status first
      await updateDoc(requestRef, { status: newStatus });
  
      if (newStatus === 'approved') {
        const supplyPayload = {
          supplyName,
          quantity,
          category,
          description: reason,
          dateAdded: new Date(),
        };
  
        // Add to 'supplies'
        await addDoc(collection(db, 'supplies'), supplyPayload);
  
        // Add to 'approvedRequests'
        await addDoc(collection(db, 'approvedRequests'), supplyPayload);
      
      }

      if (newStatus === 'rejected') {
        const supplyPayload = {
          supplyName,
          quantity,
          category,
          description: reason,
          dateAdded: new Date(),
        };
 
        // Add to 'approvedRequests'
        await addDoc(collection(db, 'rejectedRequests'), supplyPayload);
      
      }
  
      Alert.alert('Success', `Request ${newStatus}`);
      fetchRequests(); // Refresh list
    } catch (error) {
      console.error('Error updating request status:', error.message);
      Alert.alert('Error', 'Failed to update request.');
    }
  };
  

  if (loading) {
    return (
      <View style={globalStyles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (requests.length === 0) {
    return (
      <View style={globalStyles.container}>
        <Text style={globalStyles.header}>No Requests Found</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const fadeAnim = new Animated.Value(1); // 1 is fully visible

    const handleAnimatedStatusChange = async (id, newStatus) => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(async () => {
        await handleStatusChange(id, newStatus, item);
      });
    };

    return (
      <Animated.View style={[globalStyles.card, { opacity: fadeAnim }]}>
        <Text style={globalStyles.sectionTitle}>{item.supplyName}</Text>
        <Text style={globalStyles.smallText}>Quantity: {item.quantity}</Text>
        <Text style={globalStyles.smallText}>Reason: {item.reason}</Text>
        <Text style={[globalStyles.smallText, { fontStyle: 'italic' }]}>Status: {item.status}</Text>

        {item.status === 'pending' && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.approveButton} onPress={() => handleAnimatedStatusChange(item.id, 'approved')}>
              <Text style={globalStyles.buttonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectButton} onPress={() => handleAnimatedStatusChange(item.id, 'rejected')}>
              <Text style={globalStyles.buttonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.header}>Manage Requests</Text>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-between',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
    alignItems: 'center',
  },
});
