import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentComponentProps, DrawerScreenProps } from '@react-navigation/drawer';
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
import ManageRequestScreen from '@/screens/ManageRequestScreen';
import ReturnSupplyScreen from '@/screens/ReturnSupplyScreen';
import { useAuth } from '@/context/AuthContext';
import { View, StyleSheet, TouchableOpacity } from 'react-native'; // Added TouchableOpacity
import AddSupplyScreen from '@/screens/AddSupplyScreen';
import UsersDetailsScreen from '@/screens/UsersDetailsScreen';
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
        <Stack.Screen name="UserDetails" component={UsersDetailsScreen} />
    </Stack.Navigator>
);

interface CustomDrawerContentProps extends DrawerContentComponentProps {
    role: string | null;
    logout: () => void;
    name: string | null;
    profilePictureUrl: string | null; 
}


const CustomDrawerContent = ({ role, logout, profilePictureUrl, name, ...props }: CustomDrawerContentProps) => {
    const { colors } = useTheme();
    const { user } = useAuth(); // Get the current user object (should contain uid)
    const [loadingName, setLoadingName] = useState<boolean>(true);
    const [userName, setUserName] = useState<string>(''); // Add this line

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
                    {profilePictureUrl ? (
                        <Avatar.Image
                            size={50}
                            source={{ uri: profilePictureUrl }}
                            style={{ backgroundColor: colors.primaryContainer }}
                        />
                    ) : (
                        <Avatar.Icon
                            size={50}
                            icon="account-circle"
                            color={colors.onSurface}
                            style={{ backgroundColor: colors.primaryContainer }}
                        />
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '80%' }}>
                        <View>
                            <Text variant='titleMedium' style={{ color: colors.onPrimary, marginTop: 10 }}>
                                {loadingName ? 'Loading...' : userName}
                            </Text>
                            <Text variant='labelSmall' style={{ color: colors.onPrimary }}>{role ? 'Logged in as ' + role : 'Not logged in'}</Text>
                        </View>
                    </View>
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
    uid?: string | null;
    [key: string]: any;
    profilePictureUrl?: string | null;
}

const AppDrawer = () => {
    const { role, logout, user } = useAuth() as { role: string | null; logout: () => void; user: User | null };
    const [userName, setUserName] = useState<string | null>(null);
    const { colors } = useTheme();
    const [refreshSupplyList, setRefreshSupplyList] = useState<boolean>(false);
    const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

    const firstName = user?.firstName || '';
    const lastName = user?.lastName || '';

    useEffect(() => {
        if (user) {
            const fullName = `${firstName} ${lastName}`.trim();
            setUserName(fullName || 'User');
            setProfilePictureUrl(user.profilePictureUrl || null); // Get the URL from the user object
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
                <>
                    <CustomDrawerContent
                        {...props}
                        role={role === 'admin' || role === 'head' || role === 'staff' ? role : null}
                        logout={logout}
                        name={userName}
                        profilePictureUrl={profilePictureUrl} // Pass the URL
                        
                    />
                </>
            )}
        >
            {role === 'admin' && (
                <>
                    <Drawer.Screen
                        name="Admin"
                        component={AdminScreen}
                        options={{
                            drawerIcon: ({ color, size }) => <Ionicons name="shield-checkmark-outline" size={size} color={color} />,
                            drawerLabel: 'Admin Area',
                            drawerLabelStyle: { marginLeft: 10 },
                        }}
                    />
                    <Drawer.Screen // Add AdminSignupScreen here

                        name="Signup"
                        component={SignupScreen}
                        options={{
                            drawerIcon: ({ color, size }) => <Ionicons name="person-add-outline" size={size} color={color} />,
                            drawerLabel: 'Add User',
                            drawerLabelStyle: { marginLeft: 10 },
                            headerTitle: 'Sign Up',
                        }}
                    />
                    {/* ... other admin screens ... */}
                </>
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
                        headerTitle: 'View Supply',
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
                            headerTitle: 'Maintenance Request',
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
                            headerTitle: 'Edit Supply',
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
                            headerTitle: 'Manage Requests',
                        }}
                    />
                    <Drawer.Screen
                        name="AddSupply"
                        component={AddSupplyScreen}
                        options={{
                            drawerIcon: ({ color, size }) => <Ionicons name="add-outline" size={size} color={color} />,
                            drawerLabel: 'Add Supply',
                            drawerLabelStyle: { marginLeft: 10 },
                            headerTitle: 'Add Supply',
                        }}
                    />
                    <Drawer.Screen
                        name="ReturnSupply"
                        component={ReturnSupplyScreen}
                        options={{
                            drawerIcon: ({ color, size }) => <Ionicons name="arrow-undo-outline" size={size} color={color} />,
                            drawerLabel: 'Return Supply',
                            drawerLabelStyle: { marginLeft: 10 },
                            headerTitle: 'Return Supply',
                        }}
                    />
                </>
            )}

            {(role === 'admin' || role === 'head' || role === 'staff') && (
               // put here about user details
                <Drawer.Screen
                    name="UserDetails"
                    component={UsersDetailsScreen}
                    options={{
                        drawerIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} />,
                        drawerLabel: 'User Details',
                        drawerLabelStyle: { marginLeft: 10 },
                        headerTitle: 'User Details',
                    }}
                />
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
        backgroundColor: '#193cb8',
    },
    bottomDrawerSection: {
        marginBottom: 15,
        borderTopColor: '#f4f4f4',
        borderTopWidth: 1,
    },
});

export default AppNavigator;
