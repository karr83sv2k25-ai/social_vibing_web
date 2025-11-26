/**
 * Test Screen for Firebase + Hostinger Integration
 * Use this to verify your setup is working correctly
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { testHostingerConnection } from './hostingerConfig';
import {
  updateUserProfilePicture,
  sendImageMessage,
  sendTextMessage,
  testFirebaseHostingerSetup,
} from './firebaseHostingerHelpers';
import { auth } from './firebaseConfig';

const TestIntegrationScreen = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  const addResult = (message, success = true) => {
    setResults((prev) => [...prev, { message, success, time: new Date().toLocaleTimeString() }]);
  };

  // Test 1: Connection Test
  const testConnection = async () => {
    setLoading(true);
    addResult('Testing Hostinger connection...', true);
    try {
      const isConnected = await testHostingerConnection();
      if (isConnected) {
        addResult('✅ Hostinger connection successful!', true);
      } else {
        addResult('❌ Hostinger connection failed', false);
      }
    } catch (error) {
      addResult(`❌ Error: ${error.message}`, false);
    } finally {
      setLoading(false);
    }
  };

  // Test 2: Full Setup Test
  const testFullSetup = async () => {
    setLoading(true);
    addResult('Testing Firebase + Hostinger setup...', true);
    try {
      const success = await testFirebaseHostingerSetup();
      if (success) {
        addResult('✅ Full setup test passed!', true);
      } else {
        addResult('❌ Full setup test failed', false);
      }
    } catch (error) {
      addResult(`❌ Error: ${error.message}`, false);
    } finally {
      setLoading(false);
    }
  };

  // Test 3: Image Upload Test
  const testImageUpload = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant photo library access');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        addResult('📷 Image selected, uploading...', true);

        setLoading(true);
        
        // Upload to Hostinger
        const userId = auth.currentUser?.uid || 'test_user';
        const imageUrl = await updateUserProfilePicture(userId, imageUri);
        
        addResult(`✅ Image uploaded successfully!`, true);
        addResult(`URL: ${imageUrl}`, true);
      }
    } catch (error) {
      addResult(`❌ Upload failed: ${error.message}`, false);
    } finally {
      setLoading(false);
    }
  };

  // Test 4: Text Message Test
  const testTextMessage = async () => {
    setLoading(true);
    addResult('Sending test text message...', true);
    try {
      const messageId = await sendTextMessage('test_chat_123', 'Hello from Firebase + Hostinger!');
      addResult(`✅ Text message sent! ID: ${messageId}`, true);
    } catch (error) {
      addResult(`❌ Error: ${error.message}`, false);
    } finally {
      setLoading(false);
    }
  };

  // Test 5: Image Message Test
  const testImageMessage = async () => {
    if (!selectedImage) {
      Alert.alert('No image', 'Please upload an image first (Test 3)');
      return;
    }

    setLoading(true);
    addResult('Sending test image message...', true);
    try {
      const messageId = await sendImageMessage('test_chat_123', selectedImage, 'Test image from app');
      addResult(`✅ Image message sent! ID: ${messageId}`, true);
    } catch (error) {
      addResult(`❌ Error: ${error.message}`, false);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setSelectedImage(null);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🧪 Firebase + Hostinger Test</Text>
      <Text style={styles.subtitle}>Run these tests to verify your setup</Text>

      {/* Test Buttons */}
      <View style={styles.testsContainer}>
        <TouchableOpacity
          style={styles.testButton}
          onPress={testConnection}
          disabled={loading}
        >
          <Text style={styles.buttonText}>1. Test Hostinger Connection</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testButton}
          onPress={testFullSetup}
          disabled={loading}
        >
          <Text style={styles.buttonText}>2. Test Full Setup</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testButton}
          onPress={testImageUpload}
          disabled={loading}
        >
          <Text style={styles.buttonText}>3. Test Image Upload</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testButton}
          onPress={testTextMessage}
          disabled={loading}
        >
          <Text style={styles.buttonText}>4. Test Text Message</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testButton}
          onPress={testImageMessage}
          disabled={loading && !selectedImage}
        >
          <Text style={styles.buttonText}>5. Test Image Message</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.clearButton]}
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Image Preview */}
      {selectedImage && (
        <View style={styles.imagePreview}>
          <Text style={styles.previewLabel}>Selected Image:</Text>
          <Image source={{ uri: selectedImage }} style={styles.previewImage} />
        </View>
      )}

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Testing...</Text>
        </View>
      )}

      {/* Results */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Results:</Text>
        {results.length === 0 ? (
          <Text style={styles.noResults}>No tests run yet. Click a button above to start.</Text>
        ) : (
          results.map((result, index) => (
            <View
              key={index}
              style={[
                styles.resultItem,
                { backgroundColor: result.success ? '#E8F5E9' : '#FFEBEE' },
              ]}
            >
              <Text style={styles.resultTime}>{result.time}</Text>
              <Text
                style={[
                  styles.resultText,
                  { color: result.success ? '#2E7D32' : '#C62828' },
                ]}
              >
                {result.message}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ What These Tests Do:</Text>
        <Text style={styles.infoText}>
          1. Tests if Hostinger upload API is accessible{'\n'}
          2. Tests both Firebase and Hostinger together{'\n'}
          3. Uploads an image to Hostinger and saves URL to Firebase{'\n'}
          4. Sends a text message to Firebase{'\n'}
          5. Uploads image and sends as message to Firebase
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          User: {auth.currentUser?.email || 'Not logged in'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  testsContainer: {
    marginBottom: 20,
  },
  testButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  clearButton: {
    backgroundColor: '#FF9500',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  imagePreview: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#FFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  previewImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  resultsContainer: {
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  noResults: {
    color: '#999',
    fontStyle: 'italic',
    padding: 20,
    textAlign: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
  },
  resultItem: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  resultTime: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  resultText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#0D47A1',
    lineHeight: 20,
  },
  footer: {
    padding: 15,
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 30,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default TestIntegrationScreen;
