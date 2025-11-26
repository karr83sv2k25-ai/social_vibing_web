// TestFirestoreRulesScreen.js - Screen to test Firestore rules
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { testFirestoreRules } from './testFirestoreRules';
import { auth } from './firebaseConfig';

const ACCENT = '#7C3AED';
const BG = '#0B0B0E';
const CARD = '#17171C';
const TEXT_DIM = '#9CA3AF';
const GREEN = '#22C55E';
const RED = '#EF4444';
const YELLOW = '#F59E0B';

export default function TestFirestoreRulesScreen({ navigation }) {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState(null);

  const runTests = async () => {
    if (!auth.currentUser) {
      alert('Please login first!');
      return;
    }

    setTesting(true);
    setResults(null);

    try {
      const testResults = await testFirestoreRules();
      setResults(testResults);
    } catch (error) {
      console.error('Test error:', error);
      alert('Test failed: ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PASS': return GREEN;
      case 'FAIL': return RED;
      case 'SKIP': return YELLOW;
      default: return TEXT_DIM;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PASS': return 'checkmark-circle';
      case 'FAIL': return 'close-circle';
      case 'SKIP': return 'alert-circle';
      default: return 'help-circle';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Firestore Rules Test</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={ACCENT} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.infoTitle}>Test Security Rules</Text>
            <Text style={styles.infoText}>
              This will test if your Firestore security rules are properly deployed and working.
            </Text>
          </View>
        </View>

        {/* User Info */}
        {auth.currentUser && (
          <View style={styles.userCard}>
            <Ionicons name="person-circle" size={20} color={GREEN} />
            <Text style={styles.userText}>
              Logged in as: {auth.currentUser.email || auth.currentUser.uid}
            </Text>
          </View>
        )}

        {/* Run Test Button */}
        <TouchableOpacity
          style={[styles.testBtn, testing && styles.testBtnDisabled]}
          onPress={runTests}
          disabled={testing || !auth.currentUser}
        >
          {testing ? (
            <>
              <ActivityIndicator color="#000" size="small" />
              <Text style={styles.testBtnText}>Running Tests...</Text>
            </>
          ) : (
            <>
              <Ionicons name="play-circle" size={20} color="#000" />
              <Text style={styles.testBtnText}>Run Tests</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Results */}
        {results && (
          <View style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>Test Results</Text>
            
            {/* Summary */}
            <View style={styles.summary}>
              <View style={styles.summaryItem}>
                <Ionicons name="checkmark-circle" size={20} color={GREEN} />
                <Text style={[styles.summaryText, { color: GREEN }]}>
                  {results.passed} Passed
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="close-circle" size={20} color={RED} />
                <Text style={[styles.summaryText, { color: RED }]}>
                  {results.failed} Failed
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="alert-circle" size={20} color={YELLOW} />
                <Text style={[styles.summaryText, { color: YELLOW }]}>
                  {results.tests.filter(t => t.status === 'SKIP').length} Skipped
                </Text>
              </View>
            </View>

            {/* Individual Test Results */}
            <View style={styles.testsList}>
              {results.tests.map((test, index) => (
                <View key={index} style={styles.testItem}>
                  <Ionicons
                    name={getStatusIcon(test.status)}
                    size={18}
                    color={getStatusColor(test.status)}
                  />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.testName}>{test.name}</Text>
                    {test.count !== undefined && (
                      <Text style={styles.testDetail}>Found: {test.count} items</Text>
                    )}
                    {test.error && (
                      <Text style={styles.testError}>{test.error}</Text>
                    )}
                  </View>
                  <Text style={[styles.testStatus, { color: getStatusColor(test.status) }]}>
                    {test.status}
                  </Text>
                </View>
              ))}
            </View>

            {/* Overall Status */}
            {results.failed === 0 ? (
              <View style={[styles.statusBanner, { backgroundColor: GREEN + '22', borderColor: GREEN }]}>
                <Ionicons name="checkmark-circle" size={24} color={GREEN} />
                <Text style={[styles.statusText, { color: GREEN }]}>
                  All tests passed! Rules are working correctly.
                </Text>
              </View>
            ) : (
              <View style={[styles.statusBanner, { backgroundColor: RED + '22', borderColor: RED }]}>
                <Ionicons name="alert-circle" size={24} color={RED} />
                <Text style={[styles.statusText, { color: RED }]}>
                  Some tests failed. Check Firebase Console rules.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Help Card */}
        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>What's Being Tested:</Text>
          <Text style={styles.helpItem}>• Users collection access</Text>
          <Text style={styles.helpItem}>• Communities collection</Text>
          <Text style={styles.helpItem}>• Posts & Blogs subcollections</Text>
          <Text style={styles.helpItem}>• Conversations (private messaging)</Text>
          <Text style={styles.helpItem}>• Community chats</Text>
          <Text style={styles.helpItem}>• Audio call rooms</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F25',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#23232A',
    marginBottom: 16,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoText: {
    color: TEXT_DIM,
    fontSize: 14,
    lineHeight: 20,
  },
  userCard: {
    backgroundColor: CARD,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GREEN + '44',
    marginBottom: 16,
  },
  userText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
  },
  testBtn: {
    backgroundColor: ACCENT,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  testBtnDisabled: {
    opacity: 0.6,
  },
  testBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  resultsCard: {
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#23232A',
    marginBottom: 16,
  },
  resultsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#23232A',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  testsList: {
    marginBottom: 16,
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F25',
  },
  testName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  testDetail: {
    color: TEXT_DIM,
    fontSize: 12,
    marginTop: 2,
  },
  testError: {
    color: RED,
    fontSize: 12,
    marginTop: 2,
  },
  testStatus: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBanner: {
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  helpCard: {
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#23232A',
  },
  helpTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  helpItem: {
    color: TEXT_DIM,
    fontSize: 13,
    marginBottom: 4,
  },
});
