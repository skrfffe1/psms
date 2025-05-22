import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { useAuth } from '@/context/AuthContext'; // Adjust path if needed
import { db } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { ActivityIndicator } from 'react-native-paper'; // Import ActivityIndicator

interface UserDetails {
    firstName: string;
    lastName: string;
    email: string;
    role: 'admin' | 'head' | 'staff';
    address: string;
    birthdate: string; // Store as string for simplicity
    gender: string;
    civilStatus: string;
    phoneNumber: string;
    profilePictureUrl?: string; // Optional
    // Add other fields as necessary
}

const UserDetailsScreen = ({ route, navigation }: any) => {
    const  userId  = route.params;
    const { colors } = useTheme();
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        const fetchUserDetails = async () => {
            let fetchId = userId; // Default to the provided userId
            if (!fetchId) {
                if (user?.uid) {
                    fetchId = user.uid; // If userId is not provided, use the logged-in user's ID
                } else {
                    setError('User ID is undefined.');
                    setLoading(false);
                    return;
                }
            }

            try {
                const userDocRef = doc(db, 'users', fetchId);
                const docSnap = await getDoc(userDocRef);

                if (docSnap.exists()) {
                    // Convert birthdate back to string for display
                    const data = docSnap.data() as UserDetails;
                    let birthdateString = '';
                    if (data.birthdate) {
                        // If Firestore Timestamp
                        if (
                            typeof data.birthdate === 'object' &&
                            data.birthdate !== null &&
                            'seconds' in data.birthdate &&
                            typeof (data.birthdate as { seconds: number }).seconds === 'number'
                        ) {
                            const dateObj = new Date((data.birthdate as { seconds: number }).seconds * 1000);
                            birthdateString = dateObj.toLocaleDateString();
                        } else {
                            // If ISO string or other string format
                            const dateObj = new Date(data.birthdate);
                            birthdateString = isNaN(dateObj.getTime())
                                ? data.birthdate
                                : dateObj.toLocaleDateString();
                        }
                    }
                    setUserDetails({
                        ...data,
                        birthdate: birthdateString,
                    });
                } else if (userId) {
                    setError('User details not found.');
                } else {
                    setError('User not found.');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to fetch user details.');
            } finally {
                setLoading(false);
            }
        };

        fetchUserDetails();
    }, [userId, user]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator animating={true} color={colors.primary} size="large" />
                <Text style={{ marginTop: 10, color: colors.secondary }}>Loading User Details</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={{ color: colors.error }}>Error: {error}</Text>
                <Button onPress={() => navigation.goBack()} style={{ marginTop: 10 }}>
                    Go Back
                </Button>
            </View>
        );
    }

    if (!userDetails) {
        return (
            <View style={styles.errorContainer}>
                <Text style={{ color: colors.error }}>User details are not available.</Text>
                <Button onPress={() => navigation.goBack()} style={{ marginTop: 10 }}>
                    Go Back
                </Button>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.card}>
                {/* Profile Picture */}
                {userDetails.profilePictureUrl && (
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: userDetails.profilePictureUrl }} style={styles.profileImage} />
                    </View>
                )}

                {/* Basic Information */}
                <Text style={styles.sectionTitle}>Basic Information</Text>
                <View style={styles.nameContainer}>
                    <TextInput
                        label="First Name"
                        value={userDetails.firstName}
                        style={[styles.input, styles.nameInput]}
                        editable={false}
                        theme={{ colors: { primary: colors.primary } }}
                    />
                    <TextInput
                        label="Last Name"
                        value={userDetails.lastName}
                        style={[styles.input, styles.nameInput]}
                        editable={false}
                        theme={{ colors: { primary: colors.primary } }}
                    />
                </View>

                <TextInput
                    label="Address"
                    value={userDetails.address}
                    style={styles.input}
                    editable={false}
                    theme={{ colors: { primary: colors.primary } }}
                />
                <TextInput
                    label="Birthdate"
                    value={userDetails.birthdate}
                    style={styles.input}
                    editable={false}
                    theme={{ colors: { primary: colors.primary } }}
                />
                <TextInput
                    label="Gender"
                    value={userDetails.gender}
                    style={styles.input}
                    editable={false}
                    theme={{ colors: { primary: colors.primary } }}
                />
                <TextInput
                    label="Civil Status"
                    value={userDetails.civilStatus}
                    style={styles.input}
                    editable={false}
                    theme={{ colors: { primary: colors.primary } }}
                />

                {/* Contact Information */}
                <Text style={styles.sectionTitle}>Contact Information</Text>
                <TextInput
                    label="Phone Number"
                    value={userDetails.phoneNumber}
                    style={styles.input}
                    editable={false}
                    keyboardType="phone-pad"
                    theme={{ colors: { primary: colors.primary } }}
                />
                <TextInput
                    label="Email"
                    value={userDetails.email}
                    style={styles.input}
                    editable={false}
                    keyboardType="email-address"
                    theme={{ colors: { primary: colors.primary } }}
                />
                <TextInput
                    label="Role"
                    value={userDetails.role}
                    style={styles.input}
                    editable={false}
                    theme={{ colors: { primary: colors.primary } }}
                />

                <Button
                    mode="outlined"
                    onPress={() => {
                        // Navigate based on user role
                        if (userDetails.role === 'admin') {
                            navigation.navigate('Admin');
                        } else if (userDetails.role === 'head') {
                            navigation.navigate('Head');
                        } else if (userDetails.role === 'staff') {
                            navigation.navigate('Staff');
                        } else {
                            navigation.goBack();
                        }
                    }}
                    style={styles.button}
                    theme={{ colors: { primary: colors.primary } }}
                >
                    Go Back
                </Button>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        width: '100%',
        maxWidth: 500,
        padding: 20,
        borderRadius: 12,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8, // Increased shadowRadius for a softer shadow
        elevation: 5,       // Increased elevation for a more pronounced effect
    },
    input: {
        marginBottom: 12,
    },
    button: {
        marginTop: 20,
    },
    imageContainer: {
        alignItems: 'center',
        marginVertical: 10,
        width: '100%',
    },
    profileImage: {
        width: 90, // Increased size
        height: 90,
        borderRadius: 60, // Make it round
        borderWidth: 3,
        borderColor: '#3498db',
        marginVertical: 10,
        shadowColor: '#000',  // Add shadow to the image
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionTitle: {
        marginTop: 20,
        marginBottom: 10,
        fontWeight: '700', // Medium font weight
        fontSize: 16,
        color: '#0c0a09', // A subtle accent color
         // Italicize the section title
    },
    nameContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between', // Space between first and last name inputs
        width: '100%',
        marginBottom: 12,
    },
    nameInput: {
        flex: 1, // Each input takes equal space
        marginRight: 6, // Add some right margin to the first name input
        marginLeft: 0,
    },
});

export default UserDetailsScreen;

