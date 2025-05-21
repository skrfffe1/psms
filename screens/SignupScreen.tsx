import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { TextInput } from 'react-native-paper';
import { Button } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { Picker } from '@react-native-picker/picker';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

// Define the File interface
interface File {
    uri: string;
    name: string;
    type: string;
    size?: number;
}

const SignupScreen = () => {
    const [firstName, setfirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'admin' | 'head' | 'staff'>('staff');

    // Basic Information
    const [address, setAddress] = useState('');
    const [birthdate, setBirthdate] = useState<Date | null>(null);
    const [gender, setGender] = useState('');
    const [civilStatus, setCivilStatus] = useState('');

    // Contact Information
    const [phoneNumber, setPhoneNumber] = useState('');

    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

    const { signup, loading } = useAuth();
    const [error, setError] = useState<string | null>(null);


    const handleSignup = async () => {
        setError(null);

        if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim() || !address.trim() || !birthdate || !gender.trim() || !civilStatus.trim() || !phoneNumber.trim() ) {
            setError("Please fill in all fields.");
            return;
        }

        try {
            await signup(
                firstName,
                lastName,
                email,
                password,
                role,
                address,
                birthdate,
                gender,
                civilStatus,
                phoneNumber,
                profilePicture ? profilePicture.uri : undefined // Pass the image URI if available
            );
            Alert.alert("Success", "User signed up and data saved successfully!");
        } catch (error: any) {
            const errorMessage = error.message || "Signup failed.";
            setError(errorMessage);
            console.error("Error during signup:", error);
            Alert.alert("Signup Error", errorMessage); // Show user-friendly alert
        }
    };

    const showDatePicker = async () => {
        try {
            DateTimePickerAndroid.open({
                value: birthdate || new Date(),
                mode: 'date',
                onChange: (event, selectedDate) => {
                    if (event.type === 'set' && selectedDate) { // Corrected check
                        setBirthdate(selectedDate);
                    }
                },
            });
        } catch (error: any) {
            const errorMessage = `Error picking date: ${error.message}`;
            setError(errorMessage);
            Alert.alert("Date Picker Error", errorMessage);
        }
    };

    const formatDate = (date: Date | null) => {
        if (!date) return 'Birth Date';
        return date.toLocaleDateString();
    };

    const handleChooseImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            const errorMessage = 'Permission to access media library is required!';
            setError(errorMessage);
            Alert.alert("Permission Denied", errorMessage);
            return;
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) { // added check for result.assets
                const selectedImage = result.assets[0];

                let mimeType = 'image/jpeg';
                try {
                    // Guess MIME type from file extension
                    const extension = selectedImage.uri.split('.').pop()?.toLowerCase();
                    if (extension === 'png') mimeType = 'image/png';
                    else if (extension === 'jpg' || extension === 'jpeg') mimeType = 'image/jpeg';
                    else if (extension === 'gif') mimeType = 'image/gif';
                    // Add more types if needed
                } catch (e: any) {
                    console.error("Error determining image type:", e);
                    mimeType = 'image/jpeg';
                    setError("Error determining image type. Please select a different image.");
                    Alert.alert("Image Error", "Error determining image type.");
                }

                const file: File = {
                    uri: selectedImage.uri,
                    name: selectedImage.fileName || 'image.jpg',
                    type: mimeType,
                    size: selectedImage.fileSize,
                };

                setProfilePicture(file);
                setProfilePictureUrl(selectedImage.uri);
            }
        } catch (error: any) {
            const errorMessage = `Error picking image: ${error.message}`;
            setError(errorMessage);
            Alert.alert("Image Picker Error", errorMessage);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Profile Picture Selection */}
            <Text style={styles.sectionTitle}>Profile Picture</Text>
            <View style={styles.imagePickerContainer}>
                {profilePictureUrl ? (
                    <Image source={{ uri: profilePictureUrl }} style={styles.profileImage} />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Text>No Profile Picture</Text>
                    </View>
                )}
                <Button mode="outlined" onPress={handleChooseImage} style={styles.imagePickerButton}>
                    Choose Image
                </Button>
            </View>


            {/* Basic Information */}
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <TextInput
                label="First Name"
                value={firstName}
                onChangeText={setfirstName}
                mode="outlined"
                style={styles.input}
                error={!!error && error.includes("firstName")}
            />
            <TextInput
                label="Last Name"
                value={lastName}
                onChangeText={setLastName}
                mode="outlined"
                style={styles.input}
                error={!!error && error.includes("lastName")}
            />
            <TextInput
                label="Address"
                value={address}
                onChangeText={setAddress}
                mode="outlined"
                style={styles.input}
                error={!!error && error.includes("address")}
            />
            <Button mode="outlined" onPress={showDatePicker} style={styles.datePickerButton}>
                {formatDate(birthdate)}
            </Button>

            <View style={[styles.input, { padding: 0, backgroundColor: 'white' }]}>
                <Picker
                    selectedValue={gender}
                    onValueChange={(itemValue) => setGender(itemValue)}
                    style={{ height: 50, width: '100%' }}
                >
                    <Picker.Item label="Select Gender" value="" />
                    <Picker.Item label="Male" value="male" />
                    <Picker.Item label="Female" value="female" />
                    <Picker.Item label="Other" value="other" />
                </Picker>
            </View>

            <View style={[styles.input, { padding: 0, backgroundColor: 'white' }]}>
                <Picker
                    selectedValue={civilStatus}
                    onValueChange={(itemValue) => setCivilStatus(itemValue)}
                    style={{ height: 50, width: '100%' }}
                >
                    <Picker.Item label="Select Civil Status" value="" />
                    <Picker.Item label="Single" value="single" />
                    <Picker.Item label="Married" value="married" />
                    <Picker.Item label="Divorced" value="divorced" />
                    <Picker.Item label="Widowed" value="widowed" />
                </Picker>
            </View>


            {/* Contact Information */}
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <TextInput
                label="Phone Number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                mode="outlined"
                style={styles.input}
                error={!!error && error.includes("phone")}
            />
            <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                mode="outlined"
                style={styles.input}
                error={!!error && error.includes("email")}
            />
            <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                mode="outlined"
                style={styles.input}
                error={!!error && error.includes("password")} // Added password error
            />

            {/* Role Selection */}
            <Text style={styles.sectionTitle}>Role</Text>
            <View style={[styles.input, { padding: 0, backgroundColor: 'white' }]}>
                <Picker
                    selectedValue={role}
                    onValueChange={(itemValue) => setRole(itemValue as 'admin' | 'head' | 'staff')}
                    style={{ height: 50, width: '100%' }}
                >
                    <Picker.Item label="Staff" value="staff" />
                    <Picker.Item label="Head" value="head" />
                    <Picker.Item label="Admin" value="admin" />
                </Picker>
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <Button
                mode="contained"
                onPress={handleSignup}
                disabled={loading}
                style={styles.button}
                loading={loading}
            >
                {loading ? 'Signing up...' : 'Sign Up'}
            </Button>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f0f4f8',
    },
    title: {
        marginBottom: 20,
        color: '#2c3e50',
    },
    input: {
        width: '100%',
        marginVertical: 10,
        backgroundColor: 'white'
    },
    roleButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginVertical: 10,
    },
    button: {
        width: '100%',
        marginTop: 20,
        backgroundColor: '#1c398e',
    },
    error: {
        color: 'red',
        marginVertical: 10,
    },
    select: {
        width: '100%',
        marginVertical: 10,
    },
    sectionTitle: {
        width: '100%',
        marginTop: 20,
        marginBottom: 5,
        fontWeight: 'bold',
        color: '#34495e',
    },
    datePickerButton: {
        width: '100%',
        marginVertical: 10,
        alignItems: 'flex-start',
    },
    imagePickerContainer: {
        alignItems: 'center',
        marginVertical: 10,
        width: '100%',
    },
    imagePickerButton: {
        marginTop: 10,
        width: '100%',
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#3498db',
        marginVertical: 10,
    },
    placeholderImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10,
    }
});

export default SignupScreen;
