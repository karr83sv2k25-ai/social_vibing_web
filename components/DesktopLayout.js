// components/DesktopLayout.js
import React from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { isWeb, isDesktopOrLarger } from '../utils/webResponsive';

/**
 * Desktop three-column layout wrapper
 * Left: Profile & Wallet
 * Center: Main content (flexible)
 * Right: Communities & Suggestions
 */
export default function DesktopLayout({
    leftColumn,
    centerColumn,
    rightColumn,
    showLeftColumn = true,
    showRightColumn = true,
}) {
    // Only use desktop layout on web and desktop screens
    const useDesktopLayout = isWeb && isDesktopOrLarger();

    if (!useDesktopLayout) {
        // On mobile/tablet, just show center column (main content)
        return <>{centerColumn}</>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.desktopWrapper}>
                {/* Left Column - Profile & Wallet */}
                {showLeftColumn && (
                    <View style={styles.leftColumn}>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.columnContent}
                        >
                            {leftColumn}
                        </ScrollView>
                    </View>
                )}

                {/* Center Column - Main Feed */}
                <View style={styles.centerColumn}>
                    {centerColumn}
                </View>

                {/* Right Column - Communities & Suggestions */}
                {showRightColumn && (
                    <View style={styles.rightColumn}>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.columnContent}
                        >
                            {rightColumn}
                        </ScrollView>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    desktopWrapper: {
        flexDirection: 'row',
        flex: 1,
        maxWidth: 1800,
        alignSelf: 'center',
        width: '100%',
        justifyContent: 'center',
    },
    leftColumn: {
        width: 300,
        backgroundColor: '#0B0B0E',
        borderRightWidth: 1,
        borderRightColor: '#1F1F25',
        position: 'sticky',
        top: 0,
        height: '100vh',
        ...(Platform.OS === 'web' && {
            position: 'sticky',
            top: 0,
            overflowY: 'auto',
        }),
    },
    centerColumn: {
        flex: 1,
        backgroundColor: '#000',
        minWidth: 600,
        maxWidth: 900,
        marginHorizontal: 'auto',
    },
    rightColumn: {
        width: 320,
        backgroundColor: '#0B0B0E',
        borderLeftWidth: 1,
        borderLeftColor: '#1F1F25',
        position: 'sticky',
        top: 0,
        height: '100vh',
        ...(Platform.OS === 'web' && {
            position: 'sticky',
            top: 0,
            overflowY: 'auto',
        }),
    },
    columnContent: {
        padding: 16,
        paddingBottom: 40,
    },
});
