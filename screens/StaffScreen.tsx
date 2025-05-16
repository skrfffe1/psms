import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Alert, FlatList, RefreshControl, Animated, TouchableOpacity } from 'react-native';
import { getFirestore, collection, query, where, onSnapshot, FirestoreError, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, Text, Provider, BottomNavigation, Card, Menu, IconButton } from 'react-native-paper';
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
    type: 'supply' | 'maintenance'; // Add a type discriminator
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
    const [filterMenuVisible, setFilterMenuVisible] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'supply' | 'maintenance'>('all');
    const [filterLabel, setFilterLabel] = useState('All Requests');

    const fetchRequests = useCallback(() => {
        if (!user) return;

        setRefreshing(true);
        setLoading(true);
        let allRequests: Request[] = [];

        const fetchSupplyRequests = async () => {
            const supplyRequestsRef = collection(db, 'requests');
            const supplyQuery = query(
                supplyRequestsRef,
                where('requester', '==', user.uid),
                orderBy('createdAt', 'desc')
            );

            return new Promise<void>((resolve, reject) => {
                const unsubscribeSupply = onSnapshot(
                    supplyQuery,
                    (snapshot) => {
                        try {
                            const supplyRequestsData = snapshot.docs.map((doc) => {
                                const data = doc.data();
                                const createdAt = data.createdAt?.toDate() || null;
                                return {
                                    id: doc.id,
                                    supplyName: data.supplyName,
                                    quantity: data.quantity,
                                    status: data.status,
                                    reason: data.reason,
                                    createdAt,
                                    type: 'supply' as const,
                                };
                            });
                            allRequests = [...allRequests, ...supplyRequestsData];
                            resolve();

                        } catch (error) {
                            console.error("Error processing snapshot data for supply requests", error);
                            Alert.alert('Data Error', 'Failed to process supply request data.');
                            reject(error);
                        } finally {
                           // unsubscribeSupply(); // Removed: should unsubscribe in useEffect
                        }
                    },
                    (error: FirestoreError) => {
                        console.error('Error fetching supply requests:', error);
                        Alert.alert('Error', 'Failed to fetch your supply requests: ' + error.message);
                        reject(error);
                       // unsubscribeSupply();  // Removed: should unsubscribe in useEffect
                    }
                );
                //unsubscribeFuncs.current.push(unsubscribeSupply); //collect unsubscribe functions
            });
        };

        const fetchMaintenanceRequests = async () => {
            const maintenanceRequestsRef = collection(db, 'maintenanceRequests');
            const maintenanceQuery = query(
                maintenanceRequestsRef,
                where('requester', '==', user.uid),
                orderBy('requestDate', 'desc')  // Use requestDate if that's the field name
            );

            return new Promise<void>((resolve, reject) => {
                const unsubscribeMaintenance = onSnapshot(
                    maintenanceQuery,
                    (snapshot) => {
                        try {
                            const maintenanceRequestsData = snapshot.docs.map((doc) => {
                                const data = doc.data();
                                const requestDate = data.requestDate?.toDate() || null;
                                return {
                                    id: doc.id,
                                    supplyName: data.supplyName,
                                    quantity: 1, // Or some default value, since maintenance might not have quantity
                                    status: data.status,
                                    reason: data.reason,
                                    createdAt: requestDate, // Use requestDate
                                    type: 'maintenance' as const,
                                };
                            });
                            allRequests = [...allRequests, ...maintenanceRequestsData];
                            resolve();
                        } catch (error) {
                            console.error("Error processing snapshot data for maintenance requests", error);
                            Alert.alert('Data Error', 'Failed to process maintenance request data.');
                            reject(error);
                        } finally {
                            //unsubscribeMaintenance();
                        }
                    },
                    (error: FirestoreError) => {
                        console.error('Error fetching maintenance requests:', error);
                        Alert.alert('Error', 'Failed to fetch your maintenance requests: ' + error.message);
                        reject(error);
                       // unsubscribeMaintenance();
                    }
                );
               // unsubscribeFuncs.current.push(unsubscribeMaintenance);
            });
        };

        Promise.all([fetchSupplyRequests(), fetchMaintenanceRequests()]).then(() => {
            // Combine and sort
            allRequests.sort((a, b) => {
                if (!a.createdAt) return 1;
                if (!b.createdAt) return -1;
                return b.createdAt.getTime() - a.createdAt.getTime();
            });

            let filteredRequests = allRequests;
            if (selectedFilter === 'supply') {
                filteredRequests = allRequests.filter(req => req.type === 'supply');
            } else if (selectedFilter === 'maintenance') {
                filteredRequests = allRequests.filter(req => req.type === 'maintenance');
            }

            setRequests(filteredRequests);
            setLoading(false);
            setRefreshing(false);
        }).catch(error => {
            setLoading(false);
            setRefreshing(false);
        });

    }, [db, user, selectedFilter]);

    useEffect(() => {
        const unsubscribe = fetchRequests();

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();

        return () => {
            // No unsubscribe function to call here
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
                    <Text style={styles.supplyName}>
                        {item.type === 'supply' ? 'Supply: ' : 'Maintenance: '}
                        {item.supplyName}
                    </Text>
                    {item.type === 'supply' && <Text style={styles.quantity}>Quantity: {item.quantity}</Text>}
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
             <View style={styles.filterContainer}>
                <Menu
                    visible={filterMenuVisible}
                    onDismiss={() => setFilterMenuVisible(false)}
                    anchor={
                        <TouchableOpacity onPress={() => setFilterMenuVisible(true)} style={styles.filterButton}>
                            <Text style={styles.filterLabel}>{filterLabel}</Text>
                            <IconButton
                                icon="chevron-down"
                                size={20}
                                iconColor="#888"
                                style={styles.filterIconStyle}
                            />
                        </TouchableOpacity>
                    }
                >
                    <Menu.Item
                        onPress={() => {
                            setSelectedFilter('all');
                            setFilterLabel('All Requests');
                            setFilterMenuVisible(false);
                        }}
                        title="All Requests"
                    />
                    <Menu.Item
                        onPress={() => {
                            setSelectedFilter('supply');
                            setFilterLabel('Supply Requests');
                            setFilterMenuVisible(false);
                        }}
                        title="Supply Requests"
                    />
                    <Menu.Item
                        onPress={() => {
                            setSelectedFilter('maintenance');
                            setFilterLabel('Maintenance Requests');
                            setFilterMenuVisible(false);
                        }}
                        title="Maintenance Requests"
                    />
                </Menu>
            </View>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : requests.length === 0 ? (
                <Text style={styles.noRequestsText}>You have not made any requests yet.</Text>
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
        backgroundColor: '#fafaf9',
    },
    supplyName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0c0a09',
        marginBottom: 8,
        fontFamily: 'System',
    },
    quantity: {
        fontSize: 16,
        color: '#0c0a09',
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
        color: '#2c3e50',
        marginBottom: 8,
        fontFamily: 'System',
    },
    date: {
        fontSize: 14,
        color: '#0c0a09',
        fontFamily: 'System',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
     filterContainer: {
        alignItems: 'flex-start',
        marginBottom: 20,
        paddingHorizontal: 10,
        width: '50%',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',

    },
    filterLabel: {
        fontSize: 12,
        color: '#333',
        marginRight: 8,
    },
      filterIconStyle: {
        margin: 0,
        padding: 0,
        backgroundColor: 'transparent',
    },
});

export default StaffScreen;

