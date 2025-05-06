import React from 'react';
import { useState } from 'react';
import { BottomNavigation, Text, Provider } from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import ApprovedHistoryScreen from '../requests/approvedHistoryScreen';
import RejectedHistoryScreen from '../requests/rejectedHistoryScreen';
import { StyleSheet } from 'react-native';

export default function RequestHistory() {
  const [index, setIndex] = useState(0);

  const routes = [
    { key: 'approve', title: 'Approve', icon: 'check' },
    { key: 'rejected', title: 'Rejected', icon: 'close' },
  ];

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'approve':
        return <ApprovedHistoryScreen />;
      case 'rejected':
        return <RejectedHistoryScreen />;
      default:
        return null;
    }
  };
  return (
    <Provider>
    {renderScene({ route: routes[index] })}
    <BottomNavigation.Bar
      navigationState={{ index, routes }}
      onTabPress={({ route }) => {
        const newIndex = routes.findIndex((r) => r.key === route.key);
        if (newIndex !== -1) {
          setIndex(newIndex);
        }
      }}
      renderIcon={({ route, color }) => (
        <Icon name={route.icon} size={24} color={color} />
      )}
      getLabelText={({ route }) => route.title}
    />
  </Provider>
  )
}

const styles = StyleSheet.create({})