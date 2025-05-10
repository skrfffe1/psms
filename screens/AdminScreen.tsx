import React from 'react';
import { ScrollView, StyleSheet, View, Dimensions } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function dashboard() {
  // Sample data
  const totalSupplies = 120;
  const pendingRequests = 30;
  const fulfilledRequests = 75;

  const chartData = {
    labels: ['Pens', 'Books', 'Notebooks', 'Staplers', 'Folders'],
    datasets: [
      {
        data: [40, 80, 65, 20, 35],
      },
    ],
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">📦 Total Supplies</Text>
          <Text variant="displaySmall" style={styles.statValue}>{totalSupplies}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">📊 Requests Overview</Text>
          <View style={styles.row}>
            <View style={styles.statBox}>
              <Text variant="titleMedium">Pending</Text>
              <Text variant="headlineLarge">{pendingRequests}</Text>
            </View>
            <View style={styles.statBox}>
              <Text variant="titleMedium">Fulfilled</Text>
              <Text variant="headlineLarge">{fulfilledRequests}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={{ marginBottom: 12 }}>📈 Supply Distribution</Text>
          <BarChart
            data={chartData}
            width={screenWidth - 64}
            height={220}
            fromZero
            chartConfig={{
              backgroundGradientFrom: '#222831',
              backgroundGradientTo: '#222831',
              color: (opacity = 1) => `rgba(0, 230, 118, ${opacity})`,
              labelColor: () => '#fff',
              propsForBackgroundLines: {
                stroke: '#444',
              },
            }}
            verticalLabelRotation={15}
            style={{ borderRadius: 10 }}
          />
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 16,
    backgroundColor: '#222831',
  },
  card: {
    backgroundColor: '#393E46',
    marginBottom: 20,
    borderRadius: 12,
    elevation: 6,
    padding: 4,
  },
  statValue: {
    color: '#00E676',
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statBox: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: '#2e343e',
    borderRadius: 8,
    paddingVertical: 12,
  },
});
