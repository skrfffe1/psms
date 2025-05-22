// components/charts/ReturnConditionPieChart.tsx
import { StyleSheet, Text, View, Dimensions, ActivityIndicator } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config'; // Adjust path to your Firebase config

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
    backgroundGradientFrom: "#1c398e",
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: "#08130D",
    backgroundGradientToOpacity: 0.5,
    color: (opacity = 1) => `rgba(230, 172, 0, ${opacity})`,
};

// A set of colors for the pie chart slices. Add more if you expect many conditions.
const SLICE_COLORS = [
    '#4CAF50', // Green (e.g., Good)
    '#FFC107', // Amber (e.g., Minor Damage)
    '#F44336', // Red (e.g., Damaged/Broken)
    '#2196F3', // Blue (e.g., Under Repair)
    '#9C27B0', // Purple (e.g., Lost)
    '#00BCD4', // Cyan
    '#FF5722', // Deep Orange
];

interface ReturnConditionPieChartProps {
    containerWidth?: number;
    maxSlices?: number; // Optional: limit number of slices and group others into 'Other'
}

export default function ReturnConditionPieChart({ containerWidth, maxSlices = 7 }: ReturnConditionPieChartProps) {
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasData, setHasData] = useState(false);

    useEffect(() => {
        setLoading(true);
        setError(null);

        // Query for issuanceLogs that have a 'returnCondition' field (implying they were returned)
        // We'll also implicitly check for returnedAt being not null by presence of returnCondition
        const returnLogsQuery = query(
            collection(db, 'issuanceLogs'),
            where('returnCondition', '!=', null) // Filter out documents where returnCondition is explicitly null
            // You might also add: where('returnedAt', '!=', null) if that's more robust
        );

        const unsubscribe = onSnapshot(returnLogsQuery, (querySnapshot) => {
            const conditionCounts: { [key: string]: number } = {};
            let totalReturnedItems = 0;

            querySnapshot.docs.forEach(doc => {
                const data = doc.data();
                // Ensure returnCondition is a string and not empty, and quantity is a number
                if (typeof data.returnCondition === 'string' && data.returnCondition.trim() !== '' && typeof data.quantity === 'number' && data.quantity > 0) {
                    const condition = data.returnCondition.trim();
                    const quantity = data.quantity;
                    conditionCounts[condition] = (conditionCounts[condition] || 0) + quantity;
                    totalReturnedItems += quantity;
                }
            });

            if (totalReturnedItems === 0) {
                setHasData(false);
                setChartData([]);
            } else {
                setHasData(true);

                // Convert counts to an array for sorting and processing
                let rawData = Object.keys(conditionCounts).map(condition => ({
                    name: condition,
                    count: conditionCounts[condition]
                }));

                // Sort by count in descending order
                rawData.sort((a, b) => b.count - a.count);

                let processedData: any[] = [];
                let otherCount = 0;

                // Aggregate into 'Other' if too many slices
                if (rawData.length > maxSlices) {
                    for (let i = 0; i < maxSlices - 1; i++) {
                        processedData.push(rawData[i]);
                    }
                    for (let i = maxSlices - 1; i < rawData.length; i++) {
                        otherCount += rawData[i].count;
                    }
                    if (otherCount > 0) {
                        processedData.push({ name: 'Other', count: otherCount });
                    }
                } else {
                    processedData = rawData;
                }

                const formattedData = processedData.map((item, index) => ({
                    name: `${item.name} (${item.count})`, // Include count in legend name
                    population: item.count,
                    color: SLICE_COLORS[index % SLICE_COLORS.length],
                    legendFontColor: '#fafaf9',
                    legendFontSize: 10,
                }));
                setChartData(formattedData);
            }
            setLoading(false);
            setError(null); // Clear any previous errors on successful data fetch
        }, (err) => {
            console.error("Error fetching return condition data in real-time:", err);
            setError("Failed to load return condition data.");
            setHasData(false);
            setLoading(false);
        });

        // Return the unsubscribe function to clean up the listener
        return () => unsubscribe();
    }, [maxSlices]); // maxSlices is a dependency

    const chartRenderWidth = containerWidth ? containerWidth - 30 : screenWidth - 80;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1c398e" />
                <Text style={styles.loadingText}>Loading Return Conditions...</Text>
            </View>
        );
    }

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
                <Text style={styles.noDataText}>No return condition data available.</Text>
            </View>
        );
    }

    return (
        <View>          
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
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        backgroundColor: '#FFFFFF', // Or your card background color
        borderRadius: 8,
        margin: 10,
        elevation: 3, // For Android shadow
        shadowColor: '#000', // For iOS shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
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
});