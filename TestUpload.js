/**
 * Test Upload Component
 * 
 * Use this to test image uploads independently
 * Run this in your app to verify the upload functionality works
 */

import React, { useState } from 'react';
import { View, Button, Image, Text, Alert, Platform } from 'react-native';
import { launchImageLibraryAsync, MediaTypeOptions } from 'expo-image-picker';
import { uploadImageToHostinger } from './hostingerConfig';

export default function TestUpload() {
    const [imageUri, setImageUri] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState(null);

    const pickImage = async () => {
        try {
            const result = await launchImageLibraryAsync({
                mediaTypes: MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const uri = result.assets[0].uri;
                console.log('✅ Image selected:', uri);
                setImageUri(uri);
                setUploadedUrl(null);
            }
        } catch (error) {
            console.error('❌ Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image: ' + error.message);
        }
    };

    const testUpload = async () => {
        if (!imageUri) {
            Alert.alert('Error', 'Please select an image first');
            return;
        }

        setUploading(true);
        try {
            console.log('🧪 Starting test upload...');
            const url = await uploadImageToHostinger(imageUri, 'test_uploads');
            console.log('✅ Upload successful!', url);
            setUploadedUrl(url);
            Alert.alert('Success!', 'Image uploaded successfully!\\n\\n' + url);
        } catch (error) {
            console.error('❌ Upload failed:', error);
            Alert.alert('Upload Failed', error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
                Test Image Upload
            </Text>

            <Text style={{ marginBottom: 10 }}>Platform: {Platform.OS}</Text>

            <Button title="1. Pick Image" onPress={pickImage} />

            {imageUri && (
                <View style={{ marginTop: 20, alignItems: 'center' }}>
                    <Text style={{ marginBottom: 10 }}>Selected Image:</Text>
                    <Image
                        source={{ uri: imageUri }}
                        style={{ width: 200, height: 200, marginBottom: 10 }}
                        resizeMode="cover"
                    />
                    <Text style={{ fontSize: 10, color: 'gray', marginBottom: 10 }}>
                        {imageUri.substring(0, 50)}...
                    </Text>

                    <Button
                        title={uploading ? 'Uploading...' : '2. Test Upload'}
                        onPress={testUpload}
                        disabled={uploading}
                    />
                </View>
            )}

            {uploadedUrl && (
                <View style={{ marginTop: 20, alignItems: 'center', backgroundColor: '#e8f5e9', padding: 15, borderRadius: 8 }}>
                    <Text style={{ fontWeight: 'bold', color: 'green', marginBottom: 10 }}>
                        ✅ Upload Successful!
                    </Text>
                    <Image
                        source={{ uri: uploadedUrl }}
                        style={{ width: 200, height: 200, marginBottom: 10 }}
                        resizeMode="cover"
                    />
                    <Text style={{ fontSize: 10, color: 'gray' }}>{uploadedUrl}</Text>
                </View>
            )}

            <View style={{ marginTop: 30, padding: 15, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
                <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Instructions:</Text>
                <Text style={{ fontSize: 12 }}>1. Click "Pick Image"</Text>
                <Text style={{ fontSize: 12 }}>2. Select an image from your library</Text>
                <Text style={{ fontSize: 12 }}>3. Click "Test Upload"</Text>
                <Text style={{ fontSize: 12 }}>4. Check console for detailed logs</Text>
                <Text style={{ fontSize: 12, marginTop: 10, fontStyle: 'italic' }}>
                    Open DevTools Console (F12) to see detailed upload logs
                </Text>
            </View>
        </View>
    );
}
