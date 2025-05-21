// components/charts/SupplyStatusPieChart.tsx
import { StyleSheet, Text, View, Dimensions, ActivityIndicator } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import React, { useState, useEffect } from 'react';
// Changed getDocs to onSnapshot
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
    backgroundGradientFrom: "#1c398e",
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: "#08130D",
    backgroundGradientToOpacity: 0.5,
    color: (opacity = 1) => `rgba(230, 172, 0, ${opacity})`,
};

interface SupplyStatusPieChartProps {
    containerWidth?: number;
}

export default function SupplyStatusPieChart({ containerWidth }: SupplyStatusPieChartProps) {
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasData, setHasData] = useState(false);

    // Use useEffect for real-time listeners
    useEffect(() => {
        setLoading(true);
        setError(null);

        let currentTotalAvailableSupplies = 0;
        let currentCurrentlyIssuedQuantity = 0;

        const suppliesCollectionRef = collection(db, 'supplies');
        const issuedLogsQuery = query(collection(db, 'issuanceLogs'), where('status', '==', 'issued'));

        // Listener for total available supplies
        const unsubscribeSupplies = onSnapshot(suppliesCollectionRef, (suppliesSnapshot) => {
            currentTotalAvailableSupplies = 0; // Reset for recalculation
            suppliesSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (typeof data.quantity === 'number' && data.quantity > 0) {
                    currentTotalAvailableSupplies += data.quantity;
                }
            });
            // After supplies data is updated, update the chart
            updateChartData(currentTotalAvailableSupplies, currentCurrentlyIssuedQuantity);
        }, (err) => {
            console.error("Error fetching supplies for status chart in real-time:", err);
            setError("Failed to load available supply data.");
            setLoading(false); // Stop loading if error on supplies listener
        });

        // Listener for currently issued quantity
        const unsubscribeIssuedLogs = onSnapshot(issuedLogsQuery, (issuedLogsSnapshot) => {
            currentCurrentlyIssuedQuantity = 0; // Reset for recalculation
            issuedLogsSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (typeof data.quantity === 'number' && data.quantity > 0) {
                    currentCurrentlyIssuedQuantity += data.quantity;
                }
            });
            // After issued logs data is updated, update the chart
            updateChartData(currentTotalAvailableSupplies, currentCurrentlyIssuedQuantity);
        }, (err) => {
            console.error("Error fetching issued logs for status chart in real-time:", err);
            setError("Failed to load issued supply data.");
            setLoading(false); // Stop loading if error on issued logs listener
        });


        // Helper function to update state, called by both listeners
        const updateChartData = (totalAvailable: number, currentlyIssued: number) => {
            const trueAvailable = Math.max(0, totalAvailable - currentlyIssued);

            if (totalAvailable === 0 && currentlyIssued === 0) {
                setHasData(false);
                setChartData([]);
            } else {
                setHasData(true);
                setChartData([
                    {
                        name: "Issued",
                        population: currentlyIssued,
                        color: "#2196F3",
                        legendFontColor: '#fafaf9',
                        legendFontSize: 10
                    },
                    {
                        name: "Available",
                        population: trueAvailable,
                        color: "#4CAF50",
                        legendFontColor: '#fafaf9',
                        legendFontSize: 10
                    },
                ]);
            }
            setLoading(false);
            setError(null); // Clear any previous errors on successful data update
        };

        // Cleanup function: unsubscribe from both listeners when component unmounts
        return () => {
            unsubscribeSupplies();
            unsubscribeIssuedLogs();
        };
    }, []); // Empty dependency array means this effect runs once on mount

    const chartRenderWidth = containerWidth ? containerWidth - 30 : screenWidth - 80;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1c398e" />
                <Text style={styles.loadingText}>Loading Supply Status...</Text>
            </View>
        );
    }
    // ... (rest of your component's rendering logic and styles are unchanged) ...
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
                <Text style={styles.noDataText}>No supply status data available.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <PieChart
                data={chartData}
                width={chartRenderWidth}
                height={150}
                chartConfig={chartConfig}
                accessor={"population"}
                backgroundColor={"#1c398e"}
                paddingLeft={"15"}
                center={[10, 5]}
                absolute
                hasLegend={true}
                style={{ borderRadius: 8 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
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