import { StyleSheet, View } from 'react-native'
import * as React from 'react';
import { Text } from 'react-native-paper';

export default function dashboard() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text variant="displayMedium">Dashboard</Text>
        <Text variant="titleMedium">Under Maintenance...</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222831',
  },
  card: {
    width: '90%',
    backgroundColor: '#222831',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  picker: {
    marginBottom: 15,
    width: '100%',
    backgroundColor: '#222831',
    color: '#fff'
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
});