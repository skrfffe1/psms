import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentComponentProps } from '@react-navigation/drawer';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import AdminScreen from '../screens/AdminScreen';
import HeadScreen from '../screens/HeadScreen';
import StaffScreen from '../screens/StaffScreen';
import UnauthorizedScreen from '../screens/UnauthorizedScreen';
import ViewSupplyScreen from '../screens/ViewSupplyScreen';
import RequestSupplyScreen from '../screens/RequestSupplyScreen';
import EditSupplyScreen from '../screens/EditSupplyScreen';
import MaintenanceRequestScreen from '../screens/MaintenanceRequestScreen';
import ManageRequestScreen from '../screens/ManageRequestScreen';
import { useAuth } from '../context/AuthContext';
import { View } from 'react-native';
import { RootStackParamList } from '@/types/navigation';
import AddSupplyScreen from '@/screens/AddSupplyScreen';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { Avatar, Drawer as PaperDrawer, Text, Title, useTheme, Caption } from 'react-native-paper'; // Import Paper components

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
  </Stack.Navigator>
);

const CustomDrawerContent = ({ role, logout, ...props }: DrawerContentComponentProps & { role: string | null; logout: () => void }) => {
  const { colors } = useTheme();

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ backgroundColor: colors.surface }}>
      <View style={{ backgroundColor: colors.primary, padding: 20, marginBottom: 10 }}>
        <Avatar.Icon size={50} icon="account-circle" color={colors.onPrimary} style={{ backgroundColor: colors.primaryContainer }} />
        <Title style={{ color: colors.onPrimary, marginTop: 10 }}>
          {role ? role.charAt(0).toUpperCase() + role.slice(1) + ' User' : 'Guest'}
        </Title>
        <Caption style={{ color: colors.onPrimary }}>{role ? 'Logged in as ' + role : 'Not logged in'}</Caption>
      </View>
      <PaperDrawer.Section>
        <DrawerItemList {...props} />
      </PaperDrawer.Section>
      <PaperDrawer.Section style={{ borderTopWidth: 1, borderTopColor: colors.outline }}>
        <DrawerItem
          label="Logout"
          onPress={logout}
          icon={() => <Ionicons name="exit-outline" size={22} color={colors.onSurface} />}
          labelStyle={{ color: colors.onSurface }}
        />
      </PaperDrawer.Section>
    </DrawerContentScrollView>
  );
};

const AppDrawer = () => {
  const { role, logout } = useAuth();
  const [refreshSupplyList, setRefreshSupplyList] = React.useState(false);
  const { colors } = useTheme();

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: true,
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.onSurfaceVariant,
        drawerLabelStyle: { marginLeft: -16, color: colors.onSurface },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.onSurface,
      }}
      drawerContent={(props) => (
        <CustomDrawerContent {...props} role={role} logout={logout} />
      )}
    >
      {role === 'admin' && (
        <Drawer.Screen
          name="Admin"
          component={AdminScreen}
          options={{
            drawerIcon: ({ color, size }) => <Ionicons name="shield-checkmark-outline" size={size} color={color} />,
            drawerLabel: 'Admin Area',
          }}
        />
      )}
      {role === 'head' && (
        <Drawer.Screen
          name="Head"
          component={HeadScreen}
          options={{
            drawerIcon: ({ color, size }) => <Ionicons name="ribbon-outline" size={size} color={color} />,
            drawerLabel: 'Head Area',
          }}
        />
      )}
      {role === 'staff' && (
        <Drawer.Screen
          name="Staff"
          component={StaffScreen}
          options={{
            drawerIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
            drawerLabel: 'Staff Area',
          }}
        />
      )}
      {(role === 'admin' || role === 'head' || role === 'staff') && (
        <Drawer.Screen
          name="ViewSupply"
          options={{
            drawerIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />,
            drawerLabel: 'View Supply',
          }}
        >
          {(props) => (
            <ViewSupplyScreen {...props} refreshSupplyList={refreshSupplyList} setRefreshSupplyList={setRefreshSupplyList} />
          )}
        </Drawer.Screen>
      )}
      {role === 'staff' && (
        <Drawer.Screen
          name="RequestSupply"
          component={RequestSupplyScreen}
          options={{
            drawerIcon: ({ color, size }) => <Ionicons name="download-outline" size={size} color={color} />,
            drawerLabel: 'Request Supply',
          }}
        />
      )}
      {(role === 'admin' || role === 'head') && (
        <Drawer.Screen
          name="EditSupply"
          options={{
            drawerItemStyle: { display: 'none' }, // Hide from drawer
            drawerLabel: 'Edit Supply',
          }}
        >
          {(props) => <EditSupplyScreen {...props} setRefreshSupplyList={setRefreshSupplyList} />}
        </Drawer.Screen>
      )}
      {(role === 'admin' || role === 'head' || role === 'staff') && (
        <Drawer.Screen
          name="MaintenanceRequest"
          component={MaintenanceRequestScreen}
          options={{
            drawerIcon: ({ color, size }) => <Ionicons name="construct-outline" size={size} color={color} />,
            drawerLabel: 'Maintenance Request',
          }}
        />
      )}
      {(role === 'admin' || role === 'head') && (
        <Drawer.Screen
          name="ManageRequest"
          component={ManageRequestScreen}
          options={{
            drawerIcon: ({ color, size }) => <Ionicons name="layers-outline" size={size} color={color} />,
            drawerLabel: 'Manage Requests',
          }}
        />
      )}
      {(role === 'admin' || role === 'head') && (
        <Drawer.Screen
          name="AddSupply"
          component={AddSupplyScreen}
          options={{
            drawerIcon: ({ color, size }) => <Ionicons name="add-outline" size={size} color={color} />,
            drawerLabel: 'Add Supply',
          }}
        />
      )}
      <Drawer.Screen
        name="Unauthorized"
        component={UnauthorizedScreen}
        options={{
          drawerItemStyle: { display: 'none' }, // Optionally hide from drawer
          drawerLabel: 'Unauthorized',
        }}
      />
    </Drawer.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated && role ? <AppDrawer /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;