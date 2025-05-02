import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, Alert, ActivityIndicator, Animated
} from 'react-native';
import { globalStyles } from '@/styles/global';
import { db } from '@/firebase/config';
import { collection, getDocs, updateDoc, doc, getDoc, addDoc, orderBy, query } from 'firebase/firestore';

export default function ManageRequestsScreen() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeAnims = useRef({}); // Store Animated.Value refs for each request

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {

    try {
      const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc')); // sort by newest
      const querySnapshot = await getDocs(q);
  
      const requestsData = querySnapshot.docs.map((document) => {
        const id = document.id;
        fadeAnims.current[id] = new Animated.Value(1);
        return {
          id,
          ...document.data(),
        };
      });
  
      setRequests(requestsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching requests:', error.message);
      setLoading(false);
    }
  };

  const handleStatusChange = async (supplyName, requestId, supplyId, quantity, newStatus) => {

    try {
      const supplyRef = doc(db, 'supplies', supplyId);
      const supplySnap = await getDoc(supplyRef);
      const requestRef = doc(db, 'requests', requestId);
      const requestSnap = await getDoc(requestRef);
      const requestData = requestSnap.data();

      if (supplySnap.exists()) {
        const currentQty = supplySnap.data().quantity;

        if (newStatus === 'approved' && currentQty < quantity) {
          Alert.alert('Error', 'Insufficient stock for approval');
          return;
        }

        if (newStatus === 'approved') {
          await updateDoc(supplyRef, {
            quantity: currentQty - quantity,
          });

          // Save to separate collection
          await addDoc(collection(db,'approvedRequests'), {
            ...requestData,
            status: newStatus,
            decisionDate: new Date(),
          });
        }else if (newStatus === 'rejected') {
          // Save to separate collection
          await addDoc(collection(db, 'rejectedRequests'), {
            ...requestData,
            status: newStatus,
            decisionDate: new Date(),
          });
        }

        await updateDoc(doc(db, 'requests', requestId), {
          status: newStatus,
        });

        Animated.timing(fadeAnims.current[requestId], {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setRequests(prev => prev.filter(item => item.id !== requestId));
        });

        Alert.alert(newStatus === 'approved' ? 'Approved' : 'Rejected', `Request ${newStatus}`);
      }
    } catch (error) {
      console.error(`Error handling ${newStatus}:`, error.message);
      Alert.alert('Error', 'Something went wrong');
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
    const fadeAnim = fadeAnims.current[item.id] || new Animated.Value(1); // fallback safety

    return (
      <Animated.View style={[globalStyles.card, { opacity: fadeAnim }]}>
        <Text style={globalStyles.sectionTitle}>{item.supplyName}</Text>
        <Text style={globalStyles.smallText}>Quantity: {item.quantity}</Text>
        <Text style={globalStyles.smallText}>Quantity: {item.requester}</Text>
        <Text style={globalStyles.smallText}>Reason: {item.reason}</Text>
        <Text style={[globalStyles.smallText, { fontStyle: 'italic' }]}>Status: {item.status}</Text>

        {item.status === 'pending' && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.approveButton}
              onPress={() => handleStatusChange(item.supplyName, item.id,  item.supplyId, item.quantity, 'approved')}
            >
              <Text style={globalStyles.buttonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleStatusChange(item.supplyName, item.id, item.supplyId, item.quantity, 'rejected')}
            >
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
