import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import AdminDashboardCarousel from '@/components/AdminDashboardCarousel';
import RecentRequests from '@/components/RecentRequests';
import QuickActions from '@/components/QuickActions';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Button, Card, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore'; // Import for Firebase
import { db } from '@/firebase/config';
import { useRoute as useNativeRoute, RouteProp } from '@react-navigation/native';

const Tab = createMaterialTopTabNavigator();

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

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

// UserRequestsScreen component
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

function OverviewTab() {
    return (
        <View style={styles.tabContainer}>
            <Text style={styles.tabTitle}>Overview</Text>
            <QuickActions />
        </View>
    );
}

function SuppliesTab() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    return (
        <View style={styles.tabContainer}>
            <Text style={styles.tabTitle}>Supplies Management</Text>
            <Button
                mode="contained"
                onPress={() => navigation.navigate('ViewSupply')}
                style={styles.navigationButton}
            >
                View All Supplies
            </Button>
        </View>
    );
}

function UsersTab() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'users'));
            const usersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as User[];
            setUsers(usersData);
        } catch (error) {
            console.error('Error fetching users:', error);
            Alert.alert('Error', 'Failed to fetch users.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleEditUser = (userId: string) => {
        // navigation.navigate('EditUser', { userId }); // Navigate to EditUserScreen
    };

    const handleDeleteUser = (userId: string) => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this user?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'users', userId));
                            Alert.alert('Success', 'User deleted successfully!');
                            fetchUsers(); // Refresh the user list
                        } catch (error) {
                            console.error('Error deleting user:', error);
                            Alert.alert('Error', 'Failed to delete user.');
                        }
                    },
                },
            ],
            { cancelable: false }
        );
    };

    const handleUserPress = (userId: string) => {
        navigation.navigate('UserRequests', { userId }); // Navigate to UserRequestsScreen
    };

    const renderUserItem = ({ item }: { item: User }) => (
        <TouchableOpacity onPress={() => handleUserPress(item.id)}>
            <Card style={styles.userCard}>
                <Card.Content style={styles.userCardContent}>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
                        <Text style={styles.userEmail}>{item.email}</Text>
                        <Text style={styles.userRole}>Role: {item.role}</Text>
                    </View>
                    <View style={styles.userActions}>
                        <IconButton
                            icon="pencil"
                            size={24}
                            onPress={() => handleEditUser(item.id)}
                        />
                        <IconButton
                            icon="delete"
                            size={24}
                            iconColor="red"
                            onPress={() => handleDeleteUser(item.id)}
                        />
                    </View>
                </Card.Content>
            </Card>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.tabContainer}>
                <Text style={styles.tabTitle}>User Management</Text>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.tabContainer}>
            <Text style={styles.tabTitle}>User Management</Text>
            {users.length === 0 ? (
                <Text>No users found.</Text>
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(item) => item.id}
                    renderItem={renderUserItem}
                />
            )}
        </View>
    );
}

function ActivityTab() {
    return (
        <View style={styles.tabContainer}>
            <Text style={styles.tabTitle}>Recent Activity</Text>
            <RecentRequests title="Latest Requests" />
            <RecentRequests title="Recently Processed" type="status" />
        </View>
    );
}

const AdminScreen = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

    return (
        <>
            {/* Top Section: Key Performance Indicators (Carousel) */}
            <View style={styles.kpiSection}>
                <Text style={styles.sectionTitle}>Overview</Text>
                <AdminDashboardCarousel />
            </View>

            {/* Tab Navigator */}
            <Tab.Navigator
                screenOptions={{
                    tabBarActiveTintColor: '#1c398e',
                    tabBarInactiveTintColor: 'gray',
                    tabBarLabelStyle: { fontSize: 10 },
                    tabBarStyle: { backgroundColor: '#f9f9f9' },
                    tabBarIndicatorStyle: { backgroundColor: '#1c398e', height: 2 },
                }}
            >
                <Tab.Screen name="Overview" component={OverviewTab} />
                <Tab.Screen name="Supplies" component={SuppliesTab} />
                <Tab.Screen name="Users" component={UsersTab} />
                <Tab.Screen name="Activity" component={ActivityTab} />
            </Tab.Navigator>

        </>
    );
};

const styles = StyleSheet.create({
    kpiSection: {
        padding: 16,
        marginBottom: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    tabContainer: {
        flex: 1,
        padding: 16,
    },
    tabTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
        textAlign: 'center',
    },
    navigationButton: {
        marginTop: 16,
    },
    userCard: {
        marginBottom: 12,
        borderRadius: 8,
        elevation: 2,
    },
    userCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#555',
    },
    userRole: {
        fontSize: 14,
        color: '#777',
    },
    userActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    filterButtons: {
        marginBottom: 16,
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
    requestDetail: {
        fontSize: 14,
        color: '#555',
        marginBottom: 2,
    },
    requestSupplyName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    requestActions: {
        marginTop: 8,
    },
    actionButton: {
        marginRight: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
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
    container: {
        flex: 1,
        padding: 16,
    },
});

export default AdminScreen;

function useRoute<T extends keyof RootStackParamList>() {
    return useNativeRoute<RouteProp<RootStackParamList, T>>();
}


