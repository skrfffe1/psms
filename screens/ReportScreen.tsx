// screens/ReportsScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList, Alert } from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Picker } from '@react-native-picker/picker';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config'; // Adjust path to your Firebase config
import { format } from 'date-fns'; // For date formatting, install if not present: npm install date-fns

// Define report types and their corresponding Firestore collection
const REPORT_TYPES = [
    { label: 'Select Report Type', value: '' },
    { label: 'Issuance Logs', value: 'issuanceLogs' },
    { label: 'Supply Requests', value: 'requests' },
    { label: 'Maintenance Requests', value: 'maintenanceRequests' },
    // Add more report types as needed
];

// Define a type for report items for better clarity
interface ReportItem {
    id: string;
    [key: string]: any; // Allows for any other properties
}

export default function ReportsScreen() {
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');
    const [currentDatePickerField, setCurrentDatePickerField] = useState<'start' | 'end' | null>(null);

    const [reportType, setReportType] = useState<string>(REPORT_TYPES[0].value);
    const [reportResults, setReportResults] = useState<ReportItem[]>([]);
    const [loadingReport, setLoadingReport] = useState(false);
    const [reportError, setReportError] = useState<string | null>(null);

    const handleDateConfirm = (date: Date) => {
        if (currentDatePickerField === 'start') {
            setStartDate(date);
        } else if (currentDatePickerField === 'end') {
            setEndDate(date);
        }
        setShowDatePicker(false);
    };

    const showPicker = (field: 'start' | 'end') => {
        setCurrentDatePickerField(field);
        setShowDatePicker(true);
    };

    const hidePicker = () => {
        setShowDatePicker(false);
    };

    const generateReport = useCallback(async () => {
        if (!reportType) {
            Alert.alert("Selection Required", "Please select a report type.");
            return;
        }
        if (!startDate || !endDate) {
            Alert.alert("Date Range Required", "Please select both a start and end date.");
            return;
        }
        if (startDate > endDate) {
            Alert.alert("Invalid Date Range", "Start date cannot be after end date.");
            return;
        }

        setLoadingReport(true);
        setReportError(null);
        setReportResults([]); // Clear previous results

        try {
            const collectionRef = collection(db, reportType);
            let q = query(collectionRef);

            // Add date range filtering
            // Assuming 'createdAt' field for all report types for filtering
            q = query(q, where('createdAt', '>=', Timestamp.fromDate(startDate)), where('createdAt', '<=', Timestamp.fromDate(endDate)));

            const querySnapshot = await getDocs(q);
            const results: ReportItem[] = [];
            querySnapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });

            setReportResults(results);
            if (results.length === 0) {
                Alert.alert("No Data", "No records found for the selected criteria.");
            }
        } catch (err: any) {
            console.error("Error generating report:", err);
            setReportError(`Failed to generate report: ${err.message}`);
        } finally {
            setLoadingReport(false);
        }
    }, [reportType, startDate, endDate]);

    const renderReportItem = ({ item }: { item: ReportItem }) => (
        <View style={styles.reportItem}>
            <Text style={styles.reportItemId}>ID: {item.id}</Text>
            {/* Display relevant fields based on report type - this is a generic example */}
            {reportType === 'issuanceLogs' && (
                <>
                    <Text>Supply: {item.supplyName} (Qty: {item.quantity})</Text>
                    <Text>Requester: {item.requesterFirstName} {item.requesterLastName}</Text>
                    <Text>Issued: {item.issuedAt ? format(item.issuedAt.toDate(), 'PPP') : 'N/A'}</Text>
                    <Text>Returned: {item.returnedAt ? format(item.returnedAt.toDate(), 'PPP') : 'Not Returned'}</Text>
                    {item.returnCondition && <Text>Condition: {item.returnCondition}</Text>}
                </>
            )}
            {reportType === 'requests' && (
                <>
                    <Text>Supply: {item.supplyName} (Qty: {item.quantity})</Text>
                    <Text>Requester: {item.requesterFirstName} {item.requesterLastName}</Text>
                    <Text>Status: {item.status}</Text>
                    <Text>Reason: {item.reason}</Text>
                    <Text>Requested: {item.createdAt ? format(item.createdAt.toDate(), 'PPP') : 'N/A'}</Text>
                </>
            )}
            {reportType === 'maintenanceRequests' && (
                <>
                    <Text>Supply: {item.supplyName}</Text>
                    <Text>Requester: {item.requesterFirstName} {item.requesterLastName}</Text>
                    <Text>Status: {item.status}</Text>
                    <Text>Reason: {item.reason}</Text>
                    <Text>Request Date: {item.requestDate ? format(item.requestDate.toDate(), 'PPP') : 'N/A'}</Text>
                </>
            )}
            {/* Fallback for unknown report types or if specific fields are missing */}
            {Object.keys(item).length <= 1 && <Text>No specific details to display.</Text>}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Generate Reports</Text>
            </View>

            <View style={styles.controlsContainer}>
                {/* Report Type Picker */}
                <Text style={styles.label}>Report Type:</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={reportType}
                        onValueChange={(itemValue) => setReportType(itemValue)}
                        style={styles.picker}
                    >
                        {REPORT_TYPES.map((type) => (
                            <Picker.Item key={type.value} label={type.label} value={type.value} />
                        ))}
                    </Picker>
                </View>

                {/* Date Range Selection */}
                <Text style={styles.label}>Date Range:</Text>
                <View style={styles.datePickerRow}>
                    <TouchableOpacity style={styles.datePickerButton} onPress={() => showPicker('start')}>
                        <Text style={styles.datePickerButtonText}>
                            {startDate ? format(startDate, 'MMM dd, yyyy') : 'Start Date'}
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.dateRangeSeparator}> to </Text>
                    <TouchableOpacity style={styles.datePickerButton} onPress={() => showPicker('end')}>
                        <Text style={styles.datePickerButtonText}>
                            {endDate ? format(endDate, 'MMM dd, yyyy') : 'End Date'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Generate Report Button */}
                <TouchableOpacity
                    style={styles.generateButton}
                    onPress={generateReport}
                    disabled={loadingReport}
                >
                    {loadingReport ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.generateButtonText}>Generate Report</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Report Results Display */}
            {reportError && <Text style={styles.errorText}>{reportError}</Text>}
            {reportResults.length > 0 && (
                <FlatList
                    data={reportResults}
                    keyExtractor={(item) => item.id}
                    renderItem={renderReportItem}
                    contentContainerStyle={styles.reportListContent}
                    ListHeaderComponent={() => (
                        <Text style={styles.resultsHeader}>Report Results ({reportResults.length} items)</Text>
                    )}
                />
            )}
            {reportResults.length === 0 && !loadingReport && !reportError && reportType !== '' && (
                <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsText}>No report generated yet or no data found.</Text>
                </View>
            )}

            {/* Date Picker Modal */}
            <DateTimePickerModal
                isVisible={showDatePicker}
                mode={datePickerMode}
                onConfirm={handleDateConfirm}
                onCancel={hidePicker}
                date={currentDatePickerField === 'start' && startDate ? startDate : (currentDatePickerField === 'end' && endDate ? endDate : new Date())}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 10, // Consistent horizontal padding
        paddingBottom: 20, // Space at the bottom
    },
    header: {
        backgroundColor: '#f0f0f0', // Lighter header for sub-screen
        padding: 15,
        marginBottom: 10,
        borderRadius: 10,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    controlsContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 10,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginBottom: 15,
        overflow: 'hidden', // Ensures picker stays within rounded border
    },
    picker: {
        height: 50,
        width: '100%',
    },
    datePickerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    datePickerButton: {
        flex: 1,
        backgroundColor: '#e0e0e0',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    datePickerButtonText: {
        fontSize: 15,
        color: '#333',
    },
    dateRangeSeparator: {
        fontSize: 16,
        color: '#555',
        marginHorizontal: 5,
    },
    generateButton: {
        backgroundColor: '#1c398e',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    generateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginTop: 10,
        fontSize: 14,
    },
    resultsHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
        marginBottom: 10,
        textAlign: 'center',
    },
    reportListContent: {
        paddingBottom: 20, // Ensure scrollability
    },
    reportItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 15,
        marginVertical: 5,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
    },
    reportItemId: {
        fontSize: 12,
        color: '#888',
        marginBottom: 5,
        fontStyle: 'italic',
    },
    noResultsContainer: {
        marginTop: 20,
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 10,
        marginHorizontal: 5,
    },
    noResultsText: {
        fontSize: 16,
        color: '#888',
    },
});