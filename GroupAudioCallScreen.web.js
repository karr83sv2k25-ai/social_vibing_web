import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';

/**
 * Web fallback for GroupAudioCallScreen
 * Agora native SDK is not available on web
 */
export default function GroupAudioCallScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.icon}>🎙️</Text>
                <Text style={styles.title}>Voice Chat Not Available</Text>
                <Text style={styles.message}>
                    Voice chat is only available on mobile apps.
                </Text>
                <Text style={styles.submessage}>
                    Please download our iOS or Android app to use this feature.
                </Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.buttonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 40,
        maxWidth: 400,
    },
    icon: {
        fontSize: 80,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 16,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#CCC',
        marginBottom: 8,
        textAlign: 'center',
        lineHeight: 24,
    },
    submessage: {
        fontSize: 14,
        color: '#999',
        marginBottom: 32,
        textAlign: 'center',
        lineHeight: 20,
    },
    button: {
        backgroundColor: '#BF2EF0',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
