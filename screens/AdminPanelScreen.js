// screens/AdminPanelScreen.js - King Media Admin Panel WebView
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
const WebView = Platform.OS !== 'web' ? require('react-native-webview').WebView : null;

export default function AdminPanelScreen() {
    return (
        <View style={styles.container}>
            {Platform.OS === 'web' ? (
                <iframe
                    src="https://beige-crane-665569.hostingersite.com/admin"
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none'
                    }}
                />
            ) : (
                WebView && <WebView
                    source={{ uri: 'https://beige-crane-665569.hostingersite.com/admin' }}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={true}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
});
