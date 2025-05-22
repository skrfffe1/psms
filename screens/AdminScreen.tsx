// AdminScreen.tsx (Already mostly correct, just verify the import)
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, LogBox } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { Ionicons } from '@expo/vector-icons';

import AdminChartsComponent from '@/components/AdminChartsComponent';
// Import the new UserManagementScreen component
import UserManagementScreen from '@/screens/UserManagement'; // <<<--- ENSURE THIS PATH IS CORRECT
import TransactionLogComponent from '@/components/TransactionLogComponent';

type AdminSection = 'charts' | 'users' | 'settings';

// Centralized text content for AdminScreen
const screenText = {
  chartsTab: 'Overview',
  usersTab: 'User Management',
  settingsTab: 'Settings',
  settingsPlaceholder: 'Settings Section Coming Soon!',
  reportsFab: 'Reports',
};

export default function AdminScreen() {
  const [activeSection, setActiveSection] = useState<AdminSection>('charts');
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    // Keep LogBox.ignoreLogs to a minimum and for specific, known, non-critical warnings only.
    // LogBox.ignoreLogs([
    //   'Non-serializable values were found in the navigation state',
    //   'VirtualizedList: You have a large list that is slow to update'
    // ]);
  }, []);

  const handleGoToReports = () => {
    navigation.navigate('ReportScreen');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'charts':
        return (
          <>
            <AdminChartsComponent />
            {/* The TransactionLogComponent now handles its own top margin */}
            <TransactionLogComponent />
          </>
        );
      case 'users':
        return <UserManagementScreen />; // <<<--- Renders the new component
      case 'settings':
        return (
          <View style={styles.placeholderContent}>
            <Text style={styles.placeholderText}>{screenText.settingsPlaceholder}</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      <View style={styles.navigationBar}>
        <TouchableOpacity
          style={[styles.navTab, activeSection === 'charts' && styles.activeTab]}
          onPress={() => setActiveSection('charts')}
        >
          <Text style={[styles.navTabText, activeSection === 'charts' && styles.activeTabText]}>
            {screenText.chartsTab}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeSection === 'users' && styles.activeTab]}
          onPress={() => setActiveSection('users')}
        >
          <Text style={[styles.navTabText, activeSection === 'users' && styles.activeTabText]}>
            {screenText.usersTab}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeSection === 'settings' && styles.activeTab]}
          onPress={() => setActiveSection('settings')}
        >
          <Text style={[styles.navTabText, activeSection === 'settings' && styles.activeTabText]}>
            {screenText.settingsTab}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentArea}>
        {renderContent()}
      </View>

      <TouchableOpacity
        style={styles.reportsFab}
        onPress={handleGoToReports}
        accessibilityLabel={screenText.reportsFab}
      >
        <Ionicons name="documents-outline" size={24} color="#fafaf9" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    paddingVertical: 3,
    marginBottom: 4,
  },
  navTab: {
    flex: 1,
    paddingVertical: 5,
    alignItems: 'center',
    borderRadius: 6,
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: '#1c398e',
  },
  navTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  activeTabText: {
    color: '#fff',
  },
  contentArea: {
    flex: 1,
  },
  placeholderContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 8,
    borderRadius: 8,
  },
  placeholderText: {
    fontSize: 18,
    color: '#999',
  },
  reportsFab: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    backgroundColor: '#1c398e',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});