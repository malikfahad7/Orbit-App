import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DropDownPicker from 'react-native-dropdown-picker';
import MongoDatabase from '../services/mongodb';
import { BarChart } from 'react-native-chart-kit';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

const StatsScreen = () => {
  const [reportsSubmitted, setReportsSubmitted] = useState(0);
  const [averageResponseTime, setAverageResponseTime] = useState(0); // In minutes
  const [casesInProgress, setCasesInProgress] = useState(0);
  const [casesCompleted, setCasesCompleted] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: 'All', value: 'All' },
    { label: 'Last Month', value: 'Last Month' },
    { label: 'Last 3 Months', value: 'Last 3 Months' },
  ]);

  const loadStats = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const userEmail = await AsyncStorage.getItem('userEmail');
      console.log('Step 1 - Retrieved user email from AsyncStorage:', userEmail);
      if (!userEmail) {
        throw new Error('User email not found in AsyncStorage. Please log in again.');
      }

      const userId = await MongoDatabase.getUserId(userEmail);
      console.log('Step 2 - Fetched user ID:', userId);
      if (!userId) {
        throw new Error('User ID not found for email: ' + userEmail);
      }

      // Fetch stats from floormanagerstats collection
      const stats = await MongoDatabase.getFloorManagerStats(userId);
      console.log('Step 3 - Fetched floor manager stats:', JSON.stringify(stats, null, 2));
      
      // Fetch reports count with the selected filter
      const reportsCount = await MongoDatabase.getReportsCountByUserId(userId, selectedFilter);
      console.log('Step 4 - Fetched reports count with filter:', reportsCount);

      if (!stats) {
        setReportsSubmitted(0);
        setAverageResponseTime(0);
        setCasesInProgress(0);
        setCasesCompleted(0);
        setErrorMessage('No stats yet. Submit a report to generate stats.');
      } else {
        setReportsSubmitted(reportsCount);
        setAverageResponseTime(stats.averageResponseTime || 0);
        setCasesInProgress(stats.numberOfCasesInProgress || 0);
        setCasesCompleted(stats.numberOfCasesCompleted || 0);
        if (reportsCount === 0) {
          setErrorMessage('No reports submitted for this floor and time range.');
        } else {
          setErrorMessage('');
        }
      }
    } catch (e) {
      console.error('Error loading stats:', e.message);
      if (e.message.includes('Failed to fetch')) {
        setErrorMessage('Unable to load stats. Please check your network connection and try again.');
      } else {
        setErrorMessage('Failed to load stats: ' + e.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [selectedFilter]);

  // Stat block for displaying stats
  const renderStatBlock = (title, value, unit = '') => {
    return (
      <View style={styles.statBlock}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>
          {value} {unit}
        </Text>
      </View>
    );
  };

  // Bar chart for visualizing stats
  const renderStatsChart = () => {
    const scaledAvgResponseTime = averageResponseTime / 60; // Convert minutes to hours for better scaling
    const data = {
      labels: ['Reports', 'Avg Resp Time', 'In Progress', 'Completed'],
      datasets: [
        {
          data: [reportsSubmitted, scaledAvgResponseTime, casesInProgress, casesCompleted],
        },
      ],
    };

    const chartConfig = {
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      decimalPlaces: 1,
      color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`, // Modern blue
      fillShadowGradient: '#007AFF',
      fillShadowGradientOpacity: 0.8,
      labelColor: (opacity = 1) => `rgba(33, 33, 33, ${opacity})`,
      propsForLabels: {
        fontSize: 12,
        fontWeight: '600',
        rotation: 45,
        translateY: 10,
        translateX: 5,
      },
      propsForBackgroundLines: {
        strokeDashArray: [4, 4],
        stroke: '#e0e0e0',
      },
      propsForBars: {
        strokeWidth: 1,
        stroke: '#ffffff',
      },
      barRadius: 5,
      barPercentage: 0.8, // Increase thickness of bars
    };

    return (
      <View style={styles.chartContainer}>
        <BarChart
          data={data}
          width={width * 0.9}
          height={height * 0.45} // Increased chart height
          chartConfig={chartConfig}
          style={styles.chart}
          fromZero={true}
          showValuesOnTopOfBars={true}
          withInnerLines={true}
        />
        <Text style={styles.chartNote}>Avg Response Time in hours</Text>
      </View>
    );
  };

  // Data for FlatList
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      );
    }

    if (errorMessage) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      );
    }

    return [
      { id: 'chart', content: renderStatsChart() },
      {
        id: 'stats',
        content: (
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              {renderStatBlock('Reports Submitted', reportsSubmitted)}
              {renderStatBlock('Avg Response Time', averageResponseTime, 'min')}
            </View>
            <View style={styles.statsRow}>
              {renderStatBlock('Cases In Progress', casesInProgress)}
              {renderStatBlock('Cases Completed', casesCompleted)}
            </View>
          </View>
        ),
      },
    ];
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.filterContainer}>
          <DropDownPicker
            open={open}
            value={selectedFilter}
            items={items}
            setOpen={setOpen}
            setValue={setSelectedFilter}
            setItems={setItems}
            style={styles.dropdown}
            containerStyle={styles.dropdownContainer}
            dropDownContainerStyle={styles.dropDownContainerStyle}
            textStyle={styles.dropdownText}
            zIndex={3000}
            zIndexInverse={1000}
          />
        </View>
        <FlatList
          data={renderContent()}
          renderItem={({ item }) => item.content}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.scrollContent}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffff',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  container: {
    padding: 10,
    borderRadius: 12,
    shadowColor: '#000',
    elevation: 7,
    margin: 5,
    flex: 1,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'System',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
    zIndex: 3000,
  },
  dropdownContainer: {
    width: width * 0.35,
    zIndex: 3000,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  dropDownContainerStyle: {
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: height * 0.5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: height * 0.5,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    fontWeight: '500',
  },
  statsContainer: {
    marginTop: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statBlock: {
    width: width * 0.42,
    padding: 15,
    backgroundColor: '#f0f4f8',
    borderRadius: 10,
    alignItems: 'center',

    elevation: 2,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    textAlign: 'center',
    marginBottom: 5,
    fontFamily: 'System',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#ffffff',
    elevation: 4,
    marginBottom: 20,
  },
  chart: {
    borderRadius: 12,
    borderWidth: 0,
  },
  chartNote: {
    fontSize: 12,
    color: '#757575',
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default StatsScreen;