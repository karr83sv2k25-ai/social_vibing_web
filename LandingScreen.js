import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    ScrollView,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Linking,
    Platform,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const LandingScreen = ({ navigation }) => {
    const [hoveredButton, setHoveredButton] = useState(null);

    const openLink = (url) => {
        Linking.openURL(url);
    };

    const handleDownloadClick = () => {
        if (Platform.OS === 'web') {
            const userConfirmed = window.confirm('This will download the Social Vibing APK file (Android only). Continue?');
            if (userConfirmed) {
                openLink('https://expo.dev/artifacts/eas/mMhtQdWewJJPEhQDBc36qA.apk');
            }
        } else {
            openLink('https://expo.dev/artifacts/eas/mMhtQdWewJJPEhQDBc36qA.apk');
        }
    };

    const handleAppStoreClick = () => {
        if (Platform.OS === 'web') {
            window.alert('App Store version coming soon! For now, please use the Download button for Android.');
        } else {
            Alert.alert('Coming Soon', 'App Store version coming soon! For now, please use the Download button for Android.');
        }
    };

    return (
        <ScrollView
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={true}
            style={styles.container}
            nestedScrollEnabled={true}
            bounces={false}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.logoContainer}
                    onPress={() => navigation.navigate('Landing')}
                    activeOpacity={0.7}
                >
                    <Image
                        source={require('./assets/logo-main.webp')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.logoText}>Social Vibing</Text>
                </TouchableOpacity>
                <View style={styles.navLinks}>
                    <TouchableOpacity onPress={() => openLink('https://my-store-cac69a.creator-spring.com/')}>
                        <Ionicons name="cart-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openLink('https://discord.gg/X4Wt6dR3jc')}>
                        <Ionicons name="logo-discord" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openLink('https://www.instagram.com/socialvibing_')}>
                        <Ionicons name="logo-instagram" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openLink('https://www.youtube.com/@83Karr')}>
                        <Ionicons name="logo-youtube" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Hero Section */}
            <View style={styles.heroSection}>
                <View style={styles.heroText}>
                    <Text style={styles.heroTitle}>Find your Community</Text>
                    <Text style={styles.heroSubtitle}>Blog, roleplay, vibe out.</Text>
                </View>

                <View style={styles.videoContainer}>
                    {Platform.OS === 'web' ? (
                        <iframe
                            src="https://www.youtube.com/embed/NnOg6l3W7aI?autoplay=1&mute=1&loop=1&playlist=NnOg6l3W7aI&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&fs=0"
                            style={{
                                width: '100%',
                                height: '100%',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                border: 'none',
                                objectFit: 'cover',
                                pointerEvents: 'none'
                            }}
                            allow="autoplay; encrypted-media"
                        />
                    ) : (
                        <View style={styles.videoPlaceholder}>
                            <Text style={styles.videoPlaceholderText}>YouTube Video Available on Web</Text>
                        </View>
                    )}
                    <View style={styles.videoGlow} />
                </View>
            </View>

            {/* Preview Images */}
            <View style={styles.previewSection}>
                <View style={styles.previewImageContainer}>
                    <Image
                        source={require('./assets/landing1.jpeg')}
                        style={styles.previewImage}
                        resizeMode="cover"
                    />
                    <View style={styles.imageGlowOverlay} />
                </View>
                <View style={styles.previewImageContainer}>
                    <Image
                        source={require('./assets/landing2.jpeg')}
                        style={[styles.previewImage, styles.previewImageCenter]}
                        resizeMode="cover"
                    />
                    <View style={styles.imageGlowOverlay} />
                </View>
                <View style={styles.previewImageContainer}>
                    <Image
                        source={require('./assets/landing3.jpeg')}
                        style={styles.previewImage}
                        resizeMode="cover"
                    />
                    <View style={styles.imageGlowOverlay} />
                </View>
            </View>

            {/* Description Section */}
            <View style={styles.descriptionSection}>
                <Text style={styles.descriptionText}>
                    Hello there! If you're looking for a simple and easy to use 17+ social media platform
                    with your friends and family look no further! Welcome to Social Vibing.
                </Text>
                <Text style={styles.descriptionText}>
                    Social Vibing is a simple to use social media platform to enjoy to the fullest for
                    people to chat, call, blog, market, play games, roleplay, and more! I'm also there as
                    well which I go by Karr83 so if you have any feedback to give to help make this
                    platform become perfect then shoot me a dm!
                </Text>
                <Text style={styles.descriptionText}>
                    Feel free to invite your friends and family to Social Vibing to vibe out!
                </Text>
            </View>

            {/* Download Buttons */}
            <View style={styles.downloadSection}>
                {/* App Store Button */}
                <TouchableOpacity
                    style={[styles.downloadButton, hoveredButton === 'appstore' && styles.downloadButtonHover]}
                    activeOpacity={0.8}
                    onPress={handleAppStoreClick}
                    onMouseEnter={() => Platform.OS === 'web' && setHoveredButton('appstore')}
                    onMouseLeave={() => Platform.OS === 'web' && setHoveredButton(null)}
                >
                    <LinearGradient
                        colors={['#10002B', '#10002B']}
                        style={styles.downloadButtonGradient}
                    >
                        <View style={[styles.glowBorder, { borderColor: '#9747FF' }]} />
                        {renderCornerLines('#9747FF')}
                        <Ionicons name="logo-apple" size={40} color="#fff" style={styles.downloadIcon} />
                        <Text style={styles.downloadText}>
                            Coming Soon
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Download Button */}
                <TouchableOpacity
                    style={[styles.downloadButton, hoveredButton === 'download' && styles.downloadButtonHover]}
                    activeOpacity={0.8}
                    onPress={handleDownloadClick}
                    onMouseEnter={() => Platform.OS === 'web' && setHoveredButton('download')}
                    onMouseLeave={() => Platform.OS === 'web' && setHoveredButton(null)}
                >
                    <LinearGradient
                        colors={['#10002B', '#10002B']}
                        style={styles.downloadButtonGradient}
                    >
                        <View style={[styles.glowBorder, { borderColor: '#4bd0f5' }]} />
                        {renderCornerLines('#4bd0f5')}
                        <Ionicons name="download-outline" size={40} color="#fff" style={styles.downloadIcon} />
                        <View style={styles.downloadTextContainer}>
                            <Text style={styles.downloadSubtext}>Get for FREE</Text>
                            <Text style={styles.downloadText}>
                                Download
                            </Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Website Button */}
                <TouchableOpacity
                    style={[styles.downloadButton, hoveredButton === 'website' && styles.downloadButtonHover]}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('Login')}
                    onMouseEnter={() => Platform.OS === 'web' && setHoveredButton('website')}
                    onMouseLeave={() => Platform.OS === 'web' && setHoveredButton(null)}
                >
                    <LinearGradient
                        colors={['#10002B', '#10002B']}
                        style={styles.downloadButtonGradient}
                    >
                        <View style={[styles.glowBorder, { borderColor: '#e4b77b' }]} />
                        {renderCornerLines('#e4b77b')}
                        <Ionicons name="globe-outline" size={40} color="#fff" style={styles.downloadIcon} />
                        <Text style={styles.downloadText}>
                            Web Version
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Get Started Button */}
                <TouchableOpacity
                    style={[styles.getStartedButton, hoveredButton === 'getstarted' && styles.getStartedButtonHover]}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('Login')}
                    onMouseEnter={() => Platform.OS === 'web' && setHoveredButton('getstarted')}
                    onMouseLeave={() => Platform.OS === 'web' && setHoveredButton(null)}
                >
                    <LinearGradient
                        colors={['#9747FF', '#6818f5']}
                        style={styles.getStartedGradient}
                    >
                        <Text style={styles.getStartedText}>Get Started</Text>
                    </LinearGradient>
                </TouchableOpacity>

            </View>
        </ScrollView>
    );
};

