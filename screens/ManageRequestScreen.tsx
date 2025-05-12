import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator, Animated } from 'react-native';
import { globalStyles } from '@/styles/global';
import { db } from '@/firebase/config';
import { collection, getDocs, updateDoc, doc, getDoc, setDoc, orderBy, query, serverTimestamp as firebaseServerTimestamp } from 'firebase/firestore';
import { Button, Card, IconButton, Divider } from 'react-native-paper'; // Import IconButton and Divider
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

interface HandleStatusChangeParams {
    requestId: string;
    supplyId: string;
    quantity: number;
    newStatus: 'approved' | 'rejected';
    requestData: Request;
}

const ManageRequestsScreen = ({ navigation }: { navigation: StackNavigationProp<RootStackParamList, 'ManageRequest'> }) => {
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);
    const fadeAnims = useRef<{ [key: string]: Animated.Value }>({});

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const requestsData = querySnapshot.docs.map((doc) => {
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

            setRequests(requestsData);
        } catch (error: any) {
            console.error('Error fetching requests:', error.message || error);
            Alert.alert('Error', 'Failed to fetch requests.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleStatusChange = async ({
        requestId,
        supplyId,
        quantity,
        newStatus,
        requestData,
    }: HandleStatusChangeParams): Promise<void> => {
        try {
            const supplyRef = doc(db, 'supplies', supplyId);
            const supplySnap = await getDoc(supplyRef);

            if (!supplySnap.exists()) {
                Alert.alert('Error', 'Supply does not exist.');
                await updateDoc(doc(db, 'requests', requestId), { status: 'rejected' });
                return;
            }

            const currentQty = supplySnap.data().quantity;

            if (newStatus === 'approved' && currentQty < quantity) {
                Alert.alert('Error', 'Insufficient stock for approval');
                return;
            }

            const requestDocRef = doc(db, 'requests', requestId);

            if (newStatus === 'approved') {
                // Update supply quantity
                await updateDoc(supplyRef, { quantity: currentQty - quantity });

                // Add to issuance logs
                const issuanceLogRef = doc(collection(db, 'issuanceLogs'), requestId);
                await setDoc(issuanceLogRef, {
                    ...requestData,
                    status: newStatus,
                    issuanceDate: serverTimestamp(),
                });
            }

            // Update request status
            await updateDoc(requestDocRef, { status: newStatus });

            Animated.timing(fadeAnims.current[requestId], {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setRequests((prev) => prev.filter((item) => item.id !== requestId));
            });

            Alert.alert(newStatus === 'approved' ? 'Approved' : 'Rejected', `Request ${newStatus}`);
        } catch (error: any) {
            console.error(`Error handling ${newStatus}:`, error.message || error);
            Alert.alert('Error', `Failed to ${newStatus} request: ${error.message}`);
        }
    };

    if (loading) {
        return (
            <View style={globalStyles.container}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    const renderItem = ({ item }: { item: Request }) => {
        const fadeAnim = fadeAnims.current[item.id] || new Animated.Value(1);

        const getStatusColor = (status: string) => {
            switch (status) {
                case 'pending':
                    return '#FFA000'; // Amber
                case 'approved':
                    return '#4CAF50'; // Green
                case 'rejected':
                    return '#FF3B30'; // Red
                default:
                    return '#555'; // Default detail text color
            }
        };

        return (
            <Animated.View style={[styles.cardContainer, { opacity: fadeAnim }]}>
                <Card style={styles.card}>
                    <Card.Content style={styles.cardContent}>
                        <View style={styles.requestInfo}>
                            <Text style={styles.supplyName}>{item.supplyName}</Text>
                            <Text style={styles.detailText}>Quantity: {item.quantity}</Text>
                            <Text style={styles.detailText}>By: {item.requesterFirstName} {item.requesterLastName} ({item.requester})</Text>
                            <Text style={styles.reasonText} numberOfLines={2} ellipsizeMode="tail">Reason: {item.reason}</Text>
                            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                Status: {item.status}
                            </Text>
                        </View>

                        {item.status === 'pending' && (
                            <View style={styles.actionsContainer}>
                                <Button
                                    mode="contained"
                                    style={styles.approveButton}
                                    labelStyle={styles.buttonText}
                                    onPress={() => handleStatusChange({
                                        requestId: item.id,
                                        supplyId: item.supplyId,
                                        quantity: item.quantity,
                                        newStatus: 'approved',
                                        requestData: item,
                                    })}
                                >
                                    Approve
                                </Button>
                                <Button
                                    mode="contained"
                                    style={styles.rejectButton}
                                    labelStyle={styles.buttonText}
                                    onPress={() => handleStatusChange({
                                        requestId: item.id,
                                        supplyId: item.supplyId,
                                        quantity: item.quantity,
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
        <View style={globalStyles.container}>
            {requests.length === 0 && !loading ? (
                <Text style={styles.noRequestsText}>No Requests Found</Text>
            ) : (
                <FlatList
                    data={requests}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    card: {
        backgroundColor: '#f9f9f9', // Light background like ViewSupplyScreen
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
});

function serverTimestamp(): any {
    return firebaseServerTimestamp();
}

export default ManageRequestsScreen;