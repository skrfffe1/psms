// RecentRequests.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { collection, getDocs, orderBy, limit, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Card, Title, Paragraph } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';

interface RecentRequestItem {
    id: string;
    supplyName: string;
    quantity: number;
    requesterFirstName?: string;
    requesterLastName?: string;
    status: string;
    createdAt?: any;
}

interface RecentRequestsProps {
    title: string;
    type?: 'status'; // Optional: to filter by status (e.g., 'approved', 'rejected')
}

const RecentRequests = ({ title, type }: RecentRequestsProps) => {
    const [recentRequests, setRecentRequests] = useState<RecentRequestItem[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

    useEffect(() => {
        const fetchRecentRequests = async () => {
            setLoading(true);
            try {
                let q = query(
                    collection(db, 'requests'),
                    orderBy('createdAt', 'desc'),
                    limit(5) // Show the 5 most recent requests
                );

                if (type === 'status') {
                    q = query(
                        collection(db, 'requests'),
                        where('status', 'in', ['approved', 'rejected']),
                        orderBy('createdAt', 'desc'),
                        limit(5)
                    );
                }

                const querySnapshot = await getDocs(q);
                const requestsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate(), // Convert Timestamp to Date
                })) as RecentRequestItem[];
                setRecentRequests(requestsData);
            } catch (error) {
                console.error('Error fetching recent requests:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecentRequests();
    }, [type]);

    const renderItem = ({ item }: { item: RecentRequestItem }) => (
        <Card style={styles.requestCard} onPress={() => navigation.navigate('ManageRequest')}>
            <Card.Content>
                <Title style={styles.supplyName}>{item.supplyName}</Title>
                <Paragraph style={styles.requestDetails}>Qty: {item.quantity}</Paragraph>
                <Paragraph style={styles.requestDetails}>By: {item.requesterFirstName} {item.requesterLastName}</Paragraph>
                <Text style={[styles.statusText, { fontStyle: 'italic' }]}>Status: {item.status}</Text>
            </Card.Content>
        </Card>
    );

    if (loading) {
        return <Text>Loading recent requests...</Text>; // Basic loading indicator
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
                />
            ) : (
                <Text>No recent requests.</Text>
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
    requestCard: {
        marginBottom: 8,
        backgroundColor: '#fff',
        borderRadius: 8,
        elevation: 1,
    },
    supplyName: {
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
    },
});

export default RecentRequests;