const renderCornerLines = (color) => {
    return (
        <>
            <View style={[styles.cornerLine, styles.cornerTopLeft, { backgroundColor: color }]} />
            <View style={[styles.cornerLine, styles.cornerTopLeftV, { backgroundColor: color }]} />
            <View style={[styles.cornerLine, styles.cornerTopRight, { backgroundColor: color }]} />
            <View style={[styles.cornerLine, styles.cornerTopRightV, { backgroundColor: color }]} />
            <View style={[styles.cornerLine, styles.cornerBottomLeft, { backgroundColor: color }]} />
            <View style={[styles.cornerLine, styles.cornerBottomLeftV, { backgroundColor: color }]} />
            <View style={[styles.cornerLine, styles.cornerBottomRight, { backgroundColor: color }]} />
            <View style={[styles.cornerLine, styles.cornerBottomRightV, { backgroundColor: color }]} />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0019',
        ...(Platform.OS === 'web' && {
            overflowY: 'auto',
            maxHeight: '100vh',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
        }),
    },
    contentContainer: {
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#2D3335',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
        }),
    },
    logo: {
        width: 48,
        height: 48,
    },
    logoText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
        marginLeft: 8,
        ...(Platform.OS === 'web' ? {
            textShadow: '0px 1px 5px #9747FF',
        } : {
            textShadowColor: '#9747FF',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 5,
        }),
    },
    navLinks: {
        flexDirection: 'row',
        gap: 20,
    },
    heroSection: {
        paddingHorizontal: width < 768 ? 16 : width < 1024 ? 40 : 60,
        paddingVertical: width < 768 ? 30 : 40,
        alignItems: 'center',
        width: '100%',
    },
    heroText: {
        alignItems: 'center',
        marginBottom: width < 768 ? 24 : width < 1024 ? 32 : 40,
        paddingHorizontal: width < 768 ? 20 : 0,
    },
    heroTitle: {
        fontSize: width < 768 ? 32 : width < 1024 ? 40 : 48,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 10,
        ...(Platform.OS === 'web' ? {
            textShadow: '0px 2px 10px #9747FF',
        } : {
            textShadowColor: '#9747FF',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 10,
        }),
    },
    heroSubtitle: {
        fontSize: width < 768 ? 16 : 20,
        color: '#fff',
        textAlign: 'center',
        ...(Platform.OS === 'web' ? {
            textShadow: '0px 1px 5px #000',
        } : {
            textShadowColor: '#000',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 5,
        }),
    },
    videoContainer: {
        width: '100%',
        maxWidth: width < 768 ? '100%' : width < 1024 ? 800 : 1000,
        height: width < 768 ? Math.min(width * 9 / 16, 400) : width < 1024 ? 450 : 562.5,
        borderRadius: width < 768 ? 12 : 16,
        overflow: 'hidden',
        position: 'relative',
        marginHorizontal: 'auto',
        backgroundColor: '#10002B',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
    },
    video: {
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
        ...(Platform.OS === 'web' && {
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            objectFit: 'cover',
            objectPosition: 'center center',
            display: 'block',
            overflow: 'hidden',
            pointerEvents: 'auto',
            WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)',
            textSizeAdjust: '100%',
            WebkitTextSizeAdjust: '100%',
        }),
    },
    videoGlow: {
        position: 'absolute',
        inset: 0,
        borderRadius: width < 768 ? 12 : 16,
        borderWidth: 0,
        borderColor: 'transparent',
        ...(Platform.OS === 'web' ? {
            pointerEvents: 'none',
            boxShadow: 'none',
        } : {
            shadowColor: 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0,
            shadowRadius: 0,
        }),
    },
    previewSection: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingHorizontal: width < 768 ? 10 : 20,
        paddingVertical: width < 768 ? 30 : 50,
        gap: width < 768 ? 15 : width < 1024 ? 20 : 30,
        maxWidth: 1200,
        marginHorizontal: 'auto',
        width: '100%',
    },
    previewImageContainer: {
        position: 'relative',
        width: width < 768 ? Math.min(width - 40, 280) : width < 1024 ? 240 : 320,
        height: width < 768 ? Math.min(width - 40, 280) * 2 : width < 1024 ? 480 : 640,
        maxWidth: 320,
        borderRadius: 30,
        overflow: 'hidden',
        backgroundColor: 'rgba(16, 0, 43, 0.5)',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
        position: 'absolute',
        top: 0,
        left: 0,
        ...(Platform.OS === 'web' && {
            objectFit: 'cover',
            objectPosition: 'center',
        }),
    },
    previewImageCenter: {
        transform: [{ scale: width < 768 ? 1.02 : 1.08 }],
        zIndex: 2,
    },
    imageGlow: {
        position: 'absolute',
        inset: 0,
        borderRadius: 16,
        ...(Platform.OS === 'web' ? {
            boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.8)',
        } : {
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 20,
        }),
    },
    imageGlowOverlay: {
        position: 'absolute',
        inset: 0,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(151, 71, 255, 0.3)',
        ...(Platform.OS === 'web' ? {
            pointerEvents: 'none',
            boxShadow: '0px 0px 40px rgba(151, 71, 255, 0.5)',
        } : {
            shadowColor: '#9747FF',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 40,
        }),
    },
    descriptionSection: {
        paddingHorizontal: 30,
        paddingVertical: 40,
        maxWidth: 900,
        marginHorizontal: 'auto',
        width: '100%',
    },
    descriptionText: {
        fontSize: 18,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 28,
    },
    downloadSection: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        alignItems: 'center',
        gap: 20,
        maxWidth: 600,
        marginHorizontal: 'auto',
        width: '100%',
    },
    downloadButton: {
        width: Math.min(width - 40, 400),
        height: 80,
        borderRadius: 12,
        overflow: 'hidden',
        ...(Platform.OS === 'web' && {
            transition: 'transform 0.2s ease',
        }),
    },
    downloadButtonHover: {
        transform: [{ scale: 1.05 }],
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
        }),
    },
    downloadButtonGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        position: 'relative',
    },
    glowBorder: {
        position: 'absolute',
        inset: 0,
        borderWidth: 2,
        borderRadius: 12,
        opacity: 0.7,
    },
    cornerLine: {
        position: 'absolute',
    },
    cornerTopLeft: {
        top: 0,
        left: 0,
        width: 12,
        height: 4,
        borderTopLeftRadius: 12,
    },
    cornerTopLeftV: {
        top: 0,
        left: 0,
        width: 4,
        height: 12,
        borderTopLeftRadius: 12,
    },
    cornerTopRight: {
        top: 0,
        right: 0,
        width: 12,
        height: 4,
        borderTopRightRadius: 12,
    },
    cornerTopRightV: {
        top: 0,
        right: 0,
        width: 4,
        height: 12,
        borderTopRightRadius: 12,
    },
    cornerBottomLeft: {
        bottom: 0,
        left: 0,
        width: 12,
        height: 4,
        borderBottomLeftRadius: 12,
    },
    cornerBottomLeftV: {
        bottom: 0,
        left: 0,
        width: 4,
        height: 12,
        borderBottomLeftRadius: 12,
    },
    cornerBottomRight: {
        bottom: 0,
        right: 0,
        width: 12,
        height: 4,
        borderBottomRightRadius: 12,
    },
    cornerBottomRightV: {
        bottom: 0,
        right: 0,
        width: 4,
        height: 12,
        borderBottomRightRadius: 12,
    },
    downloadIcon: {
        ...(Platform.OS === 'web' ? {
            filter: 'drop-shadow(0px 0px 10px #fff)',
        } : {
            textShadowColor: '#fff',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 10,
        }),
    },
    downloadTextContainer: {
        alignItems: 'center',
    },
    downloadSubtext: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    downloadText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    getStartedButton: {
        width: Math.min(width - 40, 400),
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
        marginTop: 20,
        ...(Platform.OS === 'web' && {
            transition: 'transform 0.2s ease',
        }),
    },
    getStartedButtonHover: {
        transform: [{ scale: 1.05 }],
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
        }),
    },
    getStartedGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    getStartedText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
});

export default LandingScreen;
