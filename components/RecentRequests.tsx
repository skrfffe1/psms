// RecentRequests.tsx
import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback for consistency
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native'; // Added ActivityIndicator
import { collection, getDocs, orderBy, limit, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Card, Title, Paragraph } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';

interface RecentRequestItem {
    id: string;
    supplyName?: string; // Made optional as maintenance requests won't have it
    quantity?: number; // Made optional
    requesterFirstName?: string;
    requesterLastName?: string;
    status: string;
    createdAt?: any;
    // For maintenance requests:
    issueType?: string; // Assuming a field for maintenance type
    location?: string; // Assuming a location field for maintenance
}

interface RecentRequestsProps {
    title: string;
    type?: 'supply' | 'maintenance' | 'status'; // Clarified 'supply' vs 'maintenance'
}

const RecentRequests = ({ title, type = 'supply' }: RecentRequestsProps) => { // Default to 'supply'
    const [recentRequests, setRecentRequests] = useState<RecentRequestItem[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

    const fetchRecentRequests = useCallback(async () => {
        setLoading(true);
        try {
            let collectionRef;
            let currentQuery;

            // Determine which collection to query based on 'type' prop
            if (type === 'maintenance') {
                collectionRef = collection(db, 'maintenanceRequests');
                currentQuery = query(
                    collectionRef,
                    orderBy('createdAt', 'desc'),
                    limit(5)
                );
            } else { // Defaults to 'supply' or 'status' for 'requests' collection
                collectionRef = collection(db, 'requests');
                if (type === 'status') {
                    currentQuery = query(
                        collectionRef,
                        where('status', 'in', ['approved', 'rejected']),
                        orderBy('createdAt', 'desc'),
                        limit(5)
                    );
                } else { // 'supply'
                    currentQuery = query(
                        collectionRef,
                        orderBy('createdAt', 'desc'),
                        limit(5)
                    );
                }
            }
            
            const querySnapshot = await getDocs(currentQuery);
            const requestsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(), // Convert Timestamp to Date
            })) as RecentRequestItem[];
            setRecentRequests(requestsData);
        } catch (error) {
            console.error('Error fetching recent requests:', error);
            // Consider adding an alert or visible error message to the user
        } finally {
            setLoading(false);
        }
    }, [type]); // Re-fetch data if 'type' prop changes

    useEffect(() => {
        fetchRecentRequests();
    }, [fetchRecentRequests]); // Depend on the memoized fetch function

    const renderItem = ({ item }: { item: RecentRequestItem }) => (
        // Navigate to specific request management screen if available,
        // otherwise a generic one. You might need to pass item.id or other details.
        <Card style={styles.requestCard} onPress={() => navigation.navigate('ManageRequest', { requestId: item.id, requestType: type === 'maintenance' ? 'maintenance' : 'supply' })}>
            <Card.Content>
                <Title style={styles.itemName}>
                    {type === 'maintenance' ? `Issue: ${item.issueType || 'N/A'}` : `Supply: ${item.supplyName || 'N/A'}`}
                </Title>
                {item.quantity && <Paragraph style={styles.requestDetails}>Qty: {item.quantity}</Paragraph>}
                <Paragraph style={styles.requestDetails}>By: {item.requesterFirstName} {item.requesterLastName}</Paragraph>
                <Text style={[styles.statusText, { fontStyle: 'italic' }]}>Status: {item.status}</Text>
                {item.createdAt && (
                    <Text style={styles.dateText}>
                        {item.createdAt.toLocaleString()}
                    </Text>
                )}
            </Card.Content>
        </Card>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#1c398e" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            {recentRequests.length > 0 ? (
                <FlatList
                    data={recentRequests}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    // *** THIS IS THE CRUCIAL FIX ***
                    scrollEnabled={false}
                />
            ) : (
                <Text style={styles.noRequestsText}>No recent requests found.</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    loadingText: {
        marginTop: 8,
        fontSize: 14,
        color: '#555',
    },
    requestCard: {
        marginBottom: 8,
        backgroundColor: '#fff',
        borderRadius: 8,
        elevation: 1, // Android shadow
        shadowColor: '#000', // iOS shadow
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#312c85',
    },
    requestDetails: {
        fontSize: 14,
        color: '#555',
    },
    statusText: {
        fontSize: 14,
        color: '#888',
        marginTop: 4,
    },
    dateText: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    noRequestsText: {
        fontSize: 14,
        color: '#777',
        textAlign: 'center',
        paddingVertical: 10,
    },
});

export default RecentRequests;