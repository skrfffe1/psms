// screens/ReportsScreen.tsx
import React, { useState, useEffect, useCallback, memo } from 'react'; // Import memo
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Picker } from '@react-native-picker/picker';
import { collection, query, where, getDocs, Timestamp, getDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { format } from 'date-fns';
import { getAuth } from 'firebase/auth';

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const REPORT_TYPES = [
  { label: 'Select Report Type', value: '' },
  { label: 'Issuance Logs', value: 'issuanceLogs' },
  { label: 'Supply Requests', value: 'requests' },
  { label: 'Maintenance Requests', value: 'maintenanceRequests' },
];

interface ReportItem {
  id: string;
  supplyName?: string;
  quantity?: number;
  requesterFirstName?: string;
  requesterLastName?: string;
  status?: string;
  reason?: string;
  returnCondition?: string;
  issuedAt?: Timestamp;
  returnedAt?: Timestamp;
  createdAt?: Timestamp;
  requestDate?: Timestamp;
  [key: string]: any;
}

// --- NEW: Memoized Report Item Component ---
interface ReportItemProps {
  item: ReportItem;
  reportType: string; // Pass reportType as a prop
}

const ReportItemComponent: React.FC<ReportItemProps> = memo(({ item, reportType }) => {
  return (
    <View style={styles.reportItem}>
      <Text style={styles.reportItemId}>ID: {item.id}</Text>
      {reportType === 'issuanceLogs' && (
        <>
          <Text>Supply: {item.supplyName} (Qty: {item.quantity})</Text>
          <Text>Requester: {item.requesterFirstName} {item.requesterLastName}</Text>
          <Text>Issued: {item.issuedAt ? format(item.issuedAt.toDate(), 'MMM dd,yyyy') : 'N/A'}</Text>
          <Text>Returned: {item.returnedAt ? format(item.returnedAt.toDate(), 'MMM dd,yyyy') : 'Not Returned'}</Text>
          {item.returnCondition && <Text>Condition: {item.returnCondition}</Text>}
        </>
      )}
      {reportType === 'requests' && (
        <>
          <Text>Supply: {item.supplyName} (Qty: {item.quantity})</Text>
          <Text>Requester: {item.requesterFirstName} {item.requesterLastName}</Text>
          <Text>Status: {item.status}</Text>
          <Text>Reason: {item.reason}</Text>
          <Text>Requested: {item.createdAt ? format(item.createdAt.toDate(), 'MMM dd,yyyy') : 'N/A'}</Text>
        </>
      )}
      {reportType === 'maintenanceRequests' && (
        <>
          <Text>Supply: {item.supplyName}</Text>
          <Text>Requester: {item.requesterFirstName} {item.requesterLastName}</Text>
          <Text>Status: {item.status}</Text>
          <Text>Reason: {item.reason}</Text>
          <Text>Request Date: {item.requestDate ? format(item.requestDate.toDate(), 'MMM dd,yyyy') : 'N/A'}</Text>
        </>
      )}
      {Object.keys(item).filter(key => key !== 'id' && item[key] !== undefined).length === 0 && <Text>No specific details to display.</Text>}
    </View>
  );
});

// --- Main ReportsScreen Component ---
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
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const auth = getAuth();

  // --- Fetch User Role on Component Mount ---
  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setCurrentUserRole(userDocSnap.data().role);
          } else {
            console.warn('User document not found for UID:', user.uid);
            setCurrentUserRole(null);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setCurrentUserRole(null);
        }
      } else {
        setCurrentUserRole(null);
      }
    };
    fetchUserRole();
  }, [auth]);

  // --- Date Picker Handlers ---
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

  // --- Report Generation (Display) ---
  const generateReport = useCallback(async () => {
    if (!reportType) {
      Alert.alert('Selection Required', 'Please select a report type.');
      return;
    }
    if (!startDate || !endDate) {
      Alert.alert('Date Range Required', 'Please select both a start and end date.');
      return;
    }
    if (startDate > endDate) {
      Alert.alert('Invalid Date Range', 'Start date cannot be after end date.');
      return;
    }

    setLoadingReport(true);
    setReportError(null);
    setReportResults([]);

    const user = auth.currentUser;
    if (!user) {
      setReportError('No authenticated user found. Please log in.');
      setLoadingReport(false);
      return;
    }

    try {
      const collectionRef = collection(db, reportType);
      let q = query(collectionRef);

      let dateFieldName: string;
      switch (reportType) {
        case 'issuanceLogs':
          dateFieldName = 'issuedAt';
          break;
        case 'requests':
          dateFieldName = 'createdAt';
          break;
        case 'maintenanceRequests':
          dateFieldName = 'requestDate';
          break;
        default:
          dateFieldName = 'createdAt'; // Fallback
      }

      q = query(
        q,
        where(dateFieldName, '>=', Timestamp.fromDate(startDate)),
        where(dateFieldName, '<=', Timestamp.fromDate(endDate))
      );

      if (currentUserRole === 'staff') {
        q = query(q, where('requester', '==', user.uid));
      }

      const querySnapshot = await getDocs(q);
      const results: ReportItem[] = [];
      querySnapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() });
      });

      setReportResults(results);
      if (results.length === 0) {
        Alert.alert('No Data', 'No records found for the selected criteria.');
      }
    } catch (err: any) {
      console.error('Error generating report for display:', err);
      if (err.code === 'permission-denied') {
        setReportError(
          'Permission denied. You do not have the necessary access to view this report type or data.'
        );
      } else {
        setReportError(`Failed to generate report for display: ${err.message}`);
      }
    } finally {
      setLoadingReport(false);
    }
  }, [reportType, startDate, endDate, currentUserRole, auth]);

  // Helper to escape values for CSV
  const escapeCsvValue = (value: any) => {
    if (value === null || typeof value === 'undefined') {
      return '';
    }
    let stringValue = String(value);
    // If the string contains a comma, double quote, or newline,
    // enclose it in double quotes and escape internal double quotes.
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const handleDownloadCsv = async () => {
    if (reportResults.length === 0) {
      Alert.alert('No Data to Download', 'Please generate a report first to see if there is data to download.');
      return;
    }
    if (downloadingCsv) return;

    setDownloadingCsv(true);
    setReportError(null);

    try {
      let csvContent = '';
      let headers: string[] = [];
      let dataKeys: string[] = []; // Keys to extract from each report item

      // Define headers and data keys based on report type
      if (reportType === 'issuanceLogs') {
        headers = ['ID', 'Supply Name', 'Quantity', 'Requester First Name', 'Requester Last Name', 'Issued At', 'Returned At', 'Return Condition'];
        dataKeys = ['id', 'supplyName', 'quantity', 'requesterFirstName', 'requesterLastName', 'issuedAt', 'returnedAt', 'returnCondition'];
      } else if (reportType === 'requests') {
        headers = ['ID', 'Supply Name', 'Quantity', 'Requester First Name', 'Requester Last Name', 'Status', 'Reason', 'Created At'];
        dataKeys = ['id', 'supplyName', 'quantity', 'requesterFirstName', 'requesterLastName', 'status', 'reason', 'createdAt'];
      } else if (reportType === 'maintenanceRequests') {
        headers = ['ID', 'Supply Name', 'Requester First Name', 'Requester Last Name', 'Status', 'Reason', 'Request Date'];
        dataKeys = ['id', 'supplyName', 'requesterFirstName', 'requesterLastName', 'status', 'reason', 'requestDate'];
      } else {
        // Fallback: Use all keys from the first item as headers
        // This might not be ideal if items have different keys
        // Filter out undefined/null items from dataKeys to avoid issues
        const firstItem = reportResults[0];
        if (firstItem) {
            dataKeys = Object.keys(firstItem).filter(key => firstItem[key] !== undefined && key !== 'id');
            headers = dataKeys.map(key => key.replace(/([A-Z])/g, ' $1').trim());
            headers.unshift('ID'); // Add ID to the beginning
            dataKeys.unshift('id'); // Add 'id' to the beginning of dataKeys
        } else {
            Alert.alert("Error", "No data available to determine CSV structure.");
            setDownloadingCsv(false);
            return;
        }
      }

      // Add headers to CSV content
      csvContent += headers.map(escapeCsvValue).join(',') + '\n';

      // Add data rows
      reportResults.forEach(item => {
        const row = dataKeys.map(key => {
          let value = item[key];
          if (value instanceof Timestamp) {
            value = format(value.toDate(), 'MMM dd,yyyy HH:mm');
          }
          return escapeCsvValue(value);
        }).join(',');
        csvContent += row + '\n';
      });

      const fileName = `${reportType}_Report_${format(startDate!, 'yyyyMMdd')}_to_${format(endDate!, 'yyyyMMdd')}.csv`;
      const fileUri = FileSystem.cacheDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Sharing not available', 'Sharing files is not supported on this device.');
        return;
      }

      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', UTI: 'public.csv' });

    } catch (err: any) {
      console.error('Error downloading CSV report:', err);
      setReportError(`Failed to download report: ${err.message}`);
      Alert.alert('Download Failed', `Could not download report: ${err.message}`);
    } finally {
      setDownloadingCsv(false);
    }
  };

  // --- renderItem function for FlatList ---
  // Memoize the render function itself using useCallback
  const renderItem = useCallback(({ item }: { item: ReportItem }) => (
    <ReportItemComponent item={item} reportType={reportType} />
  ), [reportType]); // Only re-create if reportType changes

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Generate Reports</Text>
      </View>

      <View style={styles.controlsContainer}>
        <Text style={styles.label}>Report Type:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={reportType}
            onValueChange={itemValue => setReportType(itemValue)}
            style={styles.picker}
          >
            {REPORT_TYPES.map(type => (
              <Picker.Item key={type.value} label={type.label} value={type.value} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Date Range:</Text>
        <View style={styles.datePickerRow}>
          <TouchableOpacity style={styles.datePickerButton} onPress={() => showPicker('start')}>
            <Text style={styles.datePickerButtonText}>
              {startDate ? format(startDate, 'MMM dd,yyyy') : 'Start Date'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.dateRangeSeparator}> to </Text>
          <TouchableOpacity style={styles.datePickerButton} onPress={() => showPicker('end')}>
            <Text style={styles.datePickerButtonText}>
              {endDate ? format(endDate, 'MMM dd,yyyy') : 'End Date'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.generateButton}
          onPress={generateReport}
          disabled={loadingReport || currentUserRole === null}
        >
          {loadingReport ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>Generate Report</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.generateButton, styles.downloadCsvButton]}
          onPress={handleDownloadCsv}
          disabled={downloadingCsv || reportResults.length === 0 || currentUserRole === null}
        >
          {downloadingCsv ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>Download as CSV</Text>
          )}
        </TouchableOpacity>
      </View>

      {reportError && <Text style={styles.errorText}>{reportError}</Text>}
      {loadingReport && (
        <View style={styles.centeredMessage}>
          <ActivityIndicator size="large" color="#1c398e" />
          <Text style={styles.loadingText}>Loading reports</Text>
        </View>
      )}
      {!loadingReport && reportResults.length > 0 && (
        <FlatList
          data={reportResults}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.reportListContent}
          initialNumToRender={10} // Render more items initially
          maxToRenderPerBatch={5} // Process items in smaller batches
          windowSize={21} // Maintain a larger render window
          ListHeaderComponent={() => (
            <Text style={styles.resultsHeader}>Report Results ({reportResults.length} items)</Text>
          )}
        />
      )}
      {!loadingReport && reportResults.length === 0 && !reportError && reportType !== '' && (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>
            No report generated yet or no data found for the selected criteria.
          </Text>
        </View>
      )}

      <DateTimePickerModal
        isVisible={showDatePicker}
        mode={datePickerMode}
        onConfirm={handleDateConfirm}
        onCancel={hidePicker}
        date={
          currentDatePickerField === 'start' && startDate
            ? startDate
            : currentDatePickerField === 'end' && endDate
            ? endDate
            : new Date()
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: StatusBar.currentHeight,
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#f0f0f0',
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
    overflow: 'hidden',
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
  downloadCsvButton: {
    backgroundColor: '#007bff',
    marginTop: 15,
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
    paddingBottom: 20,
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
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});