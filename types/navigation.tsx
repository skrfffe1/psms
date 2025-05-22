import type { StackScreenProps } from '@react-navigation/stack';

export type RootStackParamList = {
  Login: undefined; // No parameters
  Signup: undefined; // No parameters
  Admin: undefined; // No parameters
  Head: undefined; // No parameters
  Staff: undefined; // No parameters
  Supply: undefined; // No parameters
  Unauthorized: undefined; // No parameters
  EditSupply: { id: string } | undefined;
  AddSupply: undefined;
  MaintenanceRequest: undefined;
 ManageRequest: { requestId: string; requestType: string };
  RequestSupply: undefined;
  ViewSupply: undefined; // No parameters
  UserRequests: { userId: string };
  ReturnSupply: undefined;
  UserManagement: undefined; // No parameters
  ReportScreen: undefined; // No parameters

  UserDetails: { userId: string }; // Corrected type for UserDetails screen
  // No parameters
};


export type LoginScreenProps = StackScreenProps<RootStackParamList, 'Login'>;
export type SignupScreenProps = StackScreenProps<RootStackParamList, 'Signup'>;
export type AdminScreenProps = StackScreenProps<RootStackParamList, 'Admin'>;
export type HeadScreenProps = StackScreenProps<RootStackParamList, 'Head'>;
export type StaffScreenProps = StackScreenProps<RootStackParamList, 'Staff'>;
export type SupplyScreenProps = StackScreenProps<RootStackParamList, 'Supply'>;
export type UnauthorizedScreenProps = StackScreenProps<RootStackParamList, 'Unauthorized'>;
export type EditSupplyScreenProps = StackScreenProps<RootStackParamList, 'EditSupply'>;
export type AddSupplyScreenProps = StackScreenProps<RootStackParamList, 'AddSupply'>;
export type MaintenanceRequestScreenProps = StackScreenProps<RootStackParamList, 'MaintenanceRequest'>;
export type ManageRequestScreenProps = StackScreenProps<RootStackParamList, 'ManageRequest'>;
export type RequestSupplyScreenProps = StackScreenProps<RootStackParamList, 'RequestSupply'>;
export type ViewSupplyScreenProps = StackScreenProps<RootStackParamList, 'ViewSupply'>;
export type UserRequestsScreenProps = StackScreenProps<RootStackParamList, 'UserRequests'>;
export type UserDetailsScreenProps = StackScreenProps<RootStackParamList, 'UserDetails'>; // Corrected type for UserDetails screen
export type ReturnSupplyScreenProps = StackScreenProps<RootStackParamList, 'ReturnSupply'>;
export type UserManagementScreenProps = StackScreenProps<RootStackParamList, 'UserManagement'>; // No parameters
export type ReportScreenProps = StackScreenProps<RootStackParamList, 'ReportScreen'>; // No parameters
