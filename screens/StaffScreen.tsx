import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Alert, FlatList, RefreshControl, Animated } from 'react-native';
import { getFirestore, collection, query, where, onSnapshot, FirestoreError, orderBy, getDocs  } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, Text, Provider, BottomNavigation, Card, Searchbar } from 'react-native-paper'; // Added Searchbar
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

// Import the screen components
import ViewSupplyScreen from './ViewSupplyScreen';
import RequestSupplyScreen from './RequestSupplyScreen';
import MaintenanceRequestScreen from './MaintenanceRequestScreen';
import ReturnSupplyScreen from './ReturnSupplyScreen';

interface Request {
    id: string;
    supplyName: string;
    quantity: number;
    status: 'pending' | 'approved' | 'rejected' | 'repairing'; // Add 'repairing' status
    reason: string;
    createdAt: Date | null;
    type: 'supply' | 'maintenance';
    maintenanceStatus?: 'pending' | 'approved' | 'rejected'; // Add maintenance status
    supplyDescription?: string; // Add description for supply
}

interface Supply {  // Define the Supply interface
    id: string;
    name: string;
    description: string;
    quantity: number;
}

interface StaffScreenProps {
    navigation: StackNavigationProp<RootStackParamList, 'Staff'>;
}

const TopTab = createMaterialTopTabNavigator();

// Define the components outside the StaffScreen component
const AllRequestsComponent = () => <StaffRequestsComponent filter="all" />;
const SupplyRequestsComponent = () => <StaffRequestsComponent filter="supply" />;
const MaintenanceRequestsComponent = () => <StaffRequestsComponent filter="maintenance" />;

