import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRoute, RouteProp } from '@react-navigation/native';
import { DrawerNavigationProp, DrawerScreenProps } from '@react-navigation/drawer';
import { RootStackParamList } from '@/types/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import Toast from 'react-native-toast-message';
import { Button, Card, TextInput } from 'react-native-paper';
import { globalStyles } from '@/styles/global'; // Assuming you might want global styles

interface Supply {
    supplyName: string;
    quantity: string;
    description: string;
    category: string;
}

interface EditSupplyScreenProps {
    navigation: DrawerNavigationProp<RootStackParamList, 'EditSupply'>;
    setRefreshSupplyList: React.Dispatch<React.SetStateAction<boolean>>;
    route: DrawerScreenProps<RootStackParamList, 'EditSupply'>['route'];
}

type EditSupplyRouteProp = RouteProp<RootStackParamList, 'EditSupply'>;

const EditSupplyScreen: React.FC<EditSupplyScreenProps> = ({ navigation }) => {
    const route = useRoute<EditSupplyRouteProp>();
    const id = route.params?.id;
    if (!id) {
        Toast.show({ type: 'error', text1: 'Invalid supply ID.' });
        navigation.goBack();
        return null;
    }
    const [supplyName, setSupplyName] = useState<string>('');
    const [quantity, setQuantity] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [category, setCategory] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const itemValues: string[] = [
        'Office Supplies',
        'Electronics',
        'Furniture',
        'Medical Supplies',
        'Other',
    ];

    useEffect(() => {
        const fetchSupply = async () => {
            try {
                const docRef = doc(db, 'supplies', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const supplyData = docSnap.data() as Supply;
                    setSupplyName(supplyData.supplyName);
                    setQuantity(supplyData.quantity);
                    setCategory(supplyData.category || '');
                    setDescription(supplyData.description || '');
                } else {
                    Toast.show({ type: 'error', text1: 'Supply not found.' });
                    navigation.goBack();
                }
            } catch (error) {
                console.error('Error fetching supply:', error);
                Toast.show({ type: 'error', text1: 'Failed to load supply.' });
            } finally {
                setLoading(false);
            }
        };
        fetchSupply();
    }, [id, navigation]);

    const handleUpdateSupply = async () => {
        if (!supplyName || !quantity || !description || !category) {
            Toast.show({ type: 'error', text1: 'All fields are required!' });
            return;
        }

        setLoading(true);
        try {
            const supplyDocRef = doc(db, 'supplies', id);
            await updateDoc(supplyDocRef, {
                supplyName,
                quantity,
                description,
                category,
            });

            Toast.show({ type: 'success', text1: 'Supply updated successfully!' });
            navigation.goBack(); // Use goBack to return to ViewSupplyScreen
        } catch (error) {
            console.error('Error updating supply:', error);
            Toast.show({ type: 'error', text1: 'Failed to update supply.' });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={globalStyles.container}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Card style={styles.card}>
                <Card.Content style={styles.center}>
                    <Picker
                        selectedValue={category}
                        onValueChange={(itemValue: string) => setCategory(itemValue)}
                        style={[styles.input, styles.picker]}
                        mode="dropdown"
                        dropdownIconColor="#fff"
                        dropdownIconRippleColor="#fff"
                        itemStyle={{ color: '#fff' }}
                    >
                        <Picker.Item label="Select Category" value="" />
                        {itemValues.map((item, index) => (
                            <Picker.Item key={index} label={item} value={item} />
                        ))}
                    </Picker>
                    <TextInput
                        style={styles.input}
                        value={supplyName}
                        onChangeText={(text: string) => setSupplyName(text)}
                        textColor='#0c0a09'
                        placeholder=""
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="default"
                        returnKeyType="next"
                        onFocus={() => setSupplyName('')}
                        onBlur={() => setSupplyName(supplyName.trim())}
                        label="Supply Name"
                        right={<TextInput.Icon icon={'cart'} />}
                    />
                    <TextInput
                        style={styles.input}
                        value={quantity}
                        onChangeText={(text: string) => setQuantity(text)}
                        textColor='#0c0a09'
                        placeholder=""
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="default"
                        returnKeyType="next"
                        onFocus={() => setQuantity('')}
                        onBlur={() => setQuantity(quantity.trim())}
                        label="Quantity"
                        right={<TextInput.Icon icon={'eye'} />}
                    />
                    <TextInput
                        style={styles.input}
                        value={description}
                        onChangeText={(text: string) => setDescription(text)}
                        textColor='#0c0a09'
                        placeholder=""
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="default"
                        returnKeyType="next"
                        onFocus={() => setDescription('')}
                        onBlur={() => setDescription(description.trim())}
                        label="Description"
                        right={<TextInput.Icon icon={'text'} />}
                    />
                    <Button
                        style={styles.btn}
                        icon="pencil"
                        mode="contained"
                        onPress={handleUpdateSupply}
                        labelStyle={{ color: '#fafaf9' }}
                        elevation={5}
                    >
                        Update Supply
                    </Button>
                </Card.Content>
            </Card>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    paddingVertical: 20,
  },
  card: {
    width: '90%',
    backgroundColor: '#fafaf9',
    borderRadius: 8,
    elevation: 2,
    marginTop: 10,
  },
  picker: {
    width: '100%',
    color: '#0c0a09',
  },
  pickerContainer: {
    marginBottom: 15,
    width: '100%',
  },
  input: {
    marginBottom: 10,
    width: '100%',
  },
  btn: {
    marginTop: 10,
    width: '100%',
    height: 40,
    backgroundColor: '#1c398e',
    borderRadius: 5,
    
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    color: '#0c0a09',
    fontFamily: 'roboto',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  errorText: {
    color: '#FF6B6B',
    marginBottom: 10,
    fontSize: 14,
    alignSelf: 'flex-start',
  },
});

export default EditSupplyScreen;