// QuickActions.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';

const QuickActions = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

    return (
        <View style={styles.container}>
            <Button
                mode="contained"
                style={styles.button}
                onPress={() => navigation.navigate('AddSupply')}
            >
                Add New Supply
            </Button>
            <Button
                mode="contained"
                style={styles.button}
                onPress={() => navigation.navigate('ManageRequest')}
            >
                Manage Requests
            </Button>
            {/* Add more quick actions as needed */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
    },
    button: {
        flex: 1,
        marginHorizontal: 5,
    },
});

export default QuickActions;