const StaffRequestsComponent = ({ filter }: { filter: 'all' | 'supply' | 'maintenance' }) => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const db = getFirestore();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const unsubscribeRefs = useRef<(() => void)[]>([]);
    const [supplies, setSupplies] = useState<Supply[]>([]); // State for storing supplies
    const [searchQuery, setSearchQuery] = useState(''); // State for search query

    // Fetch supplies -  fetch and store supplies
    const fetchSupplies = useCallback(async () => {
        try {
            const suppliesCollection = collection(db, 'supplies');
            const suppliesSnapshot = await getDocs(suppliesCollection);
            const suppliesData = suppliesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...(doc.data() as Omit<Supply, 'id'>),
            })) as Supply[];
            setSupplies(suppliesData);
        } catch (error) {
            console.error("Failed to fetch supplies:", error);
            Alert.alert('Error', 'Failed to fetch supplies.');
        }
    }, [db]);

    const fetchRequests = useCallback(() => {
        if (!user) return;

        setRefreshing(true);
        setLoading(true);
        let allRequests: Request[] = [];
        unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
        unsubscribeRefs.current = [];

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
                                // Find the supply data based on supplyId
                                const supply = supplies.find((s) => s.id === data.supplyId);
                                return {
                                    id: doc.id,
                                    supplyName: data.supplyName,
                                    quantity: data.quantity,
                                    status: data.status,
                                    reason: data.reason,
                                    createdAt,
                                    type: 'supply' as const,
                                    supplyDescription: supply ? supply.description : 'Description N/A', // Always a string
                                };
                            });
                            allRequests = [...allRequests, ...supplyRequestsData];
                            resolve();

                        } catch (error) {
                            console.error("Error processing snapshot data for supply requests", error);
                            Alert.alert('Data Error', 'Failed to process supply request data.');
                            reject(error);
                        }
                    },
                    (error: FirestoreError) => {
                        console.error('Error fetching supply requests:', error);
                        Alert.alert('Error', 'Failed to fetch your supply requests: ' + error.message);
                        reject(error);
                    }
                );
                unsubscribeRefs.current.push(unsubscribeSupply);
            });
        };

        const fetchMaintenanceRequests = async () => {
            const maintenanceRequestsRef = collection(db, 'maintenanceRequests');
            const maintenanceQuery = query(
                maintenanceRequestsRef,
                where('requester', '==', user.uid),
                orderBy('requestDate', 'desc')
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
                                    quantity: 1, // Or some default value
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
                        }
                    },
                    (error: FirestoreError) => {
                        console.error('Error fetching maintenance requests:', error);
                        Alert.alert('Error', 'Failed to fetch your maintenance requests: ' + error.message);
                        reject(error);
                    }
                );
                unsubscribeRefs.current.push(unsubscribeMaintenance);
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
            if (filter === 'supply') {
                filteredRequests = allRequests.filter(req => req.type === 'supply');
            } else if (filter === 'maintenance') {
                filteredRequests = allRequests.filter(req => req.type === 'maintenance');
            }

            setRequests(filteredRequests);
            setLoading(false);
            setRefreshing(false);
        }).catch(error => {
            setLoading(false);
            setRefreshing(false);
        });

    }, [db, user, filter, supplies]); // Add supplies to the dependency array


    useEffect(() => {
        fetchSupplies(); // Fetch supplies
    }, [fetchSupplies]);

    useEffect(() => {
        fetchRequests();

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();

        return () => {
            unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
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
            case 'repairing': return '#3498db'; // Add color for repairing
            default: return '#3498db';
        }
    }, []);

    // Filter requests by search query
    const filteredRequests = requests.filter(request =>
        request.supplyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (request.supplyDescription && request.supplyDescription.toLowerCase().includes(searchQuery.toLowerCase())) || //search description
        request.reason.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = useCallback(({ item }: { item: Request }) => {
        return (
            <Card style={[styles.requestCard]}>
                <Card.Content>
                    <Text style={styles.supplyName}>Supply: {item.supplyName}</Text>
                    {item.supplyDescription && <Text style={styles.supplyDescription}>Description: {item.supplyDescription}</Text>}
                    <Text style={styles.quantity}>Quantity: {item.quantity}</Text>
                    <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
                        Status: {item.status}
                    </Text>
                    {item.maintenanceStatus && item.maintenanceStatus === 'approved' && (
                        <Text style={[styles.maintenanceStatus, { color: '#3498db' }]}>
                            Maintenance: Repairing
                        </Text>
                    )}
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
            <Searchbar
                placeholder="Search Requests"
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
            />
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : filteredRequests.length === 0 ? (
                <Text style={styles.noRequestsText}>You have not made any requests yet</Text>
            ) : (
                <FlatList
                    data={filteredRequests}
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
    const [bottomNavIndex, setBottomNavIndex] = useState(0);
    const [routes] = useState<{
        key: string;
        title: string;
        icon: keyof typeof Ionicons.glyphMap;
        component: React.FC<any>;
    }[]>([
        { key: 'ViewSupply', title: 'View Supply', icon: 'list', component: ViewSupplyScreen },
        { key: 'StaffRequests', title: 'Requests', icon: 'book-outline', component: StaffRequestsComponent },
        { key: 'RequestSupply', title: 'Request Supply', icon: 'add-circle', component: RequestSupplyScreen },      
        { key: 'MaintenanceRequest', title: 'Maintenance', icon: 'build', component: MaintenanceRequestScreen },
        { key: 'ReturnSupply', title: 'Return', icon: 'return-up-back', component: ReturnSupplyScreen },
    ]);

    const renderScene = useCallback(({ route }: { route: any }) => {
        const Component = route.component;
        if (route.key === 'StaffRequests') {
            return (
                <TopTab.Navigator
                    screenOptions={{
                        tabBarActiveTintColor: '#dbeafe',
                        tabBarInactiveTintColor: '#f0f9ff',
                        tabBarStyle: {
                            backgroundColor: '#1c398e',
                            elevation: 4,
                        },
                        tabBarLabelStyle: {
                            fontWeight: 'bold',
                            fontSize: 12,
                            fontFamily: 'System',
                        },
                        tabBarIndicatorStyle: {
                            backgroundColor: '#dbeafe',
                            height: 3,
                        },

                    }}
                >
                    <TopTab.Screen
                        name="AllRequests"
                        component={AllRequestsComponent} // Use the defined component
                        options={{ tabBarLabel: 'All' }}
                    />
                    <TopTab.Screen
                        name="SupplyRequests"
                        component={SupplyRequestsComponent} // Use the defined component
                        options={{ tabBarLabel: 'Supply' }}

                    />
                    <TopTab.Screen
                        name="MaintenanceRequests"
                        component={MaintenanceRequestsComponent}  // Use the defined component
                        options={{ tabBarLabel: 'Maintenance' }}
                    />
                </TopTab.Navigator>
            );
        }
        return <Component navigation={navigation} />;
    }, [navigation]);

    const renderBottomNav = () => {
        return (
            <BottomNavigation
                navigationState={{ index: bottomNavIndex, routes }}
                onIndexChange={setBottomNavIndex}
                renderScene={renderScene}
                getLabelText={({ route }: any) => route.title}
                renderIcon={({ route, color }) => (
                    <Ionicons name={route.icon} size={24} color={color} />
                )}
                shifting={true}
                labeled={true}
                inactiveColor="#f0f9ff"
                activeColor="#dbeafe"
                barStyle={{ backgroundColor: '#1c398e', elevation: 4 }}
            />
        );
    };

    return (
        <Provider>
            <View style={{ flex: 1 }}>
                {renderBottomNav()}
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
    maintenanceStatus: { // Added style
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        fontFamily: 'System',
    },
    searchBar: {
        margin: 10,
        marginBottom: 0,
        backgroundColor: '#f5f5f4',
    },
    supplyDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        fontFamily: 'System',
    },
});

export default StaffScreen;
