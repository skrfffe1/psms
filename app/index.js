import { useState } from 'react';
import { View, Alert, StyleSheet, Button, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router'; // <-- IMPORTANT!
import Header from '../components/Header';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { auth } from "@/firebase/config";  
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginScreen(props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter(); // <-- get the router here!

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard'); // <-- navigate to dashboard
    } catch (error) {
      Alert.alert('Login Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="PSMS" subtitle="Authorized credential only." />
      <InputField placeholder="Email" value={email} onChangeText={setEmail} />
      <InputField
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
       <View>
       <PrimaryButton className='bg-gray-900' label="Login" onPress={handleLogin} />
       </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex1: 1,
    padding: 20,
    backgroundColor: '#F7F8FA', // very light gray for modern feel
  },
});
