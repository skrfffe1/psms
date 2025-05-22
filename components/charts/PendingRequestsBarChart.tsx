// components/charts/PendingRequestsBarChart.tsx
import { StyleSheet, Text, View, Dimensions, ActivityIndicator } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config'; // Adjust path to your Firebase config

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
    backgroundGradientFrom: "#1c398e",
    backgroundGradientFromOpacity: 1,
    backgroundGradientTo: "#08130D",
    backgroundGradientToOpacity: 0.8,
    color: (opacity = 1) => `rgba(230, 172, 0, ${opacity})`, // Bar color
    barPercentage: 1.5, // Width of the bars
    decimalPlaces: 0, // No decimal places for counts
    propsForBackground: {
        fill: '#1c398e', // Background color of the chart
    },

};

interface PendingRequestsBarChartProps {
    containerWidth?: number;
}

export default function PendingRequestsBarChart({ containerWidth }: PendingRequestsBarChartProps) {
    const [supplyPendingCount, setSupplyPendingCount] = useState(0);
    const [maintenancePendingCount, setMaintenancePendingCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasData, setHasData] = useState(false);

    useEffect(() => {
        setLoading(true);
        setError(null);

        // Listener for pending supply requests
        const requestsQuery = query(
            collection(db, 'requests'),
            where('status', '==', 'pending')
        );

        const unsubscribeRequests = onSnapshot(requestsQuery, (querySnapshot) => {
            const count = querySnapshot.size;
            setSupplyPendingCount(count);
            // Update chart data after both listeners have fired their initial data
            if (!loading) updateChartDisplay(count, maintenancePendingCount);
        }, (err) => {
            console.error("Error fetching pending supply requests in real-time:", err);
            setError("Failed to load pending supply requests.");
            setLoading(false);
        });

        // Listener for pending maintenance requests
        const maintenanceRequestsQuery = query(
            collection(db, 'maintenanceRequests'),
            where('status', '==', 'pending')
        );

        const unsubscribeMaintenance = onSnapshot(maintenanceRequestsQuery, (querySnapshot) => {
            const count = querySnapshot.size;
            setMaintenancePendingCount(count);
            // Update chart data after both listeners have fired their initial data
            if (!loading) updateChartDisplay(supplyPendingCount, count);
        }, (err) => {
            console.error("Error fetching pending maintenance requests in real-time:", err);
            setError("Failed to load pending maintenance requests.");
            setLoading(false);
        });

        // Helper function to update the display state
        const updateChartDisplay = (supplyCount: number, maintenanceCount: number) => {
            if (supplyCount > 0 || maintenanceCount > 0) {
                setHasData(true);
            } else {
                setHasData(false);
            }
            setLoading(false); // Both listeners should have fired at least once
            setError(null); // Clear any previous errors on successful data update
        };

        // Initial check in case listeners are slow to update state
        // This makes sure loading state is resolved once initial data is received
        // or if both listeners have returned errors.
        Promise.all([
            new Promise<void>((resolve, reject) => {
                const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
                    setSupplyPendingCount(snapshot.size);
                    unsubscribe();
                    resolve();
                }, (error) => { reject(error); });
            }),
            new Promise<void>((resolve, reject) => {
                const unsubscribe = onSnapshot(maintenanceRequestsQuery, (snapshot) => {
                    setMaintenancePendingCount(snapshot.size);
                    unsubscribe();
                    resolve();
                }, (error) => { reject(error); });
            }),
        ]).then(() => {
            setLoading(false);
            updateChartDisplay(supplyPendingCount, maintenancePendingCount);
        }).catch((err) => {
            setError("Failed to load all pending requests.");
            setLoading(false);
            console.error("Initial load error for pending requests:", err);
        });


        // Cleanup function for both listeners
        return () => {
            unsubscribeRequests();
            unsubscribeMaintenance();
        };
    }, []); // Empty dependency array means this effect runs once on mount

    const chartData = {
        labels: ["Supply", "Maintenance"],
        datasets: [
            {
                data: [supplyPendingCount, maintenancePendingCount],
                colors: [
                    (opacity = 1) => `rgba(255, 99, 132, ${opacity})`, // Red for Supply
                    (opacity = 1) => `rgba(255, 206, 86, ${opacity})`, // Yellow for Maintenance
                    
                ],
            },
        ],
    };

    const chartRenderWidth = containerWidth ? containerWidth - 30 : screenWidth - 80;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1c398e" />
                <Text style={styles.loadingText}>Loading Pending Requests...</Text>
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

    if (!hasData && supplyPendingCount === 0 && maintenancePendingCount === 0) {
        return (
            <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No pending requests.</Text>
            </View>
        );
    }

    return (
        <View>
            <BarChart
                data={chartData}
                width={chartRenderWidth }
                height={150}
                chartConfig={chartConfig}
                verticalLabelRotation={0} // Keep labels horizontal
                fromZero={true} // Ensure y-axis starts from zero
                showValuesOnTopOfBars={true} // Display actual values on bars
                yAxisLabel=""
                yAxisSuffix=""
                style={styles.chart}
            />
        </View>
    );
}

const styles = StyleSheet.create({

    loadingContainer: {
        minHeight: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#555',
        fontSize: 12,
    },
    errorContainer: {
        minHeight: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        fontSize: 14,
    },
    noDataContainer: {
        minHeight: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noDataText: {
        color: '#888',
        textAlign: 'center',
        fontSize: 14,
    },
    chart: {
        borderRadius: 8,
    },
});