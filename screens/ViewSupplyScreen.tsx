import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, ActivityIndicator, TouchableOpacity,
    TextInput, Alert, RefreshControl, StyleSheet
} from 'react-native';
import { globalStyles } from '@/styles/global';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '@/types/navigation';
import { useAuth } from '@/context/AuthContext';
import { DrawerScreenProps, DrawerNavigationProp } from '@react-navigation/drawer';
import { Card, IconButton } from 'react-native-paper';

interface ViewSupplyScreenProps {
    navigation: DrawerNavigationProp<RootStackParamList, 'ViewSupply'>;
    refreshSupplyList: boolean;
    setRefreshSupplyList: React.Dispatch<React.SetStateAction<boolean>>;
    route: DrawerScreenProps<RootStackParamList, 'ViewSupply'>['route'];
}

interface Supply {
    id: string;
    supplyName: string;
    quantity: number;
    category: string;
}

const ViewSupplyScreen = ({ navigation, refreshSupplyList }: ViewSupplyScreenProps) => {
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredSupplies, setFilteredSupplies] = useState<Supply[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { role } = useAuth(); // Get the user's role

    const fetchSupplies = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'supplies'));
            const suppliesData = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    supplyName: data.supplyName || '',
                    quantity: data.quantity || 0,
                    category: data.category || '',
                };
            });
            setSupplies(suppliesData);
            setFilteredSupplies(suppliesData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching supplies:', error);
        }
    };

    useEffect(() => {
        fetchSupplies();
    }, [refreshSupplyList]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchSupplies();
        setRefreshing(false);
    };

    const handleDelete = async (id: string): Promise<void> => {
        if (role === 'admin' || role === 'head') { // Only allow admin and head to delete
            try {
                await deleteDoc(doc(db, 'supplies', id));
                Alert.alert('Deleted!', 'Supply successfully deleted.');
                fetchSupplies();
            } catch (error) {
                console.error('Error deleting supply:', error);
            }
        }
    };

    const handleEdit = (item: Supply): void => {
        if (role === 'admin' || role === 'head') { // Only allow admin and head to edit
            navigation.navigate('EditSupply', { id: item.id });
        } else {
            Alert.alert('Unauthorized', 'You do not have permission to edit supplies.', [{ text: 'OK' }]);
        }
    };

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        const normalizedQuery = query.toLowerCase().trim();
        const newFilteredSupplies = supplies.filter(supply =>
            supply.supplyName.toLowerCase().includes(normalizedQuery) ||
            supply.category.toLowerCase().includes(normalizedQuery)
        );
        setFilteredSupplies(newFilteredSupplies);
    }, [supplies]);

    const renderSupplyItem = ({ item }: { item: Supply }) => (
        <Card style={styles.supplyCard} onPress={() => {
            if (role === 'admin' || role === 'head') {
                Alert.alert(
                    'Delete Supply?',
                    `Are you sure you want to delete "${item.supplyName}"?`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => handleDelete(item.id) },
                    ]
                );
            } else {
                Alert.alert(
                    'Unauthorized',
                    'You do not have permission to delete supplies.',
                    [{ text: 'OK' }]
                );
            }
        }}>
            <Card.Content style={styles.cardContent}>
                <Ionicons name="cube-outline" size={32} color="#312c85" style={styles.icon} />
                <View style={styles.textContainer}>
                    <Text style={styles.supplyName}>{item.supplyName}</Text>
                    <Text style={styles.supplyDetails}>Quantity: {item.quantity}</Text>
                    <Text style={styles.supplyDetails}>Category: {item.category}</Text>
                </View>
                {(role === 'admin' || role === 'head') && (
                    <IconButton
                        icon="pencil"
                        size={24}
                        onPress={() => handleEdit(item)}
                        style={styles.editButton}
                        iconColor="#312c85"
                    />
                )}
            </Card.Content>
        </Card>
    );

    if (loading) {
        return (
            <View style={globalStyles.container}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={[globalStyles.container, { padding: 20 }]}>
            <TextInput
                style={styles.searchInput}
                placeholder="Search supplies..."
                value={searchQuery}
                onChangeText={handleSearch}
            />
            <FlatList
                data={filteredSupplies}
                keyExtractor={(item) => item.id}
                renderItem={renderSupplyItem}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    supplyCard: {
        marginBottom: 12,
        borderRadius: 8,
        elevation: 3,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    icon: {
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    supplyName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    supplyDetails: {
        fontSize: 14,
        color: '#555',
    },
    editButton: {
        marginLeft: 'auto',
    },
    searchInput: {
        backgroundColor: '#f1f1f1',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        fontSize: 16,
    },
});

export default ViewSupplyScreen;