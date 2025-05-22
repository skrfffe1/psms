// src/components/TransactionLogComponent.tsx
import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config'; // Adjust this import path if needed
import { format } from 'date-fns';

// Centralized text content for this component
const componentText = {
  transactionLogTitle: 'Recent Transactions',
  noTransactions: 'No recent transactions found.',
  loadingTransactions: 'Loading transactions',
  errorTransactions: 'Failed to load transactions:',
};

interface TransactionLogItem {
  id: string;
  type: string; // e.g., 'Issuance', 'Request', 'Maintenance'
  timestamp: Timestamp; // Common field for sorting
  description: string; // A concise summary of the transaction
  details: string; // More detailed info
  // Add other relevant fields if needed, e.g., userId, supplyName, quantity etc.
}

// Memoized individual log item component for FlatList performance
interface LogItemProps {
  item: TransactionLogItem;
}

const LogItemComponent: React.FC<LogItemProps> = memo(({ item }) => {
  return (
    <View style={logStyles.logItem}>
      <Text style={logStyles.logItemType}>{item.type}</Text>
      <Text style={logStyles.logItemDescription}>{item.description}</Text>
      <Text style={logStyles.logItemDetails}>{item.details}</Text>
      <Text style={logStyles.logItemTimestamp}>
        {item.timestamp ? format(item.timestamp.toDate(), 'MMM dd,yyyy hh:mm a') : 'N/A'}
      </Text>
    </View>
  );
});

const TransactionLogComponent: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Array to hold unsubscribe functions
    const unsubscribes: (() => void)[] = [];

    // Listener for Issuance Logs
    unsubscribes.push(onSnapshot(
      query(collection(db, 'issuanceLogs'), orderBy('issuedAt', 'desc'), limit(20)),
      (snapshot) => {
        const issuanceLogs: TransactionLogItem[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'Issuance',
            timestamp: data.issuedAt,
            description: `Issued ${data.supplyName || 'N/A'} (Qty: ${data.quantity || 0})`,
            details: `To: ${data.requesterFirstName || 'N/A'} ${data.requesterLastName || 'N/A'}`,
          };
        });
        setTransactions((prev) => mergeAndSortTransactions(prev, issuanceLogs));
      },
      (err) => {
        console.error('Error fetching issuance logs:', err);
        setError(`${componentText.errorTransactions} issuance logs`);
      }
    ));

    // Listener for Supply Requests
    unsubscribes.push(onSnapshot(
      query(collection(db, 'requests'), orderBy('createdAt', 'desc'), limit(20)),
      (snapshot) => {
        const requests: TransactionLogItem[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'Supply Request',
            timestamp: data.createdAt,
            description: `Requested ${data.supplyName || 'N/A'} (Qty: ${data.quantity || 0})`,
            details: `Status: ${data.status || 'Pending'} by ${data.requesterFirstName || 'N/A'}`,
          };
        });
        setTransactions((prev) => mergeAndSortTransactions(prev, requests));
      },
      (err) => {
        console.error('Error fetching supply requests:', err);
        setError(`${componentText.errorTransactions} supply requests`);
      }
    ));

    // Listener for Maintenance Requests
    unsubscribes.push(onSnapshot(
      query(collection(db, 'maintenanceRequests'), orderBy('requestDate', 'desc'), limit(20)),
      (snapshot) => {
        const maintenanceRequests: TransactionLogItem[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'Maintenance Request',
            timestamp: data.requestDate,
            description: `Maintenance for ${data.supplyName || 'N/A'}`,
            details: `Status: ${data.status || 'Pending'} by ${data.requesterFirstName || 'N/A'}`,
          };
        });
        setTransactions((prev) => mergeAndSortTransactions(prev, maintenanceRequests));
      },
      (err) => {
        console.error('Error fetching maintenance requests:', err);
        setError(`${componentText.errorTransactions} maintenance requests`);
      }
    ));

    // Helper to merge and sort transactions from different sources
    const mergeAndSortTransactions = (
      currentTransactions: TransactionLogItem[],
      newTransactionsBatch: TransactionLogItem[]
    ): TransactionLogItem[] => {
      // Create a map to efficiently check for existing items and update them
      const tempMap = new Map<string, TransactionLogItem>();

      // Add existing transactions to map
      currentTransactions.forEach(item => tempMap.set(item.id, item));
      // Add or update with new batch
      newTransactionsBatch.forEach(item => tempMap.set(item.id, item));

      const merged = Array.from(tempMap.values());

      // Sort by timestamp in descending order (newest first)
      merged.sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime());
      return merged.slice(0, 50); // Keep only the latest 50 transactions
    };

    // Set loading to false after a short delay to allow initial fetches to process
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500); // Give a bit of time for initial data to come in

    // Cleanup: Unsubscribe from all listeners and clear the timer on component unmount
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
      clearTimeout(timer);
    };
  }, []); // Empty dependency array means this runs once on mount

  // Memoize the render function for FlatList performance
  const renderLogItem = useCallback(({ item }: { item: TransactionLogItem }) => (
    <LogItemComponent item={item} />
  ), []);

  return (
    <View style={logStyles.container}>
      <Text style={logStyles.title}>{componentText.transactionLogTitle}</Text>
      {loading ? (
        <View style={logStyles.messageContainer}>
          <ActivityIndicator size="small" color="#1c398e" />
          <Text style={logStyles.messageText}>{componentText.loadingTransactions}</Text>
        </View>
      ) : error ? (
        <View style={logStyles.messageContainer}>
          <Text style={logStyles.errorText}>{error}</Text>
        </View>
      ) : transactions.length === 0 ? (
        <View style={logStyles.messageContainer}>
          <Text style={logStyles.messageText}>{componentText.noTransactions}</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderLogItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={logStyles.listContent}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={21}
        />
      )}
    </View>
  );
};

// --- Styles for Transaction Log Component ---
const logStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 10,
    borderRadius: 10,
    padding: 15,
    marginTop: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 30,
  },
  messageText: {
    fontSize: 16,
    color: '#888',
    marginTop: 10,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginTop: 10,
  },
  listContent: {
    paddingBottom: 10,
  },
  logItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  logItemType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1c398e',
    marginBottom: 4,
  },
  logItemDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  logItemDetails: {
    fontSize: 12,
    color: '#777',
  },
  logItemTimestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 5,
    textAlign: 'right',
  },
});

export default TransactionLogComponent;