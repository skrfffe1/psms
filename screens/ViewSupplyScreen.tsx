import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, ActivityIndicator, TouchableOpacity,
  TextInput, Alert, RefreshControl
} from 'react-native';
import { globalStyles } from '@/styles/global';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function SuppliesList() {
  const [supplies, setSupplies] = useState<{ id: string; supplyName: string; quantity: number; category: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSupplies, setFilteredSupplies] = useState<{ id: string; supplyName: string; quantity: number; category: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSupplies();
    setRefreshing(false);
  };

  interface Supply {
    id: string;
    supplyName: string;
    quantity: number;
    category: string;
  }

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'supplies', id));
      Alert.alert('Deleted!', 'Supply successfully deleted.');
      fetchSupplies();
    } catch (error) {
      console.error('Error deleting supply:', error);
    }
  };

  const handleLongPress = (item: { id: string; supplyName: string; quantity: number; category: string }): void => {
    router.push({ pathname: '/supplies/editSupplyScreen', params: { id: item.id } });
  };

  interface SearchQuery {
    query: string;
  }

  const handleSearch = (query: SearchQuery['query']): void => {
    setSearchQuery(query);
    if (query === '') {
      setFilteredSupplies(supplies);
    } else {
      const filtered = supplies.filter((item) =>
        item.supplyName.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredSupplies(filtered);
    }
  };

  const renderSupplyItem = ({ item }: { item: Supply }) => (
    <TouchableOpacity
      style={{
        backgroundColor: '#f9f9f9',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      }}
      activeOpacity={0.8}
      onLongPress={() => handleLongPress(item)}
      onPress={() =>
        Alert.alert(
          'Delete Supply?',
          `Are you sure you want to delete "${item.supplyName}"?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => handleDelete(item.id) },
          ]
        )
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="cube-outline" size={32} color="#007AFF" style={{ marginRight: 16 }} />
        <View style={{ flex: 1 }}>
        <Text style={[globalStyles.header, { fontSize: 18, marginBottom: 4 }]}>{item.supplyName}</Text>
          <Text style={{ color: '#555', fontSize: 14, lineHeight: 20 }}>Quantity: {item.quantity}</Text>
          <Text style={{ color: '#555', fontSize: 14, lineHeight: 20 }}>Category: {item.category}</Text>
        </View>
      </View>
    </TouchableOpacity>
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
        style={{
          backgroundColor: '#f1f1f1',
          padding: 12,
          borderRadius: 12,
          marginBottom: 16,
          fontSize: 16,
        }}
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
}
