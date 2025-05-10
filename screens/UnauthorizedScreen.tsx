// screens/UnauthorizedScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const UnauthorizedScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Unauthorized Access</Text>
  </View>
);

const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center' }, title: { fontSize: 20, color: 'red' } });

export default UnauthorizedScreen;