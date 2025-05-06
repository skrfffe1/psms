import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { auth } from "@/firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Card, Text, TextInput, Button, PaperProvider } from 'react-native-paper';

export default function LoginScreen(props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter(); // <-- get the router here!

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/screens/dashboard'); // <-- navigate to dashboard
    } catch (error) {
      Alert.alert('Login Error', error.message);
    }
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <View styles={styles.center}>
          <Text style={styles.title}>PSMS</Text>
          {/* Uncomment the icon if needed */}
          {/* <Ionicons style={styles.logo} name="folder-open-outline" size={50} color="white" /> */}
        </View>
        <Card style={{ marginTop: 10, width:'90%' }}>

          <Card.Content style={styles.center}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={text => setEmail(text)}
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
              onChangeText={text => setPassword(text)}
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