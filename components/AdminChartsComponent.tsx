import React from 'react';
import { View, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper'; // Import Title and Paragraph from react-native-paper
import PagerView from 'react-native-pager-view';

import SupplyQuantityPieChart from './charts/SupplyQuantityPieChart';
import SupplyStatusPieChart from './charts/SupplyStatusPieChart';
import PendingRequestsBarChart from './charts/PendingRequestsBarChart';
import ReturnConditionPieChart from './charts/ReturnConditionPieChart';

const screenWidth = Dimensions.get('window').width;
const horizontalPadding = 20; // Padding for the screen edges
const chartCardWidth = screenWidth - (horizontalPadding * 2); // Width for the Card component

export default function AdminChartsComponent() {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

            <PagerView style={styles.pagerView} initialPage={0}>
                {/* Chart 1: Supply Quantity Pie Chart */}
                <View style={styles.page} key="1">
                    <Card style={[styles.chartCard, { width: chartCardWidth }]}>
                        <Card.Title
                            title="Supply Quantity Breakdown"
                            subtitle="Distribution by unique supply items"
                            titleStyle={styles.cardTitle}
                            subtitleStyle={styles.cardSubtitle}
                        />
                        <Card.Content>
                            <SupplyQuantityPieChart containerWidth={chartCardWidth - ((StyleSheet.flatten(styles.cardContent).paddingHorizontal || 0) * 2)} />
                        </Card.Content>
                    </Card>
                </View>

                {/* Chart 2: Supply Status Pie Chart */}
                <View style={styles.page} key="2">
                    <Card style={[styles.chartCard, { width: chartCardWidth }]}>
                        <Card.Title
                            title="Supply Stock Status"
                            subtitle="Available vs. Issued quantities"
                            titleStyle={styles.cardTitle}
                            subtitleStyle={styles.cardSubtitle}
                        />
                        <Card.Content>
                             <SupplyStatusPieChart containerWidth={chartCardWidth - ((StyleSheet.flatten(styles.cardContent).paddingHorizontal || 0) * 2)} />
                        </Card.Content>
                    </Card>
                </View>

                {/* Chart 3: Pending Requests Bar Chart */}
                <View style={styles.page} key="3">
                    <Card style={[styles.chartCard, { width: chartCardWidth }]}>
                        <Card.Title
                            title="Pending Requests"
                            subtitle="Supply vs. Maintenance"
                            titleStyle={styles.cardTitle}
                            subtitleStyle={styles.cardSubtitle}
                        />
                        <Card.Content>
                            <PendingRequestsBarChart containerWidth={chartCardWidth - ((StyleSheet.flatten(styles.cardContent).paddingHorizontal || 0) * 2)} />
                        </Card.Content>
                    </Card>
                </View>

                {/* Chart 4: Return Condition Pie Chart */}
                <View style={styles.page} key="4">
                    <Card style={[styles.chartCard, { width: chartCardWidth }]}>
                        <Card.Title
                            title="Returned Items Condition"
                            subtitle="Breakdown by return state"
                            titleStyle={styles.cardTitle}
                            subtitleStyle={styles.cardSubtitle}
                        />
                        <Card.Content>
                            <ReturnConditionPieChart containerWidth={chartCardWidth - ((StyleSheet.flatten(styles.cardContent).paddingHorizontal || 0) * 2)} />
                        </Card.Content>
                    </Card>
                </View>
            </PagerView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight : 15,
    },
    pagerView: {
        flex: 1,
    },
    page: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: horizontalPadding,
        paddingTop: 0,
    },
    chartCard: {
        marginBottom: 20,
        elevation: 4,
        borderRadius: 10,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1c398e',
        paddingTop: 10,
        paddingHorizontal: 16,
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#666',
        paddingHorizontal: 16,
    },
    cardContent: {
        paddingVertical: 0,
        paddingHorizontal: 0,
    }
});