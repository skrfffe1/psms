// components/charts/SupplyQuantityPieChart.tsx
import { StyleSheet, Text, View, Dimensions, ActivityIndicator } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import React, { useState, useEffect, useCallback } from 'react';
// Changed getDocs to onSnapshot
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config'; // Adjust path to your Firebase config
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient from expo-linear-gradient

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
    backgroundGradientFrom: "#1c398e",
    backgroundGradientFromOpacity: 1,
    backgroundGradientTo: "#08130D",
    backgroundGradientToOpacity: 0.8,
    color: (opacity = 1) => `rgba(255, 185, 0, ${opacity})`, // Warm golden tone
    useShadowColorFromDataset: false,
};

const SLICE_COLORS = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#2ECC71', '#E74C3C', '#3498DB', '#F1C40F',
    '#1ABC9C', '#9B59B6', '#D35400', '#8E44AD', '#C0392B',
];

interface SupplyQuantityPieChartProps {
    containerWidth?: number;
    maxSlices?: number;
}

export default function SupplyQuantityPieChart({ containerWidth, maxSlices = 8 }: SupplyQuantityPieChartProps) {
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasData, setHasData] = useState(false);

    // No need for fetchData in useCallback now, it's handled by useEffect with onSnapshot
    useEffect(() => {
        setLoading(true);
        setError(null);

        const suppliesCollectionRef = collection(db, 'supplies');

        // Set up the real-time listener
        const unsubscribe = onSnapshot(suppliesCollectionRef, (querySnapshot) => {
            let rawData: { name: string; quantity: number }[] = [];
            querySnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (typeof data.supplyName === 'string' && data.supplyName.trim() !== '' && typeof data.quantity === 'number' && data.quantity > 0) {
                    rawData.push({ name: data.supplyName, quantity: data.quantity });
                } else {
                    console.warn(`Skipping supply document ID: ${doc.id} due to invalid supplyName or quantity. Data:`, data);
                }
            });

            if (rawData.length === 0) {
                setHasData(false);
                setChartData([]);
            } else {
                rawData.sort((a, b) => b.quantity - a.quantity);

                let processedData: any[] = [];
                let otherQuantity = 0;

                if (rawData.length > maxSlices) {
                    for (let i = 0; i < maxSlices - 1; i++) {
                        processedData.push(rawData[i]);
                    }
                    for (let i = maxSlices - 1; i < rawData.length; i++) {
                        otherQuantity += rawData[i].quantity;
                    }
                    if (otherQuantity > 0) {
                        processedData.push({ name: 'Other', quantity: otherQuantity });
                    }
                } else {
                    processedData = rawData;
                }

                const formattedData = processedData.map((item, index) => ({
                    name: item.name,
                    population: item.quantity,
                    color: SLICE_COLORS[index % SLICE_COLORS.length],
                    legendFontColor: '#fafaf9',
                    legendFontSize: 10,
                }));

                if (formattedData.length === 0 || formattedData.every(item => item.population === 0)) {
                    setHasData(false);
                    setChartData([]);
                } else {
                    setHasData(true);
                    setChartData(formattedData);
                }
            }
            setLoading(false);
            setError(null); // Clear any previous errors on successful data fetch
        }, (err) => {
            // Error callback for onSnapshot
            console.error("Error fetching supply quantity data in real-time:", err);
            setError("Failed to load supply quantity data in real-time.");
            setHasData(false);
            setLoading(false);
        });

        // Return the unsubscribe function to clean up the listener when the component unmounts
        return () => unsubscribe();
    }, [maxSlices]); // maxSlices is a dependency

    const chartRenderWidth = containerWidth ? containerWidth - 30 : screenWidth - 80;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="" />
                <Text style={styles.loadingText}>Loading Supply Quantities</Text>
            </View>
        );
    }
    //  (rest of your component's rendering logic and styles are unchanged) 
    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error: {error}</Text>
            </View>
        );
    }

    if (!hasData || chartData.every(item => item.population === 0)) {
        return (
            <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No supply quantity data available.</Text>
            </View>
        );
    }

    return (
        <View style={styles.chartContainer}>
            <LinearGradient
                colors={["rgb(255, 223, 32)", "rgba(230, 172, 0, 0.3)", "rgba(255, 215, 0, 0.1)"]}
                start={[0, 0]}
                end={[1, 1]}
                style={styles.overlay}
            />
            <PieChart
                data={chartData}
                width={chartRenderWidth}
                height={150}
                chartConfig={chartConfig}
                accessor={"population"}
                backgroundColor={"#1c398e"}
                paddingLeft={"10"}
                center={[10, 5]}
                absolute
                hasLegend={true}
                style={{
                    borderRadius: 8,
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    chartContainer: {
        position: 'relative',
    },
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingContainer: {
        minHeight: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#555',
        fontSize: 12,
    },
    errorContainer: {
        minHeight: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        fontSize: 14,
    },
    noDataContainer: {
        minHeight: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noDataText: {
        color: '#888',
        textAlign: 'center',
        fontSize: 14,
    },
    overlay: {
        position: "absolute",
        width: "98%",
        height: "90%",
        borderRadius: 8, // Matches PieChart's borderRadius
        opacity: 0.3, // Adjust for subtlety
        zIndex: 1, // Ensure it overlays the chart

    }
});