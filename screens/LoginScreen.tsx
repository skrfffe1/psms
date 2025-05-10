import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Text, TextInput, Button, PaperProvider } from 'react-native-paper';

interface LoginScreenProps {
  props?: Record<string, unknown>;
}

export default function LoginScreen(props: LoginScreenProps): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuth();

  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch (error: any) {
      alert(`Login Failed: ${error.message}`);
    }
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>PSMS</Text>
          {/* Uncomment the icon if needed */}
          {/* <Ionicons style={styles.logo} name="folder-open-outline" size={50} color="white" /> */}
        </View>
        <Card style={{ marginTop: 10, width:'90%' }}>

          <Card.Content style={styles.center}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(text: string) => setEmail(text)}
              mode="outlined"
              placeholder="Enter your email"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
              onFocus={() => setEmail('')}
              onBlur={() => setEmail(email.trim())}
              label="Email"
              secureTextEntry
              right={<TextInput.Icon icon="email" />}
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={(text: string) => setPassword(text)}
              mode="outlined"
              placeholder="Enter your password"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onFocus={() => setPassword('')}
              onBlur={() => setPassword(password.trim())}
              label="Password"
              secureTextEntry
              right={<TextInput.Icon icon="eye" />}
            />
            <Button style={styles.btn} icon="login" mode="contained" onPress={handleLogin}>
              Login
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
    fontFamily: 'Poppins',
    marginBottom: 10,
  },
  btn: {
    marginTop: 10,
    width: '80%',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    color: 'white',
    fontFamily: 'roboto',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  logo: {
    marginBottom: 5,
  }
});