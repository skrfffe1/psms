import React, { useEffect, useState } from 'react';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { View, StyleSheet, Alert } from 'react-native';
import { Avatar, Text, Button } from 'react-native-paper';
import { router } from 'expo-router';
import { auth } from '@/firebase/config'; // Adjust the import path
import { signOut, onAuthStateChanged } from 'firebase/auth';

export default function CustomDrawerContent(props) {
  const [user, setUser] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/'); // or your login screen route
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Logout Failed', error.message);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.map((p) => p[0]).join('').toUpperCase();
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <DrawerItemList {...props} />

      <View style={styles.bottomSection}>
        {user && (
          <View style={styles.profileContainer}>
            <Avatar.Text
              label={getInitials(user.displayName || user.email)}
              size={48}
            />
            <Text style={{ marginTop: 8, fontWeight: 'bold' }}>
              {user.displayName || 'No Name'}
            </Text>
            <Text style={{ fontSize: 12, color: 'gray' }}>{user.email}</Text>
          </View>
        )}

        <Button
          mode="contained-tonal"
          onPress={handleLogout}
          style={{ marginTop: 10 }}
        >
          Logout
        </Button>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  bottomSection: {
    marginTop: 'auto',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
});
