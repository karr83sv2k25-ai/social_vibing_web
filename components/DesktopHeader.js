// components/DesktopHeader.js
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StatusBadge from './StatusBadge';

export default function DesktopHeader({
    userProfile,
    onSearchPress,
    onNotificationsPress,
    onSettingsPress,
    onProfilePress,
    navigation
}) {
    const currentRoute = navigation?.getCurrentRoute?.()?.name || 'Home';

    return (
        <View style={styles.header}>
            {/* Left - Logo/Brand */}
            <TouchableOpacity style={styles.logoSection} onPress={() => navigation?.navigate('Home')}>
                <Text style={styles.logo}>Social Vibing</Text>
            </TouchableOpacity>

            {/* Center - Navigation + Search */}
            <View style={styles.centerSection}>
                {/* Navigation Icons */}
                <View style={styles.navSection}>
                    <TouchableOpacity
                        style={[styles.navButton, currentRoute === 'Home' && styles.navButtonActive]}
                        onPress={() => navigation?.navigate('Home')}
                    >
                        <Ionicons
                            name={currentRoute === 'Home' ? 'home' : 'home-outline'}
                            size={24}
                            color={currentRoute === 'Home' ? '#08FFE2' : '#888'}
                        />
                        <Text style={[styles.navText, currentRoute === 'Home' && styles.navTextActive]}>Home</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.navButton, currentRoute === 'Community' && styles.navButtonActive]}
                        onPress={() => navigation?.navigate('Community')}
                    >
                        <Ionicons
                            name={currentRoute === 'Community' ? 'people' : 'people-outline'}
                            size={24}
                            color={currentRoute === 'Community' ? '#08FFE2' : '#888'}
                        />
                        <Text style={[styles.navText, currentRoute === 'Community' && styles.navTextActive]}>Communities</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.navButton, currentRoute === 'MarketPlace' && styles.navButtonActive]}
                        onPress={() => navigation?.navigate('MarketPlace')}
                    >
                        <Ionicons
                            name={currentRoute === 'MarketPlace' ? 'cart' : 'cart-outline'}
                            size={24}
                            color={currentRoute === 'MarketPlace' ? '#08FFE2' : '#888'}
                        />
                        <Text style={[styles.navText, currentRoute === 'MarketPlace' && styles.navTextActive]}>Market</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.navButton, currentRoute === 'Message' && styles.navButtonActive]}
                        onPress={() => navigation?.navigate('Message')}
                    >
                        <Ionicons
                            name={currentRoute === 'Message' ? 'chatbubbles' : 'chatbubbles-outline'}
                            size={24}
                            color={currentRoute === 'Message' ? '#08FFE2' : '#888'}
                        />
                        <Text style={[styles.navText, currentRoute === 'Message' && styles.navTextActive]}>Messages</Text>
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#666" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search posts, communities, users..."
                        placeholderTextColor="#666"
                        onFocus={onSearchPress}
                    />
                </View>
            </View>

            {/* Right - Profile, Notifications, Settings */}
            <View style={styles.actionsSection}>
                <TouchableOpacity style={styles.iconButton} onPress={onNotificationsPress}>
                    <Ionicons name="notifications-outline" size={24} color="#fff" />
                    {/* Add notification badge if needed */}
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconButton} onPress={onSettingsPress}>
                    <Ionicons name="settings-outline" size={24} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.profileButton} onPress={onProfilePress}>
                    <Image
                        source={
                            userProfile?.profileImage
                                ? { uri: userProfile.profileImage }
                                : require('../assets/profile.png')
                        }
                        style={styles.profileAvatar}
                    />
                    <StatusBadge
                        status={userProfile?.status || 'offline'}
                        size="small"
                        style={styles.statusBadge}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#0B0B0E',
        borderBottomWidth: 1,
        borderBottomColor: '#1F1F25',
        paddingHorizontal: 24,
        paddingVertical: 8,
        height: 70,
    },
    logoSection: {
        flex: 0.15,
    },
    logo: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#BF2EF0',
    },
    centerSection: {
        flex: 0.65,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
    },
    navSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    navButton: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 80,
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    navButtonActive: {
        backgroundColor: '#17171C',
    },
    navText: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
        fontWeight: '500',
    },
    navTextActive: {
        color: '#08FFE2',
        fontWeight: '600',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#17171C',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 8,
        flex: 1,
        maxWidth: 400,
        borderWidth: 1,
        borderColor: '#23232A',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        color: '#fff',
        fontSize: 14,
        outlineStyle: 'none',
    },
    actionsSection: {
        flex: 0.2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 12,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#17171C',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#23232A',
        cursor: 'pointer',
    },
    profileButton: {
        position: 'relative',
        cursor: 'pointer',
    },
    profileAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#08FFE2',
    },
    statusBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
    },
});
