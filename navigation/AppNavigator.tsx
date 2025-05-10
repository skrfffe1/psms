// navigation/AppNavigator.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import AdminScreen from '../screens/AdminScreen';
import HeadScreen from '../screens/HeadScreen';
import StaffScreen from '../screens/StaffScreen';
import UnauthorizedScreen from '../screens/UnauthorizedScreen';
import { useAuth } from '../context/AuthContext';
import { Button } from 'react-native';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
  </Stack.Navigator>
);

const AppDrawer = () => {
  const { role, logout } = useAuth();

  return (
    <Drawer.Navigator
      screenOptions={{ headerShown: true }}
      drawerContent={({ navigation }) => (
        <DrawerContent navigation={navigation} role={role} logout={logout} />
      )}
    >
      {role === 'admin' && <Drawer.Screen name="Admin" component={AdminScreen} />}
      {role === 'head' && <Drawer.Screen name="Head" component={HeadScreen} />}
      {role === 'staff' && <Drawer.Screen name="Staff" component={StaffScreen} />}
      {role && <Drawer.Screen name="Unauthorized" component={UnauthorizedScreen} />}
    </Drawer.Navigator>
  );
};

const DrawerContent = ({ navigation, role, logout }: any) => (
  <React.Fragment>
    {role === 'admin' && <Button title="Admin Area" onPress={() => navigation.navigate('Admin')} />}
    {role === 'head' && <Button title="Head Area" onPress={() => navigation.navigate('Head')} />}
    {role === 'staff' && <Button title="Staff Area" onPress={() => navigation.navigate('Staff')} />}
    <Button title="Logout" onPress={logout} />
  </React.Fragment>
);

const AppNavigator = () => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <NavigationContainer>
      {isAuthenticated && role ? (
        <AppDrawer />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;