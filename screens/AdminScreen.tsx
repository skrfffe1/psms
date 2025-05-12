// AdminScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import AdminDashboardCarousel from '@/components/AdminDashboardCarousel';
import RecentRequests from '@/components/RecentRequests';
import QuickActions from '@/components/QuickActions';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Button, Card, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore'; // Import for Firebase
import { db } from '@/firebase/config';

const Tab = createMaterialTopTabNavigator();

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    // Add other relevant user fields
}

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
            {/* You could add a summary of supplies here if needed */}
        </View>
    );
}

function RequestsTab() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    return (
        <View style={styles.tabContainer}>
            <Text style={styles.tabTitle}>Requests Management</Text>
            <Button
                mode="contained"
                onPress={() => navigation.navigate('ManageRequest')}
                style={styles.navigationButton}
            >
                Manage Supply Requests
            </Button>
            {/* You could add a summary of pending requests here */}
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

    const renderUserItem = ({ item }: { item: User }) => (
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
    return (
        <View style={{ flex: 1 }}>
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
                <Tab.Screen name="Requests" component={RequestsTab} />
                <Tab.Screen name="Users" component={UsersTab} />
                <Tab.Screen name="Activity" component={ActivityTab} />
            </Tab.Navigator>
        </View>
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
});

export default AdminScreen;