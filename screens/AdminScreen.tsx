import { StyleSheet, View, Text, TouchableOpacity, StatusBar } from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { Ionicons } from '@expo/vector-icons';

import AdminChartsComponent from '@/components/AdminChartsComponent';
import UserManagementScreen from '@/screens/UserManagement';

type AdminSection = 'charts' | 'users' | 'settings';

export default function AdminScreen() {
  const [activeSection, setActiveSection] = useState<AdminSection>('charts');
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleGoToReports = () => {
    navigation.navigate('ReportScreen');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'charts':
        return <AdminChartsComponent />;
      case 'users':
        return <UserManagementScreen />;
      case 'settings':
        return (
          <View style={styles.placeholderContent}>
            <Text style={styles.placeholderText}>Settings Section Coming Soon!</Text>
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
          <Text style={[styles.navTabText, activeSection === 'charts' && styles.activeTabText]}>Charts Overview</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeSection === 'users' && styles.activeTab]}
          onPress={() => setActiveSection('users')}
        >
          <Text style={[styles.navTabText, activeSection === 'users' && styles.activeTabText]}>User Management</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeSection === 'settings' && styles.activeTab]}
          onPress={() => setActiveSection('settings')}
        >
          <Text style={[styles.navTabText, activeSection === 'settings' && styles.activeTabText]}>Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentArea}>
        {renderContent()}
      </View>

      <TouchableOpacity
        style={styles.reportsFab}
        onPress={handleGoToReports}
      >
        <Ionicons name="documents-outline" size={28} color="#fafaf9" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    // Removed paddingTop: StatusBar.currentHeight to let the content start right below the StatusBar
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 10,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingVertical: 5,
    marginBottom: 0, // Changed from 10 to 0 to reduce space
  },
  navTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 3,
  },
  activeTab: {
    backgroundColor: '#1c398e',
  },
  navTabText: {
    fontSize: 12,
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
    marginHorizontal: 10,
    borderRadius: 10,
  },
  placeholderText: {
    fontSize: 20,
    color: '#999',
  },
  reportsFab: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: '#1c398e',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});