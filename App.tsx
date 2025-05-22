// App.tsx
import React from 'react';
import { LogBox } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-gesture-handler'; // Import for Drawer

LogBox.ignoreLogs([
  'Text strings must be rendered within a <Text> component',
  "The action 'GO_BACK' was not handled by any navigator."
]);
    

export default function App() {
  return (

    
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}