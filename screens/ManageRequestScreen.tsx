import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, Animated, TouchableOpacity } from 'react-native';
import { globalStyles } from '@/styles/global';
import { db } from '@/firebase/config';
import { collection, getDocs, updateDoc, doc, getDoc, setDoc, orderBy, query, serverTimestamp as firebaseServerTimestamp } from 'firebase/firestore';
import { Button, Card, Menu, Text, PaperProvider, IconButton } from 'react-native-paper'; // Ensure MenuItem is imported
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
    newStatus: 'approved' | 'rejected';
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
                    fadeAnims.current[id] = new Animated.Value(1);
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
                if (selectedFilter === 'all') {
                    fetchedRequests = [...fetchedRequests, ...requestsData];
                } else {
                    fetchedRequests = requestsData;
                }
            }

            if (selectedFilter === 'all' || selectedFilter === 'maintenance') {
                const maintenanceRequestsQuery = query(collection(db, 'maintenanceRequests'), orderBy('requestDate', 'desc'));
                const maintenanceRequestsSnapshot = await getDocs(maintenanceRequestsQuery);

                const maintenanceRequestsData = maintenanceRequestsSnapshot.docs.map(doc => {
                    const id = doc.id;
                    fadeAnims.current[id] = new Animated.Value(1);
                    const data = doc.data() as MaintenanceRequest;
                    return {
                        id,
                        supplyName: data.supplyName || '',
                        supplyId: data.supplyId || '',
                        requester: data.requester || '',
                        reason: data.reason || '',
                        status: data.status || 'pending',
                        createdAt: data.requestDate,
                        logId: data.logId,
                        requesterFirstName: data.requesterFirstName,
                        requesterLastName: data.requesterLastName,
                    };
                });
                if (selectedFilter === 'all') {
                    fetchedRequests = [...fetchedRequests, ...maintenanceRequestsData];
                } else {
                    fetchedRequests = maintenanceRequestsData;
                }
            }

            fetchedRequests.sort((a, b) => {
                const getDate = (item: CombinedRequest) => {
                    // Use createdAt if present, otherwise use requestDate, otherwise epoch
                    const dateValue = (item as any).createdAt ?? (item as any).requestDate ?? new Date(0);
                    if (dateValue && typeof dateValue.toDate === 'function') {
                        return dateValue.toDate();
                    }
                    return dateValue instanceof Date ? dateValue : new Date(dateValue);
                };
                const dateA = getDate(a);
                const dateB = getDate(b);
                return dateA > dateB ? -1 : dateA < dateB ? 1 : 0;
            });

            setRequests(fetchedRequests);
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
            const supplyRef = doc(db, 'supplies', supplyId);
            const supplySnap = await getDoc(supplyRef);

            if (!supplySnap.exists()) {
                Alert.alert('Error', 'Supply does not exist.');
                await updateDoc(doc(db, 'requests', requestId), { status: 'rejected' });
                return;
            }

            const currentQty = supplySnap.data().quantity;

            if (newStatus === 'approved' && currentQty < quantity && 'quantity' in requestData) {
                Alert.alert('Error', 'Insufficient stock for approval');
                return;
            }

            const requestDocRef = doc(db, 'requests', requestId);
            const maintenanceRequestDocRef = doc(db, 'maintenanceRequests', requestId);


            if (newStatus === 'approved') {
                if ('quantity' in requestData) {
                    await updateDoc(supplyRef, { quantity: currentQty - requestData.quantity });
                    const issuanceLogRef = doc(collection(db, 'issuanceLogs'), requestId);
                    await setDoc(issuanceLogRef, {
                        ...requestData,
                        status: newStatus,
                        issuedAt: firebaseServerTimestamp(),
                    });
                }
            }

            const requestDoc = await getDoc(requestDocRef);
            if (requestDoc.exists()) {
                await updateDoc(requestDocRef, { status: newStatus });
            } else {
                const maintenanceRequestDoc = await getDoc(maintenanceRequestDocRef);
                if (maintenanceRequestDoc.exists()) {
                    await updateDoc(maintenanceRequestDocRef, { status: newStatus });
                } else {
                    Alert.alert('Error', 'Request does not exist.');
                    return;
                }
            }

            Animated.timing(fadeAnims.current[requestId], {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setRequests(prev => prev.filter(item => item.id !== requestId));
            });

            Alert.alert(newStatus === 'approved' ? 'Approved' : 'Rejected', `Request ${newStatus}`);
        } catch (error: any) {
            console.error(`Error handling ${newStatus}:`, error.message || error);
            Alert.alert('Error', `Failed to ${newStatus} request: ${error.message}`);
        }
    };

    const renderItem = ({ item }: { item: CombinedRequest }) => {
        const fadeAnim = fadeAnims.current[item.id] || new Animated.Value(1);

        const getStatusColor = (status: string) => {
            switch (status) {
                case 'pending': return '#FFA000';
                case 'approved': return '#4CAF50';
                case 'rejected': return '#FF3B30';
                default: return '#555';
            }
        };

        return (
            <Animated.View style={[styles.cardContainer, { opacity: fadeAnim }]}>
                <Card style={styles.card}>
                    <Card.Content style={styles.cardContent}>
                        <View style={styles.requestInfo}>
                            <Text style={styles.supplyName}>{item.supplyName}</Text>
                            {('quantity' in item) && <Text style={styles.detailText}>Quantity: {item.quantity}</Text>}
                            <Text style={styles.detailText}>
                                By: {item.requesterFirstName} {item.requesterLastName} ({item.requester})
                            </Text>
                            <Text style={styles.reasonText} numberOfLines={2} ellipsizeMode="tail">
                                Reason: {item.reason}
                            </Text>
                            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                Status: {item.status}
                            </Text>
                        </View>

                        {item.status === 'pending' && (
                            <View style={styles.actionsContainer}>
                                <Button
                                    mode="contained"
                                    style={styles.approveButton}
                                    onPress={() => handleStatusChange({
                                        requestId: item.id,
                                        supplyId: item.supplyId,
                                        quantity: ('quantity' in item) ? item.quantity : 0,
                                        newStatus: 'approved',
                                        requestData: item,
                                    })}
                                >
                                    Approve
                                </Button>
                                <Button
                                    mode="contained"
                                    style={styles.rejectButton}
                                    onPress={() => handleStatusChange({
                                        requestId: item.id,
                                        supplyId: item.supplyId,
                                        quantity: ('quantity' in item) ? item.quantity : 0,
                                        newStatus: 'rejected',
                                        requestData: item,
                                    })}
                                >
                                    Reject
                                </Button>
                            </View>
                        )}
                    </Card.Content>
                </Card>
            </Animated.View>
        );
    };

    return (
        <PaperProvider>
            <View>
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
                                    style={styles.filterIconStyle} // Apply new style here
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
                {requests.length === 0 && !loading ? (
                    <Text style={styles.noRequestsText}>No Requests Found</Text>
                ) : (
                    <FlatList
                        data={requests}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                )}
            </View>
        </PaperProvider>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    card: {
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        elevation: 2,
    },
    cardContent: {
        padding: 16,
    },
    requestInfo: {
        marginBottom: 10,
    },
    supplyName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    detailText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    reasonText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
        marginBottom: 8,
    },
    statusText: {
        fontSize: 14,
        fontWeight: 'bold',
        fontStyle: 'italic',
    },
    actionsContainer: {
        flexDirection: 'row',
        marginTop: 10,
        justifyContent: 'space-between',
    },
    approveButton: {
        backgroundColor: '#4CAF50',
        marginRight: 5,
        flex: 1,
    },
    rejectButton: {
        backgroundColor: '#FF3B30',
        marginLeft: 5,
        flex: 1,
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 14,
    },
    noRequestsText: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        marginTop: 20,
    },
    filterContainer: {
        alignItems: 'flex-start',
        marginBottom: 60,
        paddingHorizontal: 10,
        width: '30%',
        height: 10,
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
        fontSize: 10,
        color: '#333',
        marginRight: 8,
    },
    filterIconStyle: { // New style for the icon
        margin: 0,     // Remove default margin
        padding: 0,    // Remove default padding
        backgroundColor: 'transparent', // Ensure no background
    },
});

function serverTimestamp(): any {
    return firebaseServerTimestamp();
}

export default ManageRequestsScreen;

