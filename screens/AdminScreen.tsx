import { StyleSheet, View } from 'react-native'
import SupplyQuantityPieChart from '@/components/SupplyQuantityPieChart'
import SupplyStatusPieChart from '@/components/SupplyStatusPieChart'
import PendingRequestsBarChart from '@/components/PendingRequestsBarChart';
import { Card } from 'react-native-paper'
import React from 'react'

export default function AdminScreen() {
  return (
    <View style={{ flex: 1, padding: 10 }}>
      <Card style={{ padding: 10, marginBottom: 20, width: '90%', borderRadius: 0 }}>
        <SupplyQuantityPieChart />
      </Card>
      <Card style={{ padding: 10, marginBottom: 20, width: '90%', borderRadius: 0 }}>
        <SupplyStatusPieChart />
      </Card>
      <Card style={{ padding: 10, marginBottom: 20, width: '90%', borderRadius: 0 }}>
        <PendingRequestsBarChart />
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({})