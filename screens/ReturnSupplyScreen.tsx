// screens/ReturnSupplyScreen.tsx (Admin/Head Version)

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { Text, Button, Card, Checkbox, ActivityIndicator, Divider, Menu, Portal, Provider } from 'react-native-paper';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, runTransaction, Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

// --- CONDITION TERMS ---
const RETURN_CONDITIONS = [
    'Good Condition',
    'Minor Damage / Cosmetic Damage',
    'Damaged / Needs Repair',
    'Unserviceable / Beyond Repair',
];

interface IssuanceLogItem {
    id: string; // Document ID from Firestore
    createdAt: Date; // Timestamp
    issuedAt: Date; // Timestamp
    quantity: number;
    reason: string;
    requester: string; // UID of the borrower
    requesterFirstName: string;
    requesterLastName: string;
    status: 'pending' | 'issued' | 'returned' | 'rejected'; // Assuming these statuses
    supplyId: string;
    supplyName: string;
    returnedAt?: Date; // New field for returned items
    returnCondition?: string; // NEW: Field to store the condition of the returned item
}

const ReturnSupplyScreen: React.FC = () => {
    const { user, loading: authLoading, role } = useAuth();
    const [issuedItems, setIssuedItems] = useState<IssuanceLogItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<string[]>([]); // Store IDs of selected issuance logs
    const [selectedConditions, setSelectedConditions] = useState<{ [key: string]: string }>({}); // NEW: State to store the selected condition for each item by its ID
    const [menuVisible, setMenuVisible] = useState<{ [key: string]: boolean }>({}); // To control menu visibility per item
    const [loading, setLoading] = useState(true);
    const [isReturning, setIsReturning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false); // State for RefreshControl

    // Only allow admin/head roles to access this screen's functionality
    const isAuthorized = role === 'admin' || role === 'head';

    const fetchIssuedItems = useCallback(async () => {
        setLoading(true);
        setError(null);
        setRefreshing(true); // Start refreshing animation
        try {
            const q = query(
                collection(db, 'issuanceLogs'),
                where('status', '==', 'issued') // Fetch ALL currently issued items
            );
            const querySnapshot = await getDocs(q);
            const items: IssuanceLogItem[] = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    createdAt: (data.createdAt as Timestamp).toDate(),
                    issuedAt: (data.issuedAt as Timestamp).toDate(),
                    quantity: data.quantity,
                    reason: data.reason,
                    requester: data.requester,
                    requesterFirstName: data.requesterFirstName,
                    requesterLastName: data.requesterLastName,
                    status: data.status,
                    supplyId: data.supplyId,
                    supplyName: data.supplyName,
                    returnedAt: data.returnedAt ? (data.returnedAt as Timestamp).toDate() : undefined,
                    returnCondition: data.returnCondition || '', // Initialize condition if not set
                };
            });
            setIssuedItems(items);
            // Initialize selectedConditions for new items fetched
            const initialConditions: { [key: string]: string } = {};
            items.forEach(item => {
                initialConditions[item.id] = item.returnCondition || 'Good Condition'; // Default to 'Good Condition'
            });
            setSelectedConditions(initialConditions);
        } catch (err: any) {
            console.error("Error fetching issued items:", err);
            setError("Failed to load issued items. Please try again.");
        } finally {
            setLoading(false);
            setRefreshing(false); // End refreshing animation
        }
    }, []);

    useEffect(() => {
        if (!authLoading && user) {
            if (isAuthorized) {
                fetchIssuedItems();
            } else {
                setLoading(false);
                setError("You are not authorized to manage supply returns.");
            }
        } else if (!authLoading && !user) {
            setLoading(false);
            setError("You must be logged in to manage supply returns.");
        }
    }, [authLoading, user, isAuthorized, fetchIssuedItems]); // Add fetchIssuedItems to dependencies

    const toggleSelectItem = (itemId: string) => {
        setSelectedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    // Function to handle condition selection
    const handleConditionSelect = (itemId: string, condition: string) => {
        setSelectedConditions(prev => ({
            ...prev,
            [itemId]: condition,
        }));
        setMenuVisible(prev => ({
            ...prev,
            [itemId]: false, // Close the menu after selection
        }));
    };

    const handleReturnSelected = async () => {
        if (!isAuthorized) {
            Alert.alert("Unauthorized", "You do not have permission to perform this action.");
            return;
        }
        if (selectedItems.length === 0) {
            Alert.alert("No items selected", "Please select at least one item to return.");
            return;
        }

        // Validate that a condition is selected for all selected items
        for (const itemId of selectedItems) {
            if (!selectedConditions[itemId]) {
                Alert.alert("Missing Condition", "Please select a return condition for all selected items.");
                return;
            }
        }

        setIsReturning(true);
        setError(null);

        try {
            await runTransaction(db, async (transaction) => {
                const logsToProcess: { logRef: any; supplyRef: any; logData: IssuanceLogItem; supplycurrentQuantity: number; selectedCondition: string }[] = [];

                // --- PHASE 1: READ ALL NECESSARY DOCUMENTS FIRST ---
                for (const logId of selectedItems) {
                    const issuanceLogRef = doc(db, 'issuanceLogs', logId);
                    const issuanceLogDoc = await transaction.get(issuanceLogRef);

                    if (!issuanceLogDoc.exists()) {
                        throw new Error(`Issuance log with ID ${logId} not found.`);
                    }

                    const logData = issuanceLogDoc.data() as IssuanceLogItem;

                    if (logData.status !== 'issued') {
                        throw new Error(`Item "${logData.supplyName}" (Log ID: ${logId}) is not in 'issued' status and cannot be returned.`);
                    }

                    const supplyRef = doc(db, 'supplies', logData.supplyId);
                    const supplyDoc = await transaction.get(supplyRef);

                    if (!supplyDoc.exists()) {
                        throw new Error(`Corresponding supply document for ID ${logData.supplyId} not found.`);
                    }

                    const currentQuantity = supplyDoc.data().quantity || 0;
                    const selectedCondition = selectedConditions[logId]; // Get the condition for THIS item

                    logsToProcess.push({
                        logRef: issuanceLogRef,
                        supplyRef: supplyRef,
                        logData: logData,
                        supplycurrentQuantity: currentQuantity,
                        selectedCondition: selectedCondition, // Store the selected condition
                    });
                }

                // --- PHASE 2: PERFORM ALL WRITES BASED ON READ DATA ---
                for (const item of logsToProcess) {
                    // Update the issuance log status to 'returned' AND add the returnCondition
                    transaction.update(item.logRef, {
                        status: 'returned',
                        returnedAt: Timestamp.now(),
                        returnCondition: item.selectedCondition, // <--- ADD THIS
                    });

                    // Only increment available quantity if the item is in good or minor damaged condition
                    if (item.selectedCondition === 'Good Condition' || item.selectedCondition === 'Minor Damage / Cosmetic Damage') {
                        transaction.update(item.supplyRef, {
                            quantity: item.supplycurrentQuantity + item.logData.quantity
                        });
                    }
                    // For 'Damaged / Needs Repair' or 'Unserviceable / Beyond Repair', the quantity is NOT added back to 'quantity'.
                }
            });

            Alert.alert("Success", "Selected supplies have been marked as returned and inventory updated based on condition.");
            setSelectedItems([]); // Clear selection
            setSelectedConditions({}); // Clear conditions
            await fetchIssuedItems(); // Refresh the list after successful return
        } catch (err: any) {
            console.error("Error returning supplies:", err);
            setError(`Failed to return supplies: ${err.message || "An unknown error occurred."}`);
            Alert.alert("Return Error", `Failed to return supplies: ${err.message || "An unknown error occurred."}`);
        } finally {
            setIsReturning(false);
        }
    };

    const renderItem = ({ item }: { item: IssuanceLogItem }) => (
        <Card style={styles.card} elevation={2}>
            <View style={styles.cardHeader}>
                <Checkbox
                    status={selectedItems.includes(item.id) ? 'checked' : 'unchecked'}
                    onPress={() => toggleSelectItem(item.id)}
                    color="#1c398e" // Blue checkbox color
                />
                <Text style={styles.supplyName}>{item.supplyName} (x{item.quantity})</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.cardBody}>
                <Text style={styles.detailText}>Requester: {item.requesterFirstName} {item.requesterLastName}</Text>
                <Text style={styles.detailText}>Issued On: {item.issuedAt.toLocaleDateString()} {item.issuedAt.toLocaleTimeString()}</Text>
                <Text style={styles.detailText} numberOfLines={1} ellipsizeMode="tail">Reason: {item.reason}</Text>
                <Text style={styles.detailText}>Status: <Text style={{fontWeight: 'bold', color: item.status === 'issued' ? '#FFA000' : '#28a745'}}>{item.status}</Text></Text>
                {selectedItems.includes(item.id) && ( // Only show condition picker if item is selected
                    <View style={styles.conditionPickerContainer}>
                        <Text style={styles.conditionLabel}>Condition:</Text>
                        <Menu
                            visible={menuVisible[item.id] || false}
                            onDismiss={() => setMenuVisible(prev => ({ ...prev, [item.id]: false }))}
                            anchor={
                                <Button
                                    mode="contained" // Changed to contained for a more prominent look
                                    onPress={() => setMenuVisible(prev => ({ ...prev, [item.id]: true }))}
                                    style={styles.conditionButton}
                                    labelStyle={styles.conditionButtonLabel}
                                    buttonColor="#e9ecef" // Light grey background
                                    textColor="#333" // Dark text color
                                >
                                    {selectedConditions[item.id] || 'Select Condition'}
                                </Button>
                            }
                        >
                            {RETURN_CONDITIONS.map((condition) => (
                                <Menu.Item
                                    key={condition}
                                    onPress={() => handleConditionSelect(item.id, condition)}
                                    title={condition}
                                    titleStyle={{fontSize: 13}} // Smaller font for menu items
                                />
                            ))}
                        </Menu>

                    </View>
                )}
            </View>
        </Card>
    );

    if (loading) {
        return (
            <Portal.Host>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#1c398e" />
                    <Text style={styles.loadingText}>Loading issued items</Text>
                </View>
            </Portal.Host>
        );
    }

    if (error) {
        return (
            <Portal.Host>
                <View style={styles.centered}>
                    <Text style={styles.errorText}>{error}</Text>
                    {isAuthorized && (
                        <Button mode="contained" onPress={fetchIssuedItems} style={styles.retryButton} buttonColor="#1c398e">
                            Retry
                        </Button>
                    )}
                </View>
            </Portal.Host>
        );
    }

    if (issuedItems.length === 0 && !loading) { // Added !loading to prevent "No items" while loading
        return (
            <Portal.Host>
                <View style={styles.centered}>
                    <Text style={styles.noItemsText}>No items currently issued.</Text>
                    {isAuthorized && (
                        <Button mode="contained" onPress={fetchIssuedItems} style={styles.retryButton} buttonColor="#1c398e">
                            Refresh List
                        </Button>
                    )}
                </View>
            </Portal.Host>
        );
    }

    return (
        <Portal.Host>
            <View style={styles.container}>
                <FlatList
                    data={issuedItems}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={fetchIssuedItems}
                            tintColor="#1c398e" // Color of the refresh spinner
                        />
                    }
                />
                <Button
                    mode="contained"
                    onPress={handleReturnSelected}
                    disabled={selectedItems.length === 0 || isReturning || !isAuthorized}
                    loading={isReturning}
                    style={styles.returnButton}
                    labelStyle={styles.returnButtonLabel} // Apply labelStyle
                    buttonColor="#1c398e" // Primary blue color
                >
                    {isReturning ? 'Returning' : `Return Selected (${selectedItems.length})`}
                </Button>
            </View>
        </Portal.Host>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10, // Reduced overall padding
        backgroundColor: '#f5f5f5', // Lighter background for consistency
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 15, // Slightly smaller font
        color: '#555',
    },
    errorText: {
        color: '#dc3545', // Red for errors
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 15,
    },
    noItemsText: {
        fontSize: 16, // Slightly smaller
        color: '#777',
        textAlign: 'center',
        marginBottom: 15,
    },
    retryButton: {
        marginTop: 10,
        width: '50%', // Make button slightly narrower
    },
    listContent: {
        paddingBottom: 20, // Keep some padding at the bottom for the FAB
    },
    card: {
        marginVertical: 6, // Reduced vertical margin between cards
        marginHorizontal: 5, // Small horizontal margin
        borderRadius: 8, // Consistent border radius
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        backgroundColor: '#fff', // White card background
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10, // Reduced padding
        paddingBottom: 5, // Reduced bottom padding for header
    },
    divider: {
        marginHorizontal: 10, // Apply margin to divider for better visual separation
        backgroundColor: '#e0e0e0', // Lighter divider
    },
    cardBody: {
        padding: 10, // Reduced padding
        paddingTop: 5, // Reduced top padding for body
    },
    detailText: {
        fontSize: 13, // Smaller font for details
        color: '#333', // Darker text
        marginBottom: 2, // Reduced line spacing
    },
    supplyName: {
        fontSize: 16, // Slightly smaller font
        fontWeight: 'bold',
        marginLeft: 8, // Reduced margin
        flex: 1,
        color: '#1c398e', // Primary blue for supply name
    },
    returnButton: {
        alignSelf: 'center',
        marginTop: 15, // Reduced margin from the list
        paddingVertical: 5, // Reduced vertical padding
        width: '80%', // Made slightly wider for better tap target
        borderRadius: 8, // Consistent border radius
        elevation: 4, // Slightly more prominent shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    returnButtonLabel: {
        fontSize: 15, // Slightly smaller font for the button
        color: '#fff', // White text
        fontWeight: '600', // Semi-bold
    },
    // Styles for Condition Picker
    conditionPickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8, // Reduced margin top
        backgroundColor: '#f0f0f0', // Light background for picker
        borderRadius: 6, // Consistent border radius
        borderWidth: 1,
        borderColor: '#ddd',
        paddingVertical: 3, // Reduced vertical padding
        paddingHorizontal: 8, // Reduced horizontal padding
    },
    conditionLabel: {
        fontSize: 13, // Smaller font
        color: '#555',
        marginRight: 8, // Reduced margin
        fontWeight: 'bold',
    },
    conditionButton: {
        flex: 1,
        justifyContent: 'flex-start',
        borderColor: 'transparent',
        borderWidth: 0,
        paddingHorizontal: 0, // Ensure no padding from the Button itself
    },
    conditionButtonLabel: {
        fontSize: 13, // Smaller font
        color: '#333',
        textAlign: 'left',
    }
});

export default ReturnSupplyScreen;