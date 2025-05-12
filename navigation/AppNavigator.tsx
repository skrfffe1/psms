import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentComponentProps, DrawerScreenProps, DrawerNavigationProp } from '@react-navigation/drawer';
import LoginScreen from '@/screens/LoginScreen';
import SignupScreen from '@/screens/SignupScreen';
import AdminScreen from '@/screens/AdminScreen';
import HeadScreen from '@/screens/HeadScreen';
import StaffScreen from '@/screens/StaffScreen';
import UnauthorizedScreen from '@/screens/UnauthorizedScreen';
import ViewSupplyScreen from '@/screens/ViewSupplyScreen';
import RequestSupplyScreen from '@/screens/RequestSupplyScreen';
import EditSupplyScreen from '@/screens/EditSupplyScreen';
import MaintenanceRequestScreen from '@/screens/MaintenanceRequestScreen';
import ManageRequestScreen from '../screens/ManageRequestScreen';
import { useAuth } from '@/context/AuthContext';
import { View, StyleSheet } from 'react-native';
import AddSupplyScreen from '@/screens/AddSupplyScreen';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { Avatar, Drawer as PaperDrawer, useTheme } from 'react-native-paper';
import { Text } from 'react-native-paper';
import {
    RootStackParamList,
} from '@/types/navigation'; // Adjust the import path as needed

import { db } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<RootStackParamList>();

const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
);

interface CustomDrawerContentProps extends DrawerContentComponentProps {
    role: string | null;
    logout: () => void;
    name: string | null;
}

const CustomDrawerContent = ({ role, logout, name, ...props }: CustomDrawerContentProps) => {
    const { colors } = useTheme();
    const { user } = useAuth(); // Get the current user object (should contain uid)
    const [userName, setUserName] = useState<string | null>('User'); // Initial value
    const [loadingName, setLoadingName] = useState<boolean>(true);

     useEffect(() => {
        const fetchUserName = async () => {
            if (user?.uid) {
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const docSnap = await getDoc(userDocRef);
                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        const firstName = userData?.firstName || '';
                        const lastName = userData?.lastName || '';
                        setUserName(`${firstName} ${lastName}`.trim() || 'User');
                    } else {
                        console.log('User document not found.');
                        setUserName('User'); // Fallback
                    }
                } catch (error) {
                    console.error('Error fetching user name:', error);
                    setUserName('User'); // Fallback on error
                } finally {
                    setLoadingName(false);
                }
            } else {
                setUserName('Guest'); // No logged-in user
                setLoadingName(false);
            }
        };

        fetchUserName();
    }, [user]);

    return (
        <View style={styles.container}>
            <DrawerContentScrollView {...props} contentContainerStyle={{ backgroundColor: colors.surface, flex: 1 }}>
                <View style={styles.userInfoSection}>
                    <Avatar.Icon size={50} icon="account-circle" color={colors.onPrimary} style={{ backgroundColor: colors.primaryContainer }} />
                    <Text variant='titleMedium' style={{ color: colors.onPrimary, marginTop: 10 }}>
                        {loadingName ? 'Loading...' : userName} {/* Display fetched name or loading */}
                    </Text>
                    <Text variant='labelSmall' style={{ color: colors.onPrimary }}>{role ? 'Logged in as ' + role : 'Not logged in'}</Text>
                </View>
                <PaperDrawer.Section>
                    <DrawerItemList {...props} />
                </PaperDrawer.Section>
                <View style={{ flex: 1 }} />
            </DrawerContentScrollView>
            <PaperDrawer.Section style={styles.bottomDrawerSection}>
                <DrawerItem
                    label="Logout"
                    onPress={logout}
                    icon={() => <Ionicons name="exit-outline" size={22} color={colors.onSurface} />}
                    labelStyle={{ color: colors.onSurface }}
                />
            </PaperDrawer.Section>
        </View>
    );
};

interface User {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    [key: string]: any;
}

