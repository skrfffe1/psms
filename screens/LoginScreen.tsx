import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Alert, Text } from 'react-native';
import { TextInput, Button, PaperProvider, Card } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

interface LoginScreenProps {
  props?: Record<string, unknown>;
}

export default function LoginScreen(props: LoginScreenProps): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const { login, loading } = useAuth();

  // Clear error message when email or password changes
  useEffect(() => {
    setLoginError(null);
  }, [email, password]);

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      setLoginError("Please enter both email and password.");
      return;
    }

    try {
      await login(email, password);
    } catch (error: any) {
      let errorMessage = "Login failed: ";
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage += "Invalid email address.";
          break;
        case 'auth/user-disabled':
          errorMessage += "This account has been disabled.";
          break;
        case 'auth/user-not-found':
          errorMessage += "No user found with this email.";
          break;
        case 'auth/wrong-password':
          errorMessage += "Incorrect password.";
          break;
        case 'auth/too-many-requests':
          errorMessage += "Too many login attempts. Please try again later.";
          break;
        default:
          errorMessage += error.message;
          break;
      }
      setLoginError(errorMessage);
      Alert.alert("Login Error", errorMessage); // Show user friendly message
    }
  }, [email, password, login]);

  return (
    <PaperProvider>
      <View style={[styles.container]}>
        <Image
          style={styles.backgroundImage}
          source={require('../assets/images/background.png')}
          contentFit="cover"
          transition={1000}
        />
        <View style={[styles.center, styles.overlay]}>
        </View>
        <Card style={styles.card} mode='outlined'>
          <Text style={styles.title}>PSMS</Text>
          <Card.Content style={styles.center}>
            <TextInput
              style={[styles.input, { backgroundColor: '#f5f5f4' }]}
              value={email}
              textColor='#0c0a09'
              onChangeText={(text: string) => setEmail(text)}
              placeholder="Email"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
              placeholderTextColor={'#a6a09b'}
              onFocus={() => setEmail('')}
              onBlur={() => setEmail(email.trim())}
              secureTextEntry={false} // Changed to false, was true
              // right={<TextInput.Icon icon="email" />}
              error={!!loginError}
              underlineColor='#0c0a09'
              activeUnderlineColor='#57534d'
            />
            <TextInput

              style={[styles.input, { backgroundColor: '#f5f5f4' }]}
              value={password}
              onChangeText={(text: string) => setPassword(text)}
              textColor='#0c0a09'
              placeholder="Password"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              placeholderTextColor={'#a6a09b'}
              onFocus={() => setPassword('')}
              onBlur={() => setPassword(password.trim())}
              secureTextEntry={true}
              // right={<TextInput.Icon icon="eye" />}
              error={!!loginError}
              underlineColor='#0c0a09'
              activeUnderlineColor='#57534d'
            />
            {loginError && <Text style={styles.errorText}>{loginError}</Text>}
            <Button
              style={[styles.btn]}
              icon={({ size }) => (
                <Ionicons name="log-in-outline" color="#fafaf9" size={size} />
              )}
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
            >
              <Text style={{ color: '#fafaf9' }}>Login</Text>
            </Button>
          </Card.Content>
        </Card>
      </View>

    </PaperProvider>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222831',
  },
  input: {
    marginBottom: 10,
    width: '100%',
  },
  text: {
    fontFamily: 'Poppins', // Make sure this font is available or remove.
    marginBottom: 10,
  },
  btn: {
    marginTop: 1,
    width: '40%',
    height: 40,
    backgroundColor: '#1c398e',
    borderRadius: 5,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    color: '#1c398e',
    fontFamily: 'roboto', // Make sure this font is available or remove.
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
    alignSelf: 'center',
  },
  logo: {
    marginBottom: 5,
  },
  errorText: {
    color: '#FF6B6B', // A shade of red
    marginBottom: 10,
    fontSize: 14,
    alignSelf: 'flex-start',
  },
  image: {
    flex: 1,
    width: '100%',
    backgroundColor: '#0553',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject, // Ensures it covers the full screen
  },
  overlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  card: {
    marginTop: 10,
    width: '85%',
    height: 'auto',
    backgroundColor: '#fafaf9',
  },
});
