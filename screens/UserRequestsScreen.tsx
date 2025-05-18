import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Card, Button } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { collection, getDocs, query, where } from 'firebase/firestore'; // Import for Firebase
import { db } from '@/firebase/config';

interface Request {
    id: string;
    supplyName: string;
    supplyId: string;
    quantity: number;
    requester: string;
    reason: string;
    status: string;
    requestType: 'supply' | 'maintenance';
    createdAt?: any;
    requesterFirstName?: string;
    requesterLastName?: string;
}

const UserRequestsScreen = () => {
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const route = useRoute();
    const { userId } = route.params as { userId: string }; // Get the userId from the route

    const fetchUserRequests = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch both supply and maintenance requests for the user
            const supplyQuery = query(collection(db, 'requests'), where('requester', '==', userId));
            const maintenanceQuery = query(collection(db, 'maintenanceRequests'), where('requester', '==', userId));

            const supplySnapshot = await getDocs(supplyQuery);
            const maintenanceSnapshot = await getDocs(maintenanceQuery);

            const supplyRequests = supplySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Request[];

            const maintenanceRequests = maintenanceSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Request[]; // Reuse Request interface

            // Combine and sort requests, you might want to sort by date
            const allRequests = [...supplyRequests, ...maintenanceRequests].sort(
                (a, b) => {
                    const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0);
                    const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0);
                    return dateB.getTime() - dateA.getTime();
                }
            );

            setRequests(allRequests);
        } catch (error) {
            console.error('Error fetching user requests:', error);
            Alert.alert('Error', 'Failed to fetch user requests.');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchUserRequests();
    }, [fetchUserRequests]);

    const renderRequestItem = ({ item }: { item: Request }) => (
        <Card style={styles.requestCard}>
            <Card.Content>
                <Text style={styles.supplyName}>Supply: {item.supplyName}</Text>
                {item.quantity && <Text style={styles.detailText}>Quantity: {item.quantity}</Text>}
                <Text style={styles.detailText}>Reason: {item.reason}</Text>
                <Text style={styles.status}>Status: {item.status}</Text>
                <Text style={styles.date}>
                    Requested: {item.createdAt ? item.createdAt.toDate().toLocaleString() : 'N/A'}
                </Text>
            </Card.Content>
        </Card>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Requests for User: {userId}</Text>
            {requests.length === 0 ? (
                <Text>No requests found for this user.</Text>
            ) : (
                <FlatList
                    data={requests}
                    keyExtractor={(item) => item.id}
                    renderItem={renderRequestItem}
                />
            )}
            <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={styles.backButton}
            >
                Back to Users
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
    requestCard: {
        marginBottom: 12,
        borderRadius: 8,
        elevation: 2,
    },
    detailText: {
        fontSize: 14,
        color: '#555',
        marginBottom: 2,
    },
    supplyName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    status: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#777',
    },
      date: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    backButton: {
        marginTop: 20,
        borderColor: '#007AFF',
        color: '#007AFF',
    },
});

export default UserRequestsScreen;
