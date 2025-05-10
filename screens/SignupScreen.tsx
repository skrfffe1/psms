// screens/SignupScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

const SignupScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'head' | 'staff'>('staff'); // Default role
  const { signup, loading } = useAuth();

  const handleSignup = async () => {
    try {
      await signup(email, password, role);
    } catch (error: any) {
      alert(`Signup Failed: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <View style={styles.roleButtons}>
        <Button title="Admin" onPress={() => setRole('admin')} color={role === 'admin' ? 'blue' : undefined} />
        <Button title="Head" onPress={() => setRole('head')} color={role === 'head' ? 'blue' : undefined} />
        <Button title="Staff" onPress={() => setRole('staff')} color={role === 'staff' ? 'blue' : undefined} />
      </View>
      <Button title={loading ? 'Signing up...' : 'Sign Up'} onPress={handleSignup} disabled={loading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20 },
  input: { width: '100%', padding: 10, marginVertical: 10, borderWidth: 1, borderRadius: 5 },
  roleButtons: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginVertical: 10 },
});

export default SignupScreen;