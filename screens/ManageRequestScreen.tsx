import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator, Animated } from 'react-native';
import { globalStyles } from '@/styles/global';
import { db } from '@/firebase/config';
import { collection, getDocs, updateDoc, doc, getDoc, setDoc, orderBy, query, serverTimestamp as firebaseServerTimestamp } from 'firebase/firestore';
import { Button } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';

interface Request {
  id: string;
  supplyName: string;
  supplyId: string;
  quantity: number;
  requester: string;
  reason: string;
  status: string;
  createdAt?: any;
  requesterFirstName?: string;
  requesterLastName?: string;
}

interface HandleStatusChangeParams {
  requestId: string;
  supplyId: string;
  quantity: number;
  newStatus: 'approved' | 'rejected';
  requestData: Request;
}

const ManageRequestsScreen = ({ navigation }: { navigation: StackNavigationProp<RootStackParamList, 'ManageRequest'> }) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnims = useRef<{ [key: string]: Animated.Value }>({});

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const requestsData = querySnapshot.docs.map((doc) => {
        const id = doc.id;
        fadeAnims.current[id] = new Animated.Value(1);
        const data = doc.data() as Request;
        return {
          id,
          supplyName: data.supplyName || '',
          supplyId: data.supplyId || '',
          quantity: data.quantity || 0,
          requester: data.requester || '',
          reason: data.reason || '',
          status: data.status || 'pending',
          createdAt: data.createdAt,
          requesterFirstName: data.requesterFirstName,
          requesterLastName: data.requesterLastName
        };
      });

      setRequests(requestsData);
    } catch (error: any) {
      console.error('Error fetching requests:', error.message || error);
      Alert.alert('Error', 'Failed to fetch requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusChange = async ({
    requestId,
    supplyId,
    quantity,
    newStatus,
    requestData,
  }: HandleStatusChangeParams): Promise<void> => {
    try {
      const supplyRef = doc(db, 'supplies', supplyId);
      const supplySnap = await getDoc(supplyRef);

      if (!supplySnap.exists()) {
        Alert.alert('Error', 'Supply does not exist.');
        await updateDoc(doc(db, 'requests', requestId), { status: 'rejected' });
        return;
      }

      const currentQty = supplySnap.data().quantity;

      if (newStatus === 'approved' && currentQty < quantity) {
        Alert.alert('Error', 'Insufficient stock for approval');
        return;
      }

      const requestDocRef = doc(db, 'requests', requestId);

      if (newStatus === 'approved') {
        // Update supply quantity
        await updateDoc(supplyRef, { quantity: currentQty - quantity });

        // Add to issuance logs
        const issuanceLogRef = doc(collection(db, 'issuanceLogs'), requestId);
        await setDoc(issuanceLogRef, {
          ...requestData,
          status: newStatus,
          issuanceDate: serverTimestamp(),
        });
      }

      // Update request status
      await updateDoc(requestDocRef, { status: newStatus });

      Animated.timing(fadeAnims.current[requestId], {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setRequests((prev) => prev.filter((item) => item.id !== requestId));
      });

      Alert.alert(newStatus === 'approved' ? 'Approved' : 'Rejected', `Request ${newStatus}`);
    } catch (error: any) {
      console.error(`Error handling ${newStatus}:`, error.message || error);
      Alert.alert('Error', `Failed to ${newStatus} request: ${error.message}`);
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
    const fadeAnim = fadeAnims.current[item.id] || new Animated.Value(1);

    return (
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        <Text style={styles.supplyName}>{item.supplyName}</Text>
        <Text style={styles.detailText}>Quantity: {item.quantity}</Text>
        <Text style={styles.detailText}>Requester: {item.requesterFirstName} {item.requesterLastName} ({item.requester})</Text>
        <Text style={styles.detailText}>Reason: {item.reason}</Text>
        <Text style={[styles.statusText, { fontStyle: 'italic' }]}>Status: {item.status}</Text>

        {item.status === 'pending' && (
          <View style={styles.actionsContainer}>
            <Button
              mode="contained"
              style={styles.approveButton}
              onPress={() => handleStatusChange({
                requestId: item.id,
                supplyId: item.supplyId,
                quantity: item.quantity,
                newStatus: 'approved',
                requestData: item,
              })}
            >
              Approve
            </Button>
            <Button
              mode="contained"
              style={styles.rejectButton}
              onPress={() => handleStatusChange({
                requestId: item.id,
                supplyId: item.supplyId,
                quantity: item.quantity,
                newStatus: 'rejected',
                requestData: item,
              })}
            >
              Reject
            </Button>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={globalStyles.container}>
      {requests.length === 0 && !loading ? (
        <Text style={styles.noRequestsText}>No Requests Found</Text>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  supplyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  detailText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  statusText: {
    fontSize: 14,
    color: '#777',
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-between',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    marginRight: 5,
    flex: 1,
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
    marginLeft: 5,
    flex: 1,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  noRequestsText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
});

function serverTimestamp(): any {
  return firebaseServerTimestamp();
}

export default ManageRequestsScreen;
