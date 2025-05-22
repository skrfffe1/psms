import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, Animated, TouchableOpacity } from 'react-native';
import { globalStyles } from '@/styles/global'; // Assuming this provides base styles, though not directly used in the provided snippet
import { db } from '@/firebase/config';
import { collection, getDocs, updateDoc, doc, getDoc, setDoc, orderBy, query, serverTimestamp as firebaseServerTimestamp } from 'firebase/firestore';
import { Button, Card, Menu, Text, PaperProvider, IconButton } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';

interface Request {
    id: string;
    supplyName: string;
    supplyId: string;
    quantity: number;
    requester: string;
    reason: string;
    status: string;
    createdAt?: any;
    requesterFirstName?: string;
    requesterLastName?: string;
}

interface MaintenanceRequest {
    id: string;
    supplyName: string;
    supplyId: string;
    requester: string;
    reason: string;
    status: string;
    requestDate?: any;
    logId: string;
    requesterFirstName?: string;
    requesterLastName?: string;
}

type CombinedRequest = Request | MaintenanceRequest;

interface HandleStatusChangeParams {
    requestId: string;
    supplyId: string;
    quantity: number;
    newStatus: 'issued' | 'rejected';
    requestData: CombinedRequest;
}

const ManageRequestsScreen = ({ navigation }: { navigation: StackNavigationProp<RootStackParamList, 'ManageRequest'> }) => {
    const [requests, setRequests] = useState<CombinedRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const fadeAnims = useRef<{ [key: string]: Animated.Value }>({});
    const [filterMenuVisible, setFilterMenuVisible] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'supply' | 'maintenance'>('all');
    const [filterLabel, setFilterLabel] = useState('All Requests');

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            let fetchedRequests: CombinedRequest[] = [];

            if (selectedFilter === 'all' || selectedFilter === 'supply') {
                const requestsQuery = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
                const requestsSnapshot = await getDocs(requestsQuery);

                const requestsData = requestsSnapshot.docs.map(doc => {
                    const id = doc.id;
                    if (!fadeAnims.current[id]) { // Initialize Animated.Value only if it doesn't exist
                        fadeAnims.current[id] = new Animated.Value(1);
                    }
                    const data = doc.data() as Request;
                    return {
                        id,
                        supplyName: data.supplyName || '',
                        supplyId: data.supplyId || '',
                        quantity: data.quantity || 0,
                        requester: data.requester || '',
                        reason: data.reason || '',
                        status: data.status || 'pending',
                        createdAt: data.createdAt,
                        requesterFirstName: data.requesterFirstName,
                        requesterLastName: data.requesterLastName
                    };
                });
                fetchedRequests = [...fetchedRequests, ...requestsData];
            }

            if (selectedFilter === 'all' || selectedFilter === 'maintenance') {
                const maintenanceRequestsQuery = query(collection(db, 'maintenanceRequests'), orderBy('requestDate', 'desc'));
                const maintenanceRequestsSnapshot = await getDocs(maintenanceRequestsQuery);

                const maintenanceRequestsData = maintenanceRequestsSnapshot.docs.map(doc => {
                    const id = doc.id;
                    if (!fadeAnims.current[id]) { // Initialize Animated.Value only if it doesn't exist
                        fadeAnims.current[id] = new Animated.Value(1);
                    }
                    const data = doc.data() as MaintenanceRequest;
                    return {
                        id,
                        supplyName: data.supplyName || '',
                        supplyId: data.supplyId || '',
                        requester: data.requester || '',
                        reason: data.reason || '',
                        status: data.status || 'pending',
                        createdAt: data.requestDate, // Using 'createdAt' for consistent sorting
                        logId: data.logId,
                        requesterFirstName: data.requesterFirstName,
                        requesterLastName: data.requesterLastName,
                    };
                });
                fetchedRequests = [...fetchedRequests, ...maintenanceRequestsData];
            }

            // Remove duplicates (important if fetching both types and "all" is selected)
            const uniqueRequestsMap = new Map<string, CombinedRequest>();
            fetchedRequests.forEach(req => uniqueRequestsMap.set(req.id, req));
            const uniqueRequests = Array.from(uniqueRequestsMap.values());

            uniqueRequests.sort((a, b) => {
                const getDate = (item: CombinedRequest) => {
                    const dateValue = (item as any).createdAt ?? (item as any).requestDate ?? new Date(0);
                    if (dateValue === null || dateValue === undefined) {
                        return new Date(0); // fallback to epoch if date is missing
                    }
                    if (typeof dateValue.toDate === 'function') {
                        return dateValue.toDate();
                    }
                    return dateValue instanceof Date ? dateValue : new Date(dateValue);
                };
                const dateA = getDate(a);
                const dateB = getDate(b);
                return dateA > dateB ? -1 : dateA < dateB ? 1 : 0;
            });

            setRequests(uniqueRequests);
        } catch (error: any) {
            console.error('Error fetching requests:', error.message || error);
            Alert.alert('Error', 'Failed to fetch requests.');
        } finally {
            setLoading(false);
        }
    }, [selectedFilter]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleStatusChange = async ({ requestId, supplyId, quantity, newStatus, requestData }: HandleStatusChangeParams) => {
        try {
            const isSupplyRequest = 'quantity' in requestData; // Determine if it's a supply request

            if (isSupplyRequest && newStatus === 'issued') {
                const supplyRef = doc(db, 'supplies', supplyId);
                const supplySnap = await getDoc(supplyRef);

                if (!supplySnap.exists()) {
                    Alert.alert('Error', 'Supply does not exist. Request cannot be approved.');
                    await updateDoc(doc(db, 'requests', requestId), { status: 'rejected' });
                    fetchRequests(); // Re-fetch to update status immediately
                    return;
                }

                const currentQty = supplySnap.data().quantity;
                if (currentQty < quantity) {
                    Alert.alert('Error', 'Insufficient stock for approval.');
                    return; // Don't proceed with update if stock is insufficient
                }
                await updateDoc(supplyRef, { quantity: currentQty - quantity }); // Use 'quantity' parameter
            }

            // Update the request status in its original collection
            const collectionName = isSupplyRequest ? 'requests' : 'maintenanceRequests';
            const requestDocRef = doc(db, collectionName, requestId);
            await updateDoc(requestDocRef, { status: newStatus });

            // If a supply request is issued, log it
            if (isSupplyRequest && newStatus === 'issued') {
                const issuanceLogRef = doc(collection(db, 'issuanceLogs'), requestId);
                await setDoc(issuanceLogRef, {
                    ...requestData, // Spread existing data
                    status: newStatus,
                    issuedAt: firebaseServerTimestamp(), // Use issuedAt for issuance logs
                });
            }

            Animated.timing(fadeAnims.current[requestId], {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setRequests(prev => prev.filter(item => item.id !== requestId));
                // Optional: Re-fetch if you want to ensure the list is always up-to-date
                // fetchRequests();
            });

            Alert.alert(newStatus === 'issued' ? 'Approved' : 'Rejected', `Request ${newStatus}.`);
        } catch (error: any) {
            console.error(`Error handling ${newStatus}:`, error.message || error);
            Alert.alert('Error', `Failed to ${newStatus} request: ${error.message}`);
        }
    };

    const renderItem = ({ item }: { item: CombinedRequest }) => {
        const fadeAnim = fadeAnims.current[item.id] || new Animated.Value(1);

        const getStatusColor = (status: string) => {
            switch (status) {
                case 'pending': return '#FFA000'; // Orange
                case 'approved': return '#28a745'; // Green
                case 'issued': return '#28a745'; // Green
                case 'rejected': return '#dc3545'; // Red
                case 'completed': return '#007bff'; // Blue
                default: return '#6c757d'; // Gray
            }
        };

        const isSupplyRequest = 'quantity' in item;

        return (
            <Animated.View style={[styles.cardContainer, { opacity: fadeAnim }]}>
                <Card style={styles.card}>
                    <Card.Content style={styles.cardContent}>
                        <View style={styles.requestInfo}>
                            <Text style={styles.supplyName}>{item.supplyName} ({isSupplyRequest ? 'Supply' : 'Maintenance'})</Text>
                            {isSupplyRequest && <Text style={styles.detailText}>Quantity: {item.quantity}</Text>}
                            <Text style={styles.detailText}>
                                By: {item.requesterFirstName} {item.requesterLastName}
                            </Text>
                            <Text style={styles.detailText} numberOfLines={2} ellipsizeMode="tail">
                                Reason: {item.reason}
                            </Text>
                            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                Status: {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </Text>
                        </View>

                        {item.status === 'pending' && (
                            <View style={styles.actionsContainer}>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.approveButton]}
                                    onPress={() => handleStatusChange({
                                        requestId: item.id,
                                        supplyId: item.supplyId,
                                        quantity: isSupplyRequest ? (item as Request).quantity : 0, // Ensure quantity for supply requests
                                        newStatus: 'issued',
                                        requestData: item,
                                    })}
                                >
                                    <Text style={styles.buttonText}>Approve</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.rejectButton]}
                                    onPress={() => handleStatusChange({
                                        requestId: item.id,
                                        supplyId: item.supplyId,
                                        quantity: 0, // Not relevant for rejection
                                        newStatus: 'rejected',
                                        requestData: item,
                                    })}
                                >
                                    <Text style={styles.buttonText}>Reject</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </Card.Content>
                </Card>
            </Animated.View>
        );
    };

    return (
        <PaperProvider>
            <View style={styles.container}> {/* Added main container for overall padding */}
                <View style={styles.filterContainer}>
                    <Menu
                        visible={filterMenuVisible}
                        onDismiss={() => setFilterMenuVisible(false)}
                        anchor={
                            <TouchableOpacity onPress={() => setFilterMenuVisible(true)} style={styles.filterButton}>
                                <Text style={styles.filterLabel}>{filterLabel}</Text>
                                <IconButton
                                    icon="chevron-down"
                                    size={18} // Slightly smaller icon
                                    iconColor="#666" // Darker grey for icon
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
                    <Text style={styles.loadingText}>Loading requests</Text>
                ) : requests.length === 0 ? (
                    <Text style={styles.noRequestsText}>No requests found for this filter.</Text>
                ) : (
                    <FlatList
                        data={requests}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContentContainer}
                    />
                )}
            </View>
        </PaperProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 10, // Added padding to the top of the whole screen
        backgroundColor: '#f5f5f5', // Consistent background
    },
    cardContainer: {
        paddingHorizontal: 8, // Reduced horizontal padding
        marginBottom: 8, // Reduced margin between cards
    },
    card: {
        backgroundColor: '#fff', // White background for cards
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardContent: {
        paddingVertical: 12, // Reduced vertical padding
        paddingHorizontal: 15, // Reduced horizontal padding
    },
    requestInfo: {
        marginBottom: 8, // Reduced margin below info block
    },
    supplyName: {
        fontSize: 15, // Slightly smaller font
        fontWeight: 'bold',
        color: '#1c398e', // Primary blue for supply name
        marginBottom: 2, // Reduced spacing
    },
    detailText: {
        fontSize: 13, // Slightly smaller font
        color: '#333', // Darker grey for details
        lineHeight: 18, // Adjusted line height for compactness
    },
    reasonText: {
        fontSize: 13, // Consistent font size
        color: '#555', // Medium grey
        lineHeight: 18,
        marginBottom: 6, // Adjusted spacing
    },
    statusText: {
        fontSize: 13, // Consistent font size
        fontWeight: 'bold',
        fontStyle: 'italic',
        marginTop: 5, // Small margin above status
    },
    actionsContainer: {
        flexDirection: 'row',
        marginTop: 8, // Reduced margin above buttons
        justifyContent: 'space-between',
        paddingHorizontal: 0, // Ensure no extra padding
    },
    actionButton: {
        flex: 1,
        paddingVertical: 8, // Reduced vertical padding for buttons
        borderRadius: 5, // Slightly smaller border radius
        justifyContent: 'center',
        alignItems: 'center',
    },
    approveButton: {
        backgroundColor: '#28a745', // Green for approve
        marginRight: 4, // Reduced margin
    },
    rejectButton: {
        backgroundColor: '#dc3545', // Red for reject
        marginLeft: 4, // Reduced margin
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13, // Slightly smaller font size for button text
    },
    noRequestsText: {
        fontSize: 15,
        color: '#888',
        textAlign: 'center',
        marginTop: 20,
        paddingHorizontal: 20,
    },
    loadingText: {
        fontSize: 15,
        color: '#888',
        textAlign: 'center',
        marginTop: 20,
        paddingHorizontal: 20,
    },
    filterContainer: {
        width: '100%', // Make filter container take full width
        alignItems: 'flex-start', // Align content to the left
        marginBottom: 10, // Reduced margin below filter
        paddingHorizontal: 10, // Keep consistent horizontal padding
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6, // Reduced padding
        paddingHorizontal: 10, // Reduced padding
        borderRadius: 6, // Smaller border radius
        backgroundColor: '#e9ecef', // Light grey button background
        borderWidth: 1,
        borderColor: '#ced4da', // Light border color
    },
    filterLabel: {
        fontSize: 12, // Smaller font for filter label
        color: '#495057', // Darker grey text
        marginRight: 5, // Reduced margin
    },
    filterIconStyle: {
        margin: 0,
        padding: 0,
        backgroundColor: 'transparent',
    },
    listContentContainer: {
        paddingBottom: 20, // Keep some padding at the bottom of the list
    }
});

function serverTimestamp(): any {
    return firebaseServerTimestamp();
}

export default ManageRequestsScreen;