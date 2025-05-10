import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, Alert, ActivityIndicator, Animated
} from 'react-native';
import { globalStyles } from '@/styles/global';
import { db } from '@/firebase/config';
import { collection, getDocs, updateDoc, doc, getDoc, addDoc, orderBy, query } from 'firebase/firestore';

import { Button, Card, TextInput } from 'react-native-paper';
import { ScrollView } from 'react-native-gesture-handler';

interface Request {
  id: string;
  supplyName: string;
  supplyId: string; // Added supplyId property
  quantity: number;
  requester: string;
  reason: string;
  status: string;
}

export default function ManageRequestsScreen() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnims = useRef<{ [key: string]: Animated.Value }>({}); // Store Animated.Value refs for each request

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
        const data = document.data();
        return {
          id,
          supplyName: data.supplyName || '',
          supplyId: data.supplyId || '',
          quantity: data.quantity || 0,
          requester: data.requester || '',
          reason: data.reason || '',
          status: data.status || 'pending',
        };
      });

      setRequests(requestsData);
      setLoading(false);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching requests:', error.message);
      } else {
        console.error('Error fetching requests:', error);
      }
      setLoading(false);
    }
  };

  interface HandleStatusChangeParams {
    supplyName: string;
    requestId: string;
    supplyId: string;
    quantity: number;
    newStatus: 'approved' | 'rejected';
  }

  const handleStatusChange = async ({
    supplyName,
    requestId,
    supplyId,
    quantity,
    newStatus,
  }: HandleStatusChangeParams): Promise<void> => {
    try {
      const supplyRef = doc(db, 'supplies', supplyId);
      const supplySnap = await getDoc(supplyRef);
      const requestRef = doc(db, 'requests', requestId);
      const requestSnap = await getDoc(requestRef);
      const requestData = requestSnap.data();
      if (!requestData) {
        throw new Error('Request data is undefined');
      }

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
          await addDoc(collection(db, 'approvedRequests'), {
            ...requestData,
            status: newStatus,
            decisionDate: new Date(),
          });
        } else if (newStatus === 'rejected') {
          // Save to separate collection
          await addDoc(collection(db, 'rejectedRequests'), {
            ...requestData,
            status: newStatus,
            decisionDate: new Date(),
          });
        }

        // Save to issuanceLogs
        await addDoc(collection(db, 'issuanceLogs'), {
          requester: requestData.requester,
          supplyId,
          supplyName,
          quantity,
          issuedAt: new Date(),
          returnedAt: null,
          conditionOnReturn: null,
        });

        await updateDoc(doc(db, 'requests', requestId), {
          status: newStatus,
        });

        Animated.timing(fadeAnims.current[requestId], {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setRequests((prev) => prev.filter((item) => item.id !== requestId));
        });

        Alert.alert(newStatus === 'approved' ? 'Approved' : 'Rejected', `Request ${newStatus}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error handling ${newStatus}:`, error.message);
      } else {
        console.error(`Error handling ${newStatus}:`, error);
      }
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
  const renderItem = ({ item }: { item: Request }) => {
    if (requests.length === 0) {
      return (
        <View style={globalStyles.container}>
          <Text style={globalStyles.header}>No Requests Found</Text>
        </View>
      );
    }

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
              onPress={() => handleStatusChange({ supplyName: item.supplyName, requestId: item.id, supplyId: item.supplyId, quantity: item.quantity, newStatus: 'approved' })}
            >
              <Text style={globalStyles.buttonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleStatusChange({ supplyName: item.supplyName, requestId: item.id, supplyId: item.supplyId, quantity: item.quantity, newStatus: 'rejected' })}
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


      <FlatList
        data={requests}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
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
