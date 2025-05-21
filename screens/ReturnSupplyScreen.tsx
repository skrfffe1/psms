// screens/ReturnSupplyScreen.tsx (Admin/Head Version)

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
// Import Menu, Portal, and Provider from react-native-paper
// Note: We use 'Provider' here just to indicate it's from RNP, but it should be used at the app root.
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
    // NEW: State to store the selected condition for each item by its ID
    const [selectedConditions, setSelectedConditions] = useState<{ [key: string]: string }>({});
    const [menuVisible, setMenuVisible] = useState<{ [key: string]: boolean }>({}); // To control menu visibility per item
    const [loading, setLoading] = useState(true);
    const [isReturning, setIsReturning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Only allow admin/head roles to access this screen's functionality
    const isAuthorized = role === 'admin' || role === 'head';

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
    }, [authLoading, user, isAuthorized]);

    const fetchIssuedItems = async () => {
        setLoading(true);
        setError(null);
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
        }
    };

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
            fetchIssuedItems(); // Refresh the list
        } catch (err: any) {
            console.error("Error returning supplies:", err);
            setError(`Failed to return supplies: ${err.message || "An unknown error occurred."}`);
            Alert.alert("Return Error", `Failed to return supplies: ${err.message || "An unknown error occurred."}`);
        } finally {
            setIsReturning(false);
        }
    };

    const renderItem = ({ item }: { item: IssuanceLogItem }) => (
        // REMOVED <Provider> HERE!
        <Card style={styles.card} elevation={2}>
            <View style={styles.cardHeader}>
                <Checkbox
                    status={selectedItems.includes(item.id) ? 'checked' : 'unchecked'}
                    onPress={() => toggleSelectItem(item.id)}
                />
                <Text style={styles.supplyName}>{item.supplyName} (x{item.quantity})</Text>
            </View>
            <Divider />
            <View style={styles.cardBody}>
                <Text>Requester: {item.requesterFirstName} {item.requesterLastName}</Text>
                <Text>Issued On: {item.issuedAt.toLocaleDateString()} {item.issuedAt.toLocaleTimeString()}</Text>
                <Text numberOfLines={1} ellipsizeMode="tail">Reason: {item.reason}</Text>
                <Text>Status: {item.status}</Text>
                {selectedItems.includes(item.id) && ( // Only show condition picker if item is selected
                    <View style={styles.conditionPickerContainer}>
                        <Text style={styles.conditionLabel}>Condition:</Text>
                        <Menu
                            visible={menuVisible[item.id] || false}
                            onDismiss={() => setMenuVisible(prev => ({ ...prev, [item.id]: false }))}
                            anchor={
                                <Button
                                    mode="outlined"
                                    onPress={() => setMenuVisible(prev => ({ ...prev, [item.id]: true }))}
                                    style={styles.conditionButton}
                                    labelStyle={styles.conditionButtonLabel}
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
                                />
                            ))}
                        </Menu>

                    </View>
                )}
            </View>
        </Card>
        // REMOVED </Provider> HERE!
    );

    if (loading) {
        return (
            // Portal.Host should ideally be higher up in App.tsx, but if this screen is the only one
            // using Portals and you want to keep it simple, wrapping the top-level view is a quick fix.
            <Portal.Host>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" />
                    <Text style={styles.loadingText}>Loading issued items...</Text>
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
                        <Button mode="contained" onPress={fetchIssuedItems} style={styles.retryButton}>
                            Retry
                        </Button>
                    )}
                </View>
            </Portal.Host>
        );
    }

    if (issuedItems.length === 0) {
        return (
            <Portal.Host>
                <View style={styles.centered}>
                    <Text style={styles.noItemsText}>No items currently issued.</Text>
                    {isAuthorized && (
                        <Button mode="contained" onPress={fetchIssuedItems} style={styles.retryButton}>
                            Refresh List
                        </Button>
                    )}
                </View>
            </Portal.Host>
        );
    }

    return (
        // Portal.Host should wrap your main screen content
        <Portal.Host>
            <View style={styles.container}>
                <FlatList
                    data={issuedItems}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                />
                <Button
                    mode="contained"
                    onPress={handleReturnSelected}
                    disabled={selectedItems.length === 0 || isReturning || !isAuthorized}
                    loading={isReturning}
                    style={styles.returnButton}
                    labelStyle={{ color: '#fafaf9' }} // Ensure text is white
                >
                    {isReturning ? 'Returning...' : `Return Selected (${selectedItems.length})`}
                </Button>
            </View>
        </Portal.Host>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f8f8f8',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 15,
    },
    noItemsText: {
        fontSize: 18,
        color: '#777',
        textAlign: 'center',
        marginBottom: 15,
    },
    retryButton: {
        marginTop: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
        textAlign: 'center',
    },
    listContent: {
        paddingBottom: 20,
    },
    card: {
        marginVertical: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 8,
    },
    cardBody: {
        padding: 16,
        paddingTop: 8,
    },
    details: {
        marginLeft: 10,
        flex: 1,
    },
    supplyName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
        flex: 1,
    },
    returnButton: {
        alignSelf: 'center',
        marginTop: 20,
        paddingVertical: 10,
        backgroundColor: '#1c398e',
        width: '70%',
        
    },
    // Styles for Condition Picker
    conditionPickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#ddd',
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    conditionLabel: {
        fontSize: 14,
        color: '#555',
        marginRight: 10,
        fontWeight: 'bold',
    },
    conditionButton: {
        flex: 1,
        justifyContent: 'flex-start', // Align text to the left
        borderColor: 'transparent',
        borderWidth: 0,
        // REMOVE or adjust this line:
        // paddingHorizontal: 0,
        paddingHorizontal: 8, // <--- Add some reasonable padding here
        // or just remove the line completely if you want default button padding
    },
    conditionButtonLabel: {
        fontSize: 14,
        color: '#333',
        textAlign: 'left', // Ensure text is left-aligned within the button
    }
});

export default ReturnSupplyScreen;