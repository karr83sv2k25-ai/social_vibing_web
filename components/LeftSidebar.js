// components/LeftSidebar.js
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import StatusBadge from './StatusBadge';

export default function LeftSidebar({ userProfile, wallet, stories, navigation }) {
    return (
        <View style={styles.container}>
            {/* Profile Card */}
            <View style={styles.profileCard}>
                <View style={styles.profileHeader}>
                    <Image
                        source={
                            userProfile?.profileImage
                                ? { uri: userProfile.profileImage }
                                : require('../assets/profile.png')
                        }
                        style={styles.profileImage}
                    />
                    <StatusBadge
                        status={userProfile?.status || 'offline'}
                        size="medium"
                        style={styles.statusBadge}
                    />
                </View>

                <View style={styles.profileInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.profileName}>
                            {userProfile?.displayName || userProfile?.name || 'User'}
                        </Text>
                        {userProfile?.verified && (
                            <Ionicons name="checkmark-circle" size={16} color="#08FFE2" />
                        )}
                    </View>
                    <Text style={styles.profileEmail}>
                        {userProfile?.email || '@user'}
                    </Text>
                </View>

                {/* Stats */}
                <View style={styles.stats}>
                    <TouchableOpacity style={styles.stat}>
                        <Text style={styles.statValue}>{userProfile?.followersCount || 0}</Text>
                        <Text style={styles.statLabel}>Followers</Text>
                    </TouchableOpacity>
                    <View style={styles.statDivider} />
                    <TouchableOpacity style={styles.stat}>
                        <Text style={styles.statValue}>{userProfile?.followingCount || 0}</Text>
                        <Text style={styles.statLabel}>Following</Text>
                    </TouchableOpacity>
                    <View style={styles.statDivider} />
                    <TouchableOpacity style={styles.stat}>
                        <Text style={styles.statValue}>{userProfile?.friendsCount || 0}</Text>
                        <Text style={styles.statLabel}>Friends</Text>
                    </TouchableOpacity>
                </View>

                {/* Interest Tags */}
                {userProfile?.interests && userProfile.interests.length > 0 && (
                    <View style={styles.interests}>
                        {userProfile.interests.slice(0, 3).map((interest, index) => (
                            <View key={index} style={styles.interestTag}>
                                <Text style={styles.interestText}>#{interest}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            {/* Wallet Section */}
            {wallet && (
                <View style={styles.walletCard}>
                    <Text style={styles.sectionTitle}>Wallet</Text>
                    <View style={styles.walletItems}>
                        {wallet.coins !== undefined && (
                            <View style={styles.walletItem}>
                                <Ionicons name="disc" size={20} color="#FFD700" />
                                <Text style={styles.walletValue}>{wallet.coins}</Text>
                                <Text style={styles.walletLabel}>Coins</Text>
                            </View>
                        )}
                        {wallet.diamonds !== undefined && (
                            <View style={styles.walletItem}>
                                <Ionicons name="diamond" size={20} color="#08FFE2" />
                                <Text style={styles.walletValue}>{wallet.diamonds}</Text>
                                <Text style={styles.walletLabel}>Diamonds</Text>
                            </View>
                        )}
                        {wallet.credits !== undefined && (
                            <View style={styles.walletItem}>
                                <Ionicons name="star" size={20} color="#BF2EF0" />
                                <Text style={styles.walletValue}>{wallet.credits}</Text>
                                <Text style={styles.walletLabel}>Credits</Text>
                            </View>
                        )}
                    </View>
                </View>
            )}

            {/* Stories Section */}
            <View style={styles.storiesCard}>
                <Text style={styles.sectionTitle}>Stories</Text>
                <TouchableOpacity
                    style={styles.addStoryButton}
                    onPress={() => navigation?.navigate('CreateStory')}
                >
                    <LinearGradient
                        colors={['#BF2EF0', '#08FFE2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.addStoryGradient}
                    >
                        <Ionicons name="add" size={24} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.addStoryText}>Add Story</Text>
                </TouchableOpacity>

                {/* Existing Stories */}
                {stories && stories.length > 0 && (
                    <View style={styles.storiesList}>
                        {stories.slice(0, 4).map((story, index) => (
                            <TouchableOpacity key={index} style={styles.storyItem}>
                                <Image
                                    source={{ uri: story.image || story.thumbnail }}
                                    style={styles.storyImage}
                                />
                                <Text style={styles.storyUsername} numberOfLines={1}>
                                    {story.username}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 16,
    },
    profileCard: {
        backgroundColor: '#17171C',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#23232A',
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 12,
        position: 'relative',
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: '#08FFE2',
    },
    statusBadge: {
        position: 'absolute',
        bottom: 2,
        right: '35%',
    },
    profileInfo: {
        alignItems: 'center',
        marginBottom: 16,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    profileEmail: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 4,
    },
    stats: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#23232A',
    },
    stat: {
        alignItems: 'center',
        cursor: 'pointer',
    },
    statDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#23232A',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    statLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 2,
    },
    interests: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    interestTag: {
        backgroundColor: '#BF2EF033',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BF2EF066',
    },
    interestText: {
        color: '#BF2EF0',
        fontSize: 11,
        fontWeight: '600',
    },
    walletCard: {
        backgroundColor: '#17171C',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#23232A',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 12,
    },
    walletItems: {
        gap: 12,
    },
    walletItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#0B0B0E',
        padding: 12,
        borderRadius: 12,
    },
    walletValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        flex: 1,
    },
    walletLabel: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    storiesCard: {
        backgroundColor: '#17171C',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#23232A',
    },
    addStoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        backgroundColor: '#0B0B0E',
        borderRadius: 12,
        cursor: 'pointer',
    },
    addStoryGradient: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addStoryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    storiesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 12,
    },
    storyItem: {
        width: '45%',
        cursor: 'pointer',
    },
    storyImage: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#BF2EF0',
    },
    storyUsername: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 4,
        textAlign: 'center',
    },
});
