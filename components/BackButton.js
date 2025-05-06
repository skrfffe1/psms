import { router, usePathname } from 'expo-router';
import * as React from 'react';
import { StyleSheet } from 'react-native';
import { FAB } from 'react-native-paper';

const Back = () => {
  const pathname = usePathname();

  // If the current route is "/dashboard", do not render the back button
  if (pathname === '/screens/dashboard' || pathname === '/') {
    return null;
  }
  
  return (
    <FAB
      icon="arrow-left"
      
      style={styles.fab}
      onPress={() => {
          router.back();
      }}
    />
  );
};

const styles = StyleSheet.create({
  fab: {
    backgroundColor: 'black',
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 50,
  },
})

export default Back;