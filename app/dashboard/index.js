import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { auth, db } from '@/firebase/config';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated, ScrollView, ActivityIndicator } from 'react-native';
import { globalStyles } from '@/styles/global';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const router = useRouter();
  const [lowStockItems, setLowStockItems] = useState([]);
  const [totalSupplies, setTotalSupplies] = useState(0);
  const bellAnimation = useState(new Animated.Value(0))[0]; // Animation for bell

  const [approvedCount, setApprovedCount] = useState(null);
  const [rejectedCount, setRejectedCount] = useState(null);


  useEffect(() => {
    const suppliesCollection = collection(db, 'supplies');
    // Realtime listener for supplies collection
    // This will fetch the supplies in real-time and update the state accordingly 
    const unsubscribe = onSnapshot(suppliesCollection, (snapshot) => {
      const supplies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Filter supplies with quantity less than or equal to 5
      // This will be used to show low stock items
      const lowStock = supplies.filter(supply => supply.quantity <= 5);

      setLowStockItems(lowStock);
      setTotalSupplies(supplies.length);

      if (lowStock.length > 0) {
        triggerBellAnimation();
      }
    }, (error) => {
      console.error('Realtime fetch error:', error.message);
    });

    return () => unsubscribe(); // Cleanup when unmount
  }, []);

  useEffect(() => {
    // Fetching the counts of approved and rejected requests
    // This will be called once when the component mounts
    const fetchRequestCounts = async () => {
      try {
        const approvedSnapshot = await getDocs(collection(db, 'approvedRequests'));
        const rejectedSnapshot = await getDocs(collection(db, 'rejectedRequests'));
        // Assuming you have separate collections for approved and rejected requests
        setApprovedCount(approvedSnapshot.size);
        setRejectedCount(rejectedSnapshot.size);
      } catch (error) {
        console.error('Error fetching request counts:', error);
        setApprovedCount(0); // fallback
        setRejectedCount(0); // fallback
      }
    };

    fetchRequestCounts();
  }, []);

  const triggerBellAnimation = () => {
    Animated.sequence([
      Animated.timing(bellAnimation, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(bellAnimation, { toValue: -1, duration: 100, useNativeDriver: true }),
      Animated.timing(bellAnimation, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(bellAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const renderBadge = (count) => {
    if (count === null) {
      return <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 8 }} />;
    }
    return (
      <View style={globalStyles.badge}>
        <Text style={globalStyles.badgeText}>{count}</Text>
      </View>
    );
  };

  const renderBadgeRejected = (count) => {
    if (count === null) {
      return <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 8 }} />;
    }
    return (
      <View style={[globalStyles.badge, { backgroundColor: '#ff6b6b' }]}>
        <Text style={globalStyles.badgeText}>{count}</Text>
      </View>
    );
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error.message);
    }
  };

  const handleNotifications = () => {
    if (lowStockItems.length > 0) {
      const names = lowStockItems.map(item => `• ${item.supplyName} (${item.quantity})`).join('\n');
      Alert.alert(
        'Low Stock Alert 🚨',
        `Items:\n${names}`
      );
    } else {
      Alert.alert('All good!', '✅ No low-stock supplies.');
    }
  };

  const bellShake = bellAnimation.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-10deg', '10deg'],
  });

  return (

    <ScrollView style={globalStyles.scrollContainer}>
      <View style={globalStyles.container}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={globalStyles.header}>Dashboard</Text>

          <View style={styles.iconContainer}>
            {/* Notification Bell */}
            <TouchableOpacity style={styles.iconButton} onPress={handleNotifications}>
              <Animated.View style={{ transform: [{ rotate: bellShake }] }}>
                <Ionicons name="notifications-outline" size={24} color="#333" />
              </Animated.View>
              {lowStockItems.length > 0 && (
                <View style={styles.notificationBadge} />
              )}
            </TouchableOpacity>

            {/* Logout Icon */}
            <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Supplies Overview */}
        <View style={globalStyles.card}>
          <Text style={globalStyles.sectionTitle}>Supplies Overview</Text>
          <View style={styles.statsContainer}>
            <Text style={globalStyles.statsText}>Total Supplies: {totalSupplies}</Text>
            <Text style={globalStyles.statsText}>Low Stock Items: {lowStockItems.length}</Text>
          </View>
        </View>

        {/* Manage Supplies */}
        <View style={globalStyles.card}>
          <Text style={globalStyles.sectionTitle}>Manage Supplies</Text>
          <TouchableOpacity style={globalStyles.button} onPress={() => router.push('/supplies/viewSupplyScreen')}>
            <Text style={globalStyles.buttonText}>View Supplies</Text>
          </TouchableOpacity>
          <TouchableOpacity style={globalStyles.button} onPress={() => router.push('/supplies/addSupplyScreen')}>
            <Text style={globalStyles.buttonText}>Add New Supply</Text>
          </TouchableOpacity>
        </View>


        {/* Request Supplies Section */}
        <View style={globalStyles.card}>
          <Text style={globalStyles.sectionTitle}>Need Something?</Text>
          <TouchableOpacity style={globalStyles.button} onPress={() => router.push('/supplies/requestSupplyScreen')}>
            <Text style={globalStyles.buttonText}>Request Supplies</Text>
          </TouchableOpacity>
        </View>

        {/* Manage Requests Section */}
        <View style={globalStyles.card}>
          <Text style={globalStyles.sectionTitle}>Manage Requests</Text>
          <TouchableOpacity style={globalStyles.button} onPress={() => router.push('/requests/manageRequestsScreen')}>
            <Text style={globalStyles.buttonText}>View Requests</Text>
          </TouchableOpacity>
        </View>

        <View style={globalStyles.card}>
          <Text style={globalStyles.sectionTitle}>Request Histories</Text>

          {/* Approved Button */}
          <TouchableOpacity style={globalStyles.button} onPress={() => router.push('/requests/approvedHistoryScreen')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={globalStyles.buttonText}>View Approved History</Text>
              {renderBadge(approvedCount)}
            </View>
          </TouchableOpacity>

          {/* Rejected Button */}
          <TouchableOpacity style={[globalStyles.button, { backgroundColor: '#FF3B30' }]} onPress={() => router.push('/requests/rejectedHistoryScreen')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={globalStyles.buttonText}>View Rejected History</Text>
              {renderBadgeRejected(rejectedCount)}
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={globalStyles.card}>
          <Text style={globalStyles.sectionTitle}>Recent Activity</Text>
          <Text style={globalStyles.smallText}>Your data updates in real-time!</Text>
        </View>
      </View>


    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    marginBottom: 30,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 15,
    backgroundColor: '#E0E0E0',
    padding: 8,
    borderRadius: 50,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
  },
  statsContainer: {
    marginTop: 15,
  },
});
