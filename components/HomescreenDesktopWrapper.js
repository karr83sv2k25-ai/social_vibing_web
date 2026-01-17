// components/HomescreenDesktopWrapper.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { isWeb, isDesktopOrLarger } from '../utils/webResponsive';
import DesktopLayout from './DesktopLayout';
import DesktopHeader from './DesktopHeader';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';

/**
 * Wrapper component that conditionally applies desktop three-column layout
 * to the homescreen content based on screen size
 */
export default function HomescreenDesktopWrapper({
    children,
    userProfile,
    wallet,
    stories,
    followedCommunities,
    suggestedCommunities,
    trendingTopics,
    liveStreams,
    navigation,
    showBottomNav = true,
}) {
    const useDesktopLayout = isWeb && isDesktopOrLarger();

    // On mobile/tablet, just render children normally
    if (!useDesktopLayout) {
        return <>{children}</>;
    }

    // On desktop, wrap in three-column layout
    return (
        <View style={styles.desktopContainer}>
            {/* Desktop Header */}
            <DesktopHeader
                userProfile={userProfile}
                onSearchPress={() => navigation?.navigate('SearchBar')}
                onNotificationsPress={() => navigation?.navigate('Notification')}
                onSettingsPress={() => navigation?.navigate('Profile')}
                onProfilePress={() => navigation?.navigate('Profile')}
            />

            {/* Three-column layout */}
            <DesktopLayout
                leftColumn={
                    <LeftSidebar
                        userProfile={userProfile}
                        wallet={wallet}
                        stories={stories}
                        navigation={navigation}
                    />
                }
                centerColumn={
                    <View style={styles.centerContent}>
                        {children}
                    </View>
                }
                rightColumn={
                    <RightSidebar
                        followedCommunities={followedCommunities}
                        suggestedCommunities={suggestedCommunities}
                        trendingTopics={trendingTopics}
                        liveStreams={liveStreams}
                        navigation={navigation}
                    />
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    desktopContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    centerContent: {
        flex: 1,
        backgroundColor: '#000',
    },
});
