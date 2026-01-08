// components/RightSidebar.js
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function RightSidebar({
    followedCommunities = [],
    suggestedCommunities = [],
    trendingTopics = [],
    liveStreams = [],
    navigation
}) {
    return (
        <View style={styles.container}>
            {/* Followed Communities */}
            {followedCommunities.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Your Communities</Text>
                        <TouchableOpacity onPress={() => navigation?.navigate('Community')}>
                            <Text style={styles.seeAll}>See all</Text>
                        </TouchableOpacity>
                    </View>

                    {followedCommunities.slice(0, 3).map((community, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.communityCard}
                            onPress={() =>
                                navigation?.navigate('GroupInfo', {
                                    communityId: community.community_id || community.id,
                                })
                            }
                        >
                            <Image
                                source={
                                    community.profileImage || community.img
                                        ? { uri: community.profileImage || community.img }
                                        : require('../assets/profile.png')
                                }
                                style={styles.communityImage}
                            />
                            <View style={styles.communityInfo}>
                                <Text style={styles.communityName} numberOfLines={1}>
                                    {community.name || community.community_title}
                                </Text>
                                <Text style={styles.communityMeta}>
                                    {community.community_members?.length || 0} members
                                </Text>
                                {community.category && (
                                    <View style={styles.categoryTag}>
                                        <Text style={styles.categoryText}>
                                            {community.category}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.followedBadge}>
                                <Ionicons name="checkmark-circle" size={20} color="#08FFE2" />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Suggested Communities */}
            {suggestedCommunities.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Suggested Communities</Text>
                    {suggestedCommunities.slice(0, 3).map((community, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.communityCard}
                            onPress={() =>
                                navigation?.navigate('GroupInfo', {
                                    communityId: community.community_id || community.id,
                                })
                            }
                        >
                            <Image
                                source={
                                    community.profileImage || community.img
                                        ? { uri: community.profileImage || community.img }
                                        : require('../assets/profile.png')
                                }
                                style={styles.communityImage}
                            />
                            <View style={styles.communityInfo}>
                                <Text style={styles.communityName} numberOfLines={1}>
                                    {community.name || community.community_title}
                                </Text>
                                <Text style={styles.communityMeta}>
                                    {community.community_members?.length || 0} members
                                </Text>
                                {community.category && (
                                    <View style={styles.categoryTag}>
                                        <Text style={styles.categoryText}>
                                            {community.category}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <TouchableOpacity style={styles.followButton}>
                                <Ionicons name="add" size={16} color="#fff" />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Trending Topics */}
            {trendingTopics.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Trending</Text>
                    <View style={styles.trendingList}>
                        {trendingTopics.slice(0, 5).map((topic, index) => (
                            <TouchableOpacity key={index} style={styles.trendingItem}>
                                <Text style={styles.trendingRank}>#{index + 1}</Text>
                                <View style={styles.trendingInfo}>
                                    <Text style={styles.trendingTag}>{topic.tag}</Text>
                                    <Text style={styles.trendingCount}>
                                        {topic.count || 0} posts
                                    </Text>
                                </View>
                                <Ionicons name="trending-up" size={16} color="#08FFE2" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Live Streams */}
            {liveStreams.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Live Now</Text>
                        <View style={styles.liveBadge}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>LIVE</Text>
                        </View>
                    </View>

                    {liveStreams.slice(0, 2).map((stream, index) => (
                        <TouchableOpacity key={index} style={styles.streamCard}>
                            <Image
                                source={
                                    stream.thumbnail
                                        ? { uri: stream.thumbnail }
                                        : require('../assets/profile.png')
                                }
                                style={styles.streamThumbnail}
                            />
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.8)']}
                                style={styles.streamOverlay}
                            >
                                <View style={styles.streamViewers}>
                                    <Ionicons name="eye" size={14} color="#fff" />
                                    <Text style={styles.viewerCount}>{stream.viewers || 0}</Text>
                                </View>
                            </LinearGradient>
                            <View style={styles.streamInfo}>
                                <Text style={styles.streamTitle} numberOfLines={1}>
                                    {stream.title}
                                </Text>
                                <Text style={styles.streamUsername} numberOfLines={1}>
                                    {stream.username}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Create Community Button */}
            <TouchableOpacity
                style={styles.createButton}
                onPress={() => navigation?.navigate('CreateCommunityScreen')}
            >
                <LinearGradient
                    colors={['#BF2EF0', '#08FFE2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.createGradient}
                >
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.createText}>Create Community</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 16,
    },
    section: {
        backgroundColor: '#17171C',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#23232A',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    seeAll: {
        fontSize: 13,
        color: '#08FFE2',
        fontWeight: '600',
        cursor: 'pointer',
    },
    communityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 10,
        backgroundColor: '#0B0B0E',
        borderRadius: 12,
        marginBottom: 10,
        cursor: 'pointer',
    },
    communityImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#23232A',
    },
    communityInfo: {
        flex: 1,
    },
    communityName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 2,
    },
    communityMeta: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    categoryTag: {
        backgroundColor: '#BF2EF022',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginTop: 4,
        alignSelf: 'flex-start',
    },
    categoryText: {
        fontSize: 10,
        color: '#BF2EF0',
        fontWeight: '600',
    },
    followedBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#08FFE222',
        alignItems: 'center',
        justifyContent: 'center',
    },
    followButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#BF2EF0',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
    },
    trendingList: {
        gap: 10,
    },
    trendingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 10,
        backgroundColor: '#0B0B0E',
        borderRadius: 10,
        cursor: 'pointer',
    },
    trendingRank: {
        fontSize: 16,
        fontWeight: '700',
        color: '#08FFE2',
        width: 24,
    },
    trendingInfo: {
        flex: 1,
    },
    trendingTag: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },
    trendingCount: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 2,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EF4444',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#fff',
    },
    liveText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#fff',
    },
    streamCard: {
        marginBottom: 12,
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
    },
    streamThumbnail: {
        width: '100%',
        height: 120,
        borderRadius: 12,
    },
    streamOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 120,
        justifyContent: 'flex-end',
        padding: 10,
    },
    streamViewers: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    viewerCount: {
        fontSize: 11,
        fontWeight: '600',
        color: '#fff',
    },
    streamInfo: {
        padding: 10,
        backgroundColor: '#0B0B0E',
    },
    streamTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 2,
    },
    streamUsername: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    createButton: {
        marginTop: 8,
        cursor: 'pointer',
    },
    createGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 14,
        borderRadius: 12,
    },
    createText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
});
