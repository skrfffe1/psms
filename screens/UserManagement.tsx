// screens/UserManagementScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { getFirestore, collection, query, onSnapshot, doc, updateDoc, orderBy, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, Text, Card, Searchbar, Modal, Portal, TextInput, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker'; // For role selection

interface AppUser {
    uid: string;
    email: string;
    displayName: string;
    role: 'staff' | 'admin';
    createdAt: Date | null;
}

// Request interfaces (simplified for display in UserManagementScreen)
interface Request {
    id: string;
    supplyName: string;
    quantity?: number; // Optional for maintenance
    reason: string;
    status: string;
    createdAt: Date | null;
    type: 'supply' | 'maintenance';
}

const UserManagement: React.FC = () => {
    // Extend the type of currentUser to include 'role' if your AuthContext provides it
    const { user: currentUser } = useAuth() as { user: (AppUser & { role: 'staff' | 'admin' }) | null };
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // Modal state for editing user
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
    const [editedDisplayName, setEditedDisplayName] = useState('');
    const [editedEmail, setEditedEmail] = useState('');
    const [editedRole, setEditedRole] = useState<'staff' | 'admin'>('staff');

    // State for expanded user cards
    const [expandedUserIds, setExpandedUserIds] = useState<string[]>([]);
    const [userTransactions, setUserTransactions] = useState<{ [key: string]: Request[] }>({});

    const db = getFirestore();

    const fetchUsers = useCallback(() => {
        setRefreshing(true);
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('firstName', 'desc'));
        setLoading(true);

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const usersData: AppUser[] = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    uid: doc.id,
                    email: data.email,
                    displayName: data.firstName || 'N/A',
                    role: data.role || 'staff',
                    createdAt: data.createdAt?.toDate() || null,
                };
            });
            setUsers(usersData);
            setLoading(false);
            setRefreshing(false);

            // Fetch transactions for newly loaded users if they are expanded
            const transactionsPromises = expandedUserIds.map(async (userId) => {
                if (!userTransactions[userId]) { // Only fetch if not already fetched
                    await fetchUserTransactions(userId);
                }
            });
            await Promise.all(transactionsPromises);

        }, (error) => {
            console.error("Error fetching users:", error);
            Alert.alert("Error", "Failed to load users: " + error.message);
            setLoading(false);
            setRefreshing(false);
        });

        return unsubscribe;
    }, [db, expandedUserIds, userTransactions]); // Add dependencies

    const fetchUserTransactions = useCallback(async (userId: string) => {
        try {
            const transactions: Request[] = [];

            // Fetch supply requests
            const supplyReqQuery = query(
                collection(db, 'requests'),
                where('requester', '==', userId),
                orderBy('createdAt', 'desc')
            );
            const supplySnapshot = await getDocs(supplyReqQuery);
            supplySnapshot.forEach(doc => {
                const data = doc.data();
                transactions.push({
                    id: doc.id,
                    supplyName: data.supplyName,
                    quantity: data.quantity,
                    reason: data.reason,
                    status: data.status,
                    createdAt: data.createdAt?.toDate() || null,
                    type: 'supply',
                });
            });

            // Fetch maintenance requests
            const maintenanceReqQuery = query(
                collection(db, 'maintenanceRequests'),
                where('requester', '==', userId),
                orderBy('requestDate', 'desc')
            );
            const maintenanceSnapshot = await getDocs(maintenanceReqQuery);
            maintenanceSnapshot.forEach(doc => {
                const data = doc.data();
                transactions.push({
                    id: doc.id,
                    supplyName: data.supplyName, // Assuming a 'name' field for maintenance items
                    reason: data.reason,
                    status: data.status,
                    createdAt: data.requestDate?.toDate() || null,
                    type: 'maintenance',
                });
            });

            // Sort all transactions by date
            transactions.sort((a, b) => {
                if (!a.createdAt) return 1;
                if (!b.createdAt) return -1;
                return b.createdAt.getTime() - a.createdAt.getTime();
            });

            setUserTransactions(prev => ({ ...prev, [userId]: transactions.slice(0, 5) })); // Limit to 5 for preview
        } catch (error) {
            console.error(`Error fetching transactions for user ${userId}:`, error);
            Alert.alert("Error", "Failed to load user transactions.");
        }
    }, [db]);

    useEffect(() => {
        const unsubscribe = fetchUsers();
        return () => unsubscribe();
    }, [fetchUsers]);

    const handleEditUser = (user: AppUser) => {
        setSelectedUser(user);
        setEditedDisplayName(user.displayName);
        setEditedEmail(user.email);
        setEditedRole(user.role);
        setIsEditModalVisible(true);
    };

    const handleSaveUserChanges = async () => {
        if (!selectedUser) return;

        // Prevent admin from changing their own role
        if (selectedUser.uid === currentUser?.uid && editedRole !== currentUser?.role) {
            Alert.alert("Permission Denied", "You cannot change your own role.");
            return;
        }

        try {
            const userDocRef = doc(db, 'users', selectedUser.uid);
            await updateDoc(userDocRef, {
                displayName: editedDisplayName,
                email: editedEmail, // Note: Changing email in Firestore user doc does NOT change Firebase Auth email.
                role: editedRole,
            });
            Alert.alert("Success", "User details updated successfully!");
            setIsEditModalVisible(false);
        } catch (error) {
            console.error("Error updating user:", error);
            let errorMessage = "Failed to update user details.";
            if (error instanceof Error) {
                errorMessage += " " + error.message;
            }
            Alert.alert("Error", errorMessage);
        }
    };

    const handleResetPassword = (email: string) => {
        Alert.alert(
            "Reset Password",
            `Do you want to send a password reset email to ${email}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Send",
                    onPress: async () => {
                        // In a real application, you would trigger a Firebase Cloud Function here
                        // to send the password reset email securely from the backend.
                        // Direct client-side password reset for other users is not generally recommended.
                        Alert.alert("Info", "Password reset email link sent (simulated). In a real app, this would be handled securely by a backend function.");
                        console.log(`Simulating password reset email sent to: ${email}`);
                    },
                },
            ]
        );
    };

    const toggleExpandUser = useCallback(async (userId: string) => {
        setExpandedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
        // Fetch transactions only if expanding and not already fetched
        if (!expandedUserIds.includes(userId) && !userTransactions[userId]) {
            await fetchUserTransactions(userId);
        }
    }, [expandedUserIds, userTransactions, fetchUserTransactions]);


    const filteredUsers = users.filter(user =>
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderUserCard = ({ item: user }: { item: AppUser }) => {
        const isExpanded = expandedUserIds.includes(user.uid);
        const transactions = userTransactions[user.uid] || [];

        return (
            <Card style={styles.userCard}>
                <TouchableOpacity onPress={() => toggleExpandUser(user.uid)} style={styles.cardHeaderTouch}>
                    <View style={styles.cardHeader}>
                        <View>
                            <Text style={styles.userName}>{user.displayName}</Text>
                            <Text style={styles.userEmail}>{user.email}</Text>
                        </View>
                        <View style={styles.roleContainer}>
                            <Text style={styles.userRole}>{user.role.toUpperCase()}</Text>
                            <Ionicons
                                name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
                                size={20}
                                color="#555"
                            />
                        </View>
                    </View>
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.expandedContent}>
                        <Text style={styles.detailText}>Joined: {user.createdAt ? user.createdAt.toLocaleDateString() : 'N/A'}</Text>

                        {/* User Actions */}
                        <View style={styles.actionButtonsContainer}>
                            <Button
                                mode="outlined"
                                onPress={() => handleEditUser(user)}
                                icon="pencil"
                                compact
                                style={styles.actionButton}
                                labelStyle={styles.actionButtonLabel}
                            >
                                Edit Profile
                            </Button>
                            <Button
                                mode="outlined"
                                onPress={() => handleResetPassword(user.email)}
                                icon="lock-reset"
                                compact
                                style={styles.actionButton}
                                labelStyle={styles.actionButtonLabel}
                            >
                                Reset Pass
                            </Button>
                        </View>

                        {/* Transactions Section */}
                        <Text style={styles.sectionTitle}>Recent Transactions:</Text>
                        {transactions.length > 0 ? (
                            <View style={styles.transactionsList}>
                                {transactions.map((transaction) => (
                                    <View key={transaction.id} style={styles.transactionItem}>
                                        <Text style={styles.transactionText}>
                                            <Text style={{ fontWeight: 'bold' }}>{transaction.type === 'supply' ? 'Supply' : 'Maintenance'}:</Text> {transaction.supplyName} {transaction.quantity ? `(x${transaction.quantity})` : ''} - Status: {transaction.status}
                                        </Text>
                                        <Text style={styles.transactionDate}>
                                            {transaction.createdAt ? transaction.createdAt.toLocaleDateString() : 'N/A'}
                                        </Text>
                                    </View>
                                ))}
                                <Button
                                    mode="text"
                                    onPress={() => Alert.alert("View More", "Navigate to a full transaction history screen.")}
                                    compact
                                    style={styles.viewMoreButton}
                                    labelStyle={styles.viewMoreButtonLabel}
                                >
                                    View Full History
                                </Button>
                            </View>
                        ) : (
                            <Text style={styles.noTransactionsText}>No recent transactions.</Text>
                        )}
                    </View>
                )}
            </Card>
        );
    };

    return (
        <Portal.Host>
            <View style={styles.container}>
                <Searchbar
                    placeholder="Search users by name or email"
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                />

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text>Loading users...</Text>
                    </View>
                ) : filteredUsers.length === 0 ? (
                    <Text style={styles.noUsersText}>No users found.</Text>
                ) : (
                    <FlatList
                        data={filteredUsers}
                        renderItem={renderUserCard}
                        keyExtractor={(item) => item.uid}
                        contentContainerStyle={styles.listContentContainer}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={fetchUsers} />
                        }
                    />
                )}

                <Portal>
                    <Modal visible={isEditModalVisible} onDismiss={() => setIsEditModalVisible(false)} contentContainerStyle={styles.modalContent}>
                        <ScrollView contentContainerStyle={styles.modalScrollView}>
                            <Text style={styles.modalTitle}>Edit User Details</Text>
                            <TextInput
                                label="Display Name"
                                value={editedDisplayName}
                                onChangeText={setEditedDisplayName}
                                mode="outlined"
                                style={styles.textInput}
                            />
                            <TextInput
                                label="Email"
                                value={editedEmail}
                                onChangeText={setEditedEmail}
                                mode="outlined"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                style={styles.textInput}
                                // Firebase Auth email change is a separate operation and not done here.
                                // This only updates the Firestore user document's email field.
                                disabled={true} // Usually email changes require re-authentication or specific flows
                            />

                            <Text style={styles.pickerLabel}>User Role:</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={editedRole}
                                    onValueChange={(itemValue: 'staff' | 'admin') => setEditedRole(itemValue)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Staff" value="staff" />
                                    <Picker.Item label="Admin" value="admin" />
                                </Picker>
                            </View>

                            <Button mode="contained" onPress={handleSaveUserChanges} style={styles.saveButton}>
                                Save Changes
                            </Button>
                            <Button mode="outlined" onPress={() => setIsEditModalVisible(false)} style={styles.cancelButton}>
                                Cancel
                            </Button>
                        </ScrollView>
                    </Modal>
                </Portal>
            </View>
        </Portal.Host>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4f8',
        paddingTop: 8, // Space from status bar/top edge
    },
    searchBar: {
        marginHorizontal: 10,
        marginBottom: 8,
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noUsersText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#666',
    },
    listContentContainer: {
        paddingHorizontal: 10,
        paddingBottom: 20, // Ensure space for FAB or bottom nav
    },
    userCard: {
        marginVertical: 6,
        borderRadius: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        backgroundColor: '#fff',
    },
    cardHeaderTouch: {
        padding: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1c398e',
    },
    userEmail: {
        fontSize: 14,
        color: '#555',
    },
    roleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e0e0e0',
        borderRadius: 5,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    userRole: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#333',
        marginRight: 5,
    },
    expandedContent: {
        padding: 15,
        paddingTop: 5,
    },
    detailText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 15,
        marginTop: 5,
    },
    actionButton: {
        flex: 1,
        marginHorizontal: 5,
        borderColor: '#1c398e',
    },
    actionButtonLabel: {
        fontSize: 12,
        color: '#1c398e',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 5,
    },
    transactionsList: {
        marginTop: 5,
    },
    transactionItem: {
        backgroundColor: '#f9f9f9',
        padding: 8,
        borderRadius: 5,
        marginBottom: 6,
        borderLeftWidth: 3,
        borderLeftColor: '#007AFF',
    },
    transactionText: {
        fontSize: 13,
        color: '#333',
    },
    transactionDate: {
        fontSize: 11,
        color: '#777',
        textAlign: 'right',
        marginTop: 2,
    },
    noTransactionsText: {
        fontSize: 13,
        color: '#777',
        textAlign: 'center',
        paddingVertical: 10,
    },
    viewMoreButton: {
        marginTop: 10,
    },
    viewMoreButtonLabel: {
        fontSize: 12,
        color: '#007AFF',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 10,
        maxHeight: '80%', // Limit modal height
    },
    modalScrollView: {
        flexGrow: 1, // Allow content to grow
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#1c398e',
    },
    textInput: {
        marginBottom: 15,
        backgroundColor: '#fff',
    },
    pickerLabel: {
        fontSize: 16,
        color: '#333',
        marginBottom: 5,
        marginTop: 10,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 15,
        overflow: 'hidden', // Ensures picker stays within border
    },
    picker: {
        height: 50,
        width: '100%',
    },
    saveButton: {
        marginTop: 20,
        backgroundColor: '#2ecc71',
    },
    cancelButton: {
        marginTop: 10,
        borderColor: '#e74c3c',
        color: '#e74c3c',
    },
});

export default UserManagement;