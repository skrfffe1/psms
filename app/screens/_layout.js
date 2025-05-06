import * as React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import BackButton from '@/components/BackButton';
import LogoutAndProfileContent from '@/components/CustomDrawerContent';

export default function Layout() {

  return (
    <PaperProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Drawer drawerContent={(props) => <LogoutAndProfileContent {...props} />} screenOptions={{ headerShown: true }}>
          <Drawer.Screen
            name="dashboard"
            options={{
              title: 'Dashboard',
              drawerIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
            }}
          />
          <Drawer.Screen
            name="viewSupply"
            options={{
              title: 'View Supply',
              drawerIcon: ({ color }) => <Ionicons name="search-outline" size={24} color={color} />,
            }}
          />
          <Drawer.Screen
            name="addSupply"
            options={{
              title: 'Add Supply',
              drawerIcon: ({ color }) => <Ionicons name="add-outline" size={24} color={color} />,
            }}
          />

          <Drawer.Screen
            name="requestSupply"
            options={{
              title: 'Request Supply',
              drawerIcon: ({ color }) => <Ionicons name="download-outline" size={24} color={color} />,
            }}
          />

          <Drawer.Screen
            name="maintenanceRequest"
            options={{
              title: 'Maintenance Request',
              drawerIcon: ({ color }) => <Ionicons name="construct-outline" size={24} color={color} />,
            }}
          />
          <Drawer.Screen
            name="manageRequest"
            options={{
              title: 'Manage Requests',
              drawerIcon: ({ color }) => <Ionicons name="layers-outline" size={24} color={color} />,
            }}
          />
          <Drawer.Screen
            name="issuanceLog"
            options={{
              title: 'Issuance Log',
              drawerIcon: ({ color }) => <Ionicons name="people-outline" size={24} color={color} />,
            }}
          />
          <Drawer.Screen
            name="history"
            options={{
              title: 'History',
              drawerIcon: ({ color }) => <Ionicons name="newspaper-outline" size={24} color={color} />,
            }}
          />
        </Drawer>
        <BackButton />
      </GestureHandlerRootView>
    </PaperProvider>
  );
}
