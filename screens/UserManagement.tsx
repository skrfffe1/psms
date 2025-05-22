// screens/UserManagementScreen.tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // If you use React Navigation
import { Ionicons } from '@expo/vector-icons'; // Assuming Expo or you have Ionicons installed

import { useUsers, UserData } from '@/hooks/useUsers'; // Adjust path
// You might also need a way to manage user actions (e.g., delete user, edit user)
// For simplicity, we'll just display them for now.

const UserListItem: React.FC<{ user: UserData; onPress: (user: UserData) => void }> = ({ user, onPress }) => (
    <TouchableOpacity style={styles.userItem} onPress={() => onPress(user)}>
        <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.displayName}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
        </View>
        <View style={styles.userRoleStatus}>
            <Text style={styles.userRole}>{user.role}</Text>
            <Text style={[styles.userStatus, user.status === 'active' ? styles.statusActive : styles.statusInactive]}>
                {user.status}
            </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#ccc" />
    </TouchableOpacity>
);

export default function UserManagementScreen() {
    const { users, loading, error } = useUsers();
    const navigation = useNavigation(); // Hook for navigation

    const handleUserPress = (user: UserData) => {
        // Navigate to a UserDetailsScreen or open a modal to view/edit user details
        // Example: navigation.navigate('UserDetails', { userId: user.id });
        Alert.alert("User Details", `You pressed on ${user.displayName}\nEmail: ${user.email}`);
        console.log("Pressed user:", user);
    };

    // Placeholder for refresh logic (useUsers already real-time, but for manual pull-to-refresh)
    const onRefresh = () => {
        // useUsers is real-time, so a full refresh often isn't necessary
        // but if you had manual data fetching, you'd trigger it here.
        // For now, it just demonstrates the refresh control.
        console.log("Refreshing...");
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#1c398e" />
                <Text>Loading users...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Error: {error}</Text>
            </View>
        );
    }

    if (users.length === 0) {
        return (
            <View style={styles.centered}>
                <Text>No users found.</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => Alert.alert("Add User", "Implement user creation here!")}>
                    <Text style={styles.addButtonText}>Add New User</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>User Management</Text>
                {/* Optional: Add user search or filter here */}
                <TouchableOpacity style={styles.addButton} onPress={() => Alert.alert("Add User", "Implement user creation here!")}>
                    <Ionicons name="person-add" size={24} color="#fff" />
                    <Text style={styles.addButtonText}>Add User</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={users}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <UserListItem user={item} onPress={handleUserPress} />}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={onRefresh} colors={['#1c398e']} />
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    errorText: {
        color: 'red',
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1c398e',
        padding: 15,
        paddingTop: 40, // Adjust for status bar
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fafaf9',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50', // Green button
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    listContent: {
        paddingHorizontal: 10,
        paddingBottom: 20,
    },
    userItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 15,
        marginVertical: 5,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    userInfo: {
        flex: 1,
        marginRight: 10,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    userEmail: {
        fontSize: 14,
        color: '#777',
        marginTop: 2,
    },
    userRoleStatus: {
        alignItems: 'flex-end',
        marginRight: 10,
    },
    userRole: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#555',
    },
    userStatus: {
        fontSize: 12,
        marginTop: 2,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        fontWeight: 'bold',
    },
    statusActive: {
        backgroundColor: '#e6ffe6',
        color: '#008000',
    },
    statusInactive: {
        backgroundColor: '#ffe6e6',
        color: '#ff0000',
    },
    separator: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginHorizontal: 10,
    },
});