const AppDrawer = () => {
    const { role, logout, user } = useAuth() as { role: string | null; logout: () => void; user: User | null };
    const [userName, setUserName] = useState<string | null>(null);
    const { colors } = useTheme();
    const [refreshSupplyList, setRefreshSupplyList] = useState<boolean>(false);

    const firstName = user?.firstName || '';
    const lastName = user?.lastName || '';

    useEffect(() => {
        if (user) {
            const fullName = `${firstName} ${lastName}`.trim();
            setUserName(fullName || 'User');
        } else {
            setUserName(null);
        }
    }, [user, firstName, lastName]);

    return (
        <Drawer.Navigator
            screenOptions={{
                headerShown: true,
                drawerActiveTintColor: colors.primary,
                drawerInactiveTintColor: colors.onSurface,
                drawerLabelStyle: { marginLeft: -16, color: colors.onSurface },
                headerTitleStyle: { color: '#dbeafe' },
                headerStyle: { backgroundColor: '#1c398e' },
                headerTintColor: '#dbeafe',
                drawerStyle: {
                    width: '70%',
                },
            }}
            drawerContent={(props) => (
                <CustomDrawerContent
                    {...props}
                    role={role === 'admin' || role === 'head' || role === 'staff' ? role : null}
                    logout={logout}
                    name={userName}
                />
            )}
        >
            {role === 'admin' && (
                <Drawer.Screen
                    name="Admin"
                    component={AdminScreen}
                    options={{
                        drawerIcon: ({ color, size }) => <Ionicons name="shield-checkmark-outline" size={size} color={color} />,
                        drawerLabel: 'Admin Area',
                        drawerLabelStyle: { marginLeft: 10 },
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
                        drawerLabelStyle: { marginLeft: 10 },
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
                        drawerLabelStyle: { marginLeft: 10 },
                    }}
                />
            )}
            {(role === 'admin' || role === 'head' || role === 'staff') && (
                <Drawer.Screen
                    name="ViewSupply"
                    options={{
                        drawerIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />,
                        drawerLabel: 'View Supply',
                        drawerLabelStyle: { marginLeft: 10 },
                    }}
                >
                    {(props) => (
                        <ViewSupplyScreen
                            {...props}
                            route={props.route as DrawerScreenProps<RootStackParamList, 'ViewSupply'>['route']}
                            refreshSupplyList={refreshSupplyList}
                            setRefreshSupplyList={setRefreshSupplyList}
                        />
                    )}
                </Drawer.Screen>
            )}
            {role !== 'staff' && (
                <>
                    <Drawer.Screen
                        name="RequestSupply"
                        component={RequestSupplyScreen}
                        options={{
                            drawerIcon: ({ color, size }) => <Ionicons name="download-outline" size={size} color={color} />,
                            drawerLabel: 'Request Supply',
                            drawerLabelStyle: { marginLeft: 10 },
                        }}
                    />
                    <Drawer.Screen
                        name="MaintenanceRequest"
                        component={MaintenanceRequestScreen}
                        options={{
                            drawerIcon: ({ color, size }) => <Ionicons name="construct-outline" size={size} color={color} />,
                            drawerLabel: 'Maintenance Request',
                            drawerLabelStyle: { marginLeft: 10 },
                        }}
                    />
                </>
            )}
            {(role === 'admin' || role === 'head') && (
                <>
                    <Drawer.Screen
                        name="EditSupply"
                        options={{
                            drawerItemStyle: { display: 'none' },
                            drawerLabel: 'Edit Supply',
                            drawerLabelStyle: { marginLeft: 10 },
                        }}
                    >
                        {(props) => (
                            <EditSupplyScreen
                                {...props}
                                route={props.route as DrawerScreenProps<RootStackParamList, 'EditSupply'>['route']}
                                setRefreshSupplyList={setRefreshSupplyList}
                            />
                        )}
                    </Drawer.Screen>
                    <Drawer.Screen
                        name="ManageRequest"
                        component={ManageRequestScreen}
                        options={{
                            drawerIcon: ({ color, size }) => <Ionicons name="layers-outline" size={size} color={color} />,
                            drawerLabel: 'Manage Requests',
                            drawerLabelStyle: { marginLeft: 10 },
                        }}
                    />
                    <Drawer.Screen
                        name="AddSupply"
                        component={AddSupplyScreen}
                        options={{
                            drawerIcon: ({ color, size }) => <Ionicons name="add-outline" size={size} color={color} />,
                            drawerLabel: 'Add Supply',
                            drawerLabelStyle: { marginLeft: 10 },
                        }}
                    />
                </>
            )}
            <Drawer.Screen
                name="Unauthorized"
                component={UnauthorizedScreen}
                options={{
                    drawerItemStyle: { display: 'none' },
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

    if (isAuthenticated === undefined || role === undefined) {
        return (
            <View>
                <Text>Authentication error: Please log in again.</Text>
            </View>
        );
    }

    return (
        <NavigationContainer>
            {isAuthenticated && role ? <AppDrawer /> : <AuthStack />}
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    userInfoSection: {
        padding: 20,
        marginBottom: 10,
        alignItems: 'flex-start',
        backgroundColor: '#193cb8'
    },
    bottomDrawerSection: {
        marginBottom: 15,
        borderTopColor: '#f4f4f4',
        borderTopWidth: 1,
    },
});

export default AppNavigator;


