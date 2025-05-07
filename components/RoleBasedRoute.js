// /components/RoleBasedRoute.js
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext'; // Adjust the import path as necessary
import { Text } from 'react-native';

const RoleBasedRoute = ({ allowedRoles, children }) => {
  const { role } = useContext(AuthContext);
  if (!allowedRoles.includes(role)) {
    return <Text>Access Denied</Text>;
  }
  return children;
};

export default RoleBasedRoute;
