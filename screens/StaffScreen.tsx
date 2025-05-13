import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Alert, FlatList, RefreshControl, Animated } from 'react-native';
import { getFirestore, collection, query, where, onSnapshot, FirestoreError, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, Text, Provider, BottomNavigation, Card } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';

// Import the screen components
import ViewSupplyScreen from './ViewSupplyScreen';
import RequestSupplyScreen from './RequestSupplyScreen';
import MaintenanceRequestScreen from './MaintenanceRequestScreen';

interface Request {
    id: string;
    supplyName: string;
    quantity: number;
    status: string;
    reason: string;
    createdAt: Date | null;
}

interface StaffScreenProps {
    navigation: StackNavigationProp<RootStackParamList, 'Staff'>;
}

const StaffRequestsComponent = ({ navigation }: { navigation: StackNavigationProp<RootStackParamList> }) => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const db = getFirestore();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const fetchRequests = useCallback(() => {
        if (!user) return;

        setRefreshing(true);
        setLoading(true);

        const requestsRef = collection(db, 'requests');
        const q = query(
            requestsRef,
            where('requester', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                try {
                    const fetchedRequests: Request[] = snapshot.docs.map((doc) => {
                        const data = doc.data();
                        const createdAt = data.createdAt?.toDate() || null;
                        return {
                            id: doc.id,
                            supplyName: data.supplyName,
                            quantity: data.quantity,
                            status: data.status,
                            reason: data.reason,
                            createdAt,
                        };
                    });
                    setRequests(fetchedRequests);
                } catch (error) {
                    console.error("Error processing snapshot data", error);
                    Alert.alert('Data Error', 'Failed to process request data.');
                } finally {
                    setLoading(false);
                    setRefreshing(false);
                }
            },
            (error: FirestoreError) => {
                console.error('Error fetching requests:', error);
                Alert.alert('Error', 'Failed to fetch your requests: ' + error.message);
                setLoading(false);
                setRefreshing(false);
            }
        );
        return () => unsubscribe();
    }, [db, user]);

    useEffect(() => {
        const unsubscribe = fetchRequests();

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();

        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, [fetchRequests, fadeAnim]);

    const onRefresh = useCallback(() => {
        fetchRequests();
    }, [fetchRequests]);

    const getStatusColor = useCallback((status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return '#f39c12';
            case 'approved': return '#2ecc71';
            case 'rejected': return '#e74c3c';
            default: return '#3498db';
        }
    }, []);

    const renderItem = useCallback(({ item }: { item: Request }) => {
        return (
            <Card style={[styles.requestCard]}>
                <Card.Content>
                    <Text style={styles.supplyName}>Supply: {item.supplyName}</Text>
                    <Text style={styles.quantity}>Quantity: {item.quantity}</Text>
                    <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
                        Status: {item.status}
                    </Text>
                    <Text style={styles.reason}>Reason: {item.reason}</Text>
                    <Text style={styles.date}>
                        Requested: {item.createdAt ? item.createdAt.toLocaleString() : 'N/A'}
                    </Text>
                </Card.Content>
            </Card>
        );
    }, [getStatusColor]);

    return (
        <Animated.View style={{ flex: 1, opacity: fadeAnim, backgroundColor: '#f0f4f8' }}>
            <Text style={styles.header}>Your Supply Requests</Text>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : requests.length === 0 ? (
                <Text style={styles.noRequestsText}>You have not made any supply requests yet.</Text>
            ) : (
                <FlatList
                    data={requests}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    style={{ width: '100%', backgroundColor: '#fafaf9' }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#007AFF']}
                            tintColor={'#007AFF'}
                        />
                    }
                    initialNumToRender={10}
                    maxToRenderPerBatch={20}
                    windowSize={21}
                    
                />
            )}
        </Animated.View>
    );
};

const StaffScreen: React.FC<StaffScreenProps> = ({ navigation }) => {
    const [index, setIndex] = useState(0);
    const [routes] = useState<{
        key: string;
        title: string;
        icon: keyof typeof MaterialCommunityIcons.glyphMap;
        component: React.FC<any>;
    }[]>([
        { key: 'ViewSupply', title: 'View Supply', icon: 'format-list-bulleted', component: ViewSupplyScreen },
        { key: 'RequestSupply', title: 'Request Supply', icon: 'cart-plus', component: RequestSupplyScreen },
        { key: 'MaintenanceRequest', title: 'Maintenance', icon: 'tools', component: MaintenanceRequestScreen },
        { key: 'StaffRequests', title: 'Requests', icon: 'format-list-bulleted', component: StaffRequestsComponent },
    ]);

    const renderScene = useCallback(({ route }: { route: any }) => {
        const Component = route.component;
        return <Component navigation={navigation} />;
    }, [navigation]);

    return (
        <Provider>
            <View style={styles.container}>
                <BottomNavigation
                    navigationState={{ index, routes }}
                    onIndexChange={setIndex}
                    renderScene={renderScene}
                    getLabelText={({ route }: any) => route.title}
                    renderIcon={({ route, color }) => (
                        <MaterialCommunityIcons name={route.icon} size={24} color={color} />
                    )}
                    shifting={true}
                    labeled={true}
                    inactiveColor="#f0f9ff"
                    activeColor="#dbeafe"
                    barStyle={{ backgroundColor: '#1c398e', elevation: 4 }}
                />
            </View>
        </Provider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 0,
        backgroundColor: '#303F9F',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
        textAlign: 'center',
        padding: 20,
        fontFamily: 'System',
    },
    noRequestsText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
        fontFamily: 'System',
    },
    requestCard: {
        marginHorizontal: 8,
        marginVertical: 4,
        elevation: 2,
        borderRadius: 8,
        backgroundColor: '#fafaf9', // Changed from #222831 to #FFFFFF
    },
    supplyName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fafaf9', // Changed from #FAFAFA to #2c3e50
        marginBottom: 8,
        fontFamily: 'System',
    },
    quantity: {
        fontSize: 16,
        color: '#fafaf9', // Changed from #FAFAFA to #34495e
        marginBottom: 8,
        fontFamily: 'System',
    },
    status: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        fontFamily: 'System',
    },
    reason: {
        fontSize: 16,
        color: '#fafaf9',  // Changed from #FAFAFA to #7f8c8d
        marginBottom: 8,
        fontFamily: 'System',
    },
    date: {
        fontSize: 14,
        color: '#fafaf9', // Changed from #FAFAFA to #95a5a6
        fontFamily: 'System',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default StaffScreen;
