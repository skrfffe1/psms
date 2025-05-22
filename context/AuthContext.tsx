import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebase/config';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User as FirebaseAuthUser, // Alias Firebase's User type
    updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Alert } from 'react-native';

// Define a custom User type that extends Firebase's User and includes your custom fields
interface CustomUser extends FirebaseAuthUser {
    firstName?: string | null;
    lastName?: string | null;
    profilePictureUrl?: string | null; // Add this property
    // Add any other custom fields you store in Firestore
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: CustomUser | null; // Use CustomUser here
    role: 'admin' | 'head' | 'staff' | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (
        firstName: string,
        lastName: string,
        email: string,
        password: string,
        role: 'admin' | 'head' | 'staff',
        address: string,
        birthdate: Date | null,
        gender: string,
        civilStatus: string,
        phoneNumber: string,
        profilePicture?: string
    ) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<CustomUser | null>(null); // Use CustomUser
    const [role, setRole] = useState<'admin' | 'head' | 'staff' | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            if (authUser) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', authUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();

                        // Create the custom user object by spreading authUser and adding custom data
                        const customUserData: CustomUser = {
                            ...authUser,
                            firstName: userData.firstName || null,
                            lastName: userData.lastName || null,
                            profilePictureUrl: userData.profilePictureUrl || null,
                            // Add other custom fields here
                        };

                        setUser(customUserData); // Set the custom user object
                        setRole(userData.role as 'admin' | 'head' | 'staff');
                        setIsAuthenticated(true);
                    } else {
                        // If user document doesn't exist, it means user signed up but data isn't in Firestore yet
                        // Or a partial state. For safety, we can set minimal user info
                        setUser(authUser as CustomUser); // Cast to CustomUser for basic user data
                        setRole(null); // No role yet if Firestore data is missing
                        setIsAuthenticated(true);
                        console.warn("Firestore user document not found for:", authUser.uid);
                    }
                } catch (error) {
                    console.error("Error fetching user data from Firestore:", error);
                    // It's safer to log out if user data cannot be fetched
                    await signOut(auth);
                    setUser(null);
                    setRole(null);
                    setIsAuthenticated(false);
                }
            } else {
                setUser(null);
                setRole(null);
                setIsAuthenticated(false);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged will handle state updates, including fetching Firestore data
        } catch (error: any) {
            // console.error('Login Error:', error.message);
            // Handle specific error messages if needed
            // For example, you can check for error codes and set custom messages
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signup = async (
        firstName: string,
        lastName: string,
        email: string,
        password: string,
        role: 'admin' | 'head' | 'staff',
        address: string,
        birthdate: Date | null,
        gender: string,
        civilStatus: string,
        phoneNumber: string,
        profilePicture: string = '' // Make it a required string with a default empty value
    ) => {
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newUser = userCredential.user;

            // Update Firebase Auth profile (photoURL can be useful here too)
            await updateProfile(newUser, {
                photoURL: profilePicture,
            });

            // Store custom user data in Firestore
            await setDoc(doc(db, 'users', newUser.uid), {
                uid: newUser.uid,
                firstName: firstName,
                lastName: lastName,
                email: email,
                role: role,
                address: address,
                birthdate: birthdate,
                gender: gender,
                civilStatus: civilStatus,
                phoneNumber: phoneNumber,
                profilePictureUrl: profilePicture, // Store the URL in Firestore
            });

            // The onAuthStateChanged listener will automatically pick up the new user and
            // fetch their Firestore data, updating the context.
        } catch (error: any) {
            // console.error('Signup Error:', error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await signOut(auth);
            // onAuthStateChanged will handle state updates
        } catch (error: any) {
            console.error('Logout Error:', error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const value: AuthContextType = {
        isAuthenticated,
        user,
        role,
        loading,
        login,
        signup,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
