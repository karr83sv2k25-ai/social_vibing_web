import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';

const { width } = Dimensions.get('window');

export default function SplashScreens({ navigation }) {
  const [screen, setScreen] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState([]);

  // Check if user has already seen splash on mount
  useEffect(() => {
    const checkSplashStatus = async () => {
      try {
        const hasSeenSplash = await AsyncStorage.getItem('hasSeenSplash');
        console.log('🎬 SplashScreen mounted - hasSeenSplash:', hasSeenSplash);
        console.log('🎬 auth.currentUser:', auth.currentUser?.email || 'Not logged in');
        console.log('🎬 Platform:', Platform.OS);

        if (hasSeenSplash === 'true') {
          // User has already seen splash screens, redirect them
          console.log('⏭️ User has already seen welcome screens, redirecting...');
          const isLoggedIn = Boolean(auth.currentUser);
          const targetRoute = isLoggedIn ? 'TabBar' : 'Login';
          console.log('⏭️ Redirecting to:', targetRoute);
          navigation.replace(targetRoute);
        } else {
          console.log('👋 Showing welcome screens to first-time user');
        }
      } catch (error) {
        console.log('Error checking splash status:', error);
      }
    };

    checkSplashStatus();
  }, []);

  const navigateToApp = async () => {
    // Mark that user has seen splash screens and clear new signup flag
    try {
      await AsyncStorage.setItem('hasSeenSplash', 'true');
      await AsyncStorage.removeItem('isNewSignup');
      console.log('✅ hasSeenSplash set to true - user has completed welcome screens');
    } catch (error) {
      console.log('Error saving splash screen state:', error);
    }

    const isLoggedIn = Boolean(auth.currentUser);
    const targetRoute = isLoggedIn ? 'TabBar' : 'Login';
    console.log('🚀 Navigating to:', targetRoute);

    navigation.reset({
      index: 0,
      routes: [{ name: targetRoute }],
    });
  };

  const handleNext = () => {
    if (screen < 3) {
      setScreen(screen + 1);
    } else {
      navigateToApp();
    }
  };

  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const saveInterestsAndContinue = async () => {
    try {
      // Save to AsyncStorage for non-authenticated users
      await AsyncStorage.setItem('userInterests', JSON.stringify(selectedInterests));

      // If user is authenticated, save to Firestore
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          interests: selectedInterests,
          interestsUpdatedAt: new Date().toISOString()
        });
      }

      navigateToApp();
    } catch (error) {
      console.error('Error saving interests:', error);
      // Continue anyway
      navigateToApp();
    }
  };

  const isWeb = Platform.OS === 'web';
  const { width: screenWidth } = Dimensions.get('window');
  const isDesktop = isWeb && screenWidth >= 768;

  // Splash 1 & 2
  if (screen === 1 || screen === 2) {
    return (
      <View style={{ flex: 1 }}>
        <ImageBackground
          source={
            screen === 1
              ? require('./assets/splash1.png')
              : require('./assets/splash2.png')
          }
          style={[styles.background, isDesktop && styles.backgroundDesktop]}
          resizeMode="cover"
          imageStyle={{ opacity: 1 }}>
          <View style={[styles.overlayLeft, isDesktop && styles.overlayDesktop]}>
            <Text style={[styles.titleLeft, isDesktop && styles.titleDesktop]}>
              {screen === 1 ? 'Welcome to Social Vibing!' : 'Connect & Share'}
            </Text>
            <Text style={[styles.subTextLeft, isDesktop && styles.subTextDesktop]}>
              {screen === 1
                ? 'Join our vibrant community to share\nmoments, chat, and connect with friends'
                : 'Create communities, share experiences,\nand vibe with like-minded people'}
            </Text>

            {/* Centered Dots */}
            <View style={[styles.dotsContainerCenter, isDesktop && styles.dotsContainerDesktop]}>
              <View
                style={[styles.dot, screen === 1 ? styles.activeDot : null]}
              />
              <View
                style={[styles.dot, screen === 2 ? styles.activeDot : null]}
              />
              <View
                style={[styles.dot, screen === 3 ? styles.activeDot : null]}
              />
            </View>
          </View>

          {/* ✅ Next Button with Arrow Icon */}
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.8}
            style={[styles.nextButtonRight, isDesktop && styles.nextButtonDesktop]}>
            <Ionicons name="arrow-forward" size={22} color="#fff" />
          </TouchableOpacity>
        </ImageBackground>
      </View>
    );
  }

  // Splash 3
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#000' }}
      contentContainerStyle={[{ paddingBottom: 40 }, isDesktop && { alignItems: 'center' }]}
      showsVerticalScrollIndicator={false}>
      <ImageBackground
        source={require('./assets/splash3.jpg')}
        style={[styles.topBackground, isDesktop && styles.topBackgroundDesktop]}
        resizeMode="cover">
        <View style={[styles.textBoxWrapper, isDesktop && styles.textBoxWrapperDesktop]}>
          <View style={[styles.textBox, isDesktop && styles.textBoxDesktop]}>
            <Text style={styles.heading}>What are you interested in?</Text>
            <Text style={styles.subText2}>
              Let us know your interest and enjoy app better
            </Text>
          </View>
        </View>
      </ImageBackground>

      <View style={[styles.bottomContainer, isDesktop && styles.bottomContainerDesktop]}>
        <View style={[styles.boxGrid, isDesktop && styles.boxGridDesktop]}>
          {[
            { img: require('./assets/s1.jpg'), title: 'Music' },
            { img: require('./assets/s2.jpg'), title: 'Movies' },
            { img: require('./assets/s3.jpg'), title: 'Travel' },
            { img: require('./assets/s4.jpg'), title: 'Gaming' },
            { img: require('./assets/s5.jpg'), title: 'Fitness' },
            { img: require('./assets/s6.jpg'), title: 'Food' },
            { img: require('./assets/s7.jpg'), title: 'Art' },
            { img: require('./assets/s8.jpg'), title: 'Lifestyle' },
            { img: require('./assets/s9.jpg'), title: 'Tech' },
          ].map((item, index) => {
            const isSelected = selectedInterests.includes(item.title);
            return (
              <View key={index} style={styles.boxWrapper}>
                <TouchableOpacity
                  style={[
                    styles.box,
                    isSelected && styles.boxSelected
                  ]}
                  onPress={() => toggleInterest(item.title)}
                  activeOpacity={0.7}
                >
                  <Image source={item.img} style={styles.boxImage} />
                  {isSelected && (
                    <View style={styles.checkmarkOverlay}>
                      <Ionicons name="checkmark-circle" size={30} color="#05FF00" />
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={styles.boxTitle}>{item.title}</Text>
              </View>
            );
          })}
        </View>

        {/* Dots Indicator */}
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, screen === 1 ? styles.activeDot : null]} />
          <View style={[styles.dot, screen === 2 ? styles.activeDot : null]} />
          <View style={[styles.dot, screen === 3 ? styles.activeDot : null]} />
        </View>

        {/* Next Button */}
        <TouchableOpacity
          onPress={saveInterestsAndContinue}
          activeOpacity={0.8}
          style={styles.customNextButton}>
          <Text style={styles.customNextText}>
            {selectedInterests.length > 0 ? `Continue (${selectedInterests.length} selected)` : 'Skip'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#000',
  },

  overlayLeft: {
    alignSelf: 'flex-start',
    marginLeft: 25,
    marginBottom: 60,
    width: '100%',
  },

  titleLeft: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'left',
  },

  subTextLeft: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 40,
    textAlign: 'left',
  },

  dotsContainerCenter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },

  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 25,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#555',
    marginHorizontal: 4,
  },

  activeDot: {
    backgroundColor: '#00FF94',
  },

  nextButtonRight: {
    position: 'absolute',
    bottom: 60,
    right: 25,
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00FF94',
  },

  topBackground: {
    height: 240,
    width: width,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },

  textBoxWrapper: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
  },

  textBox: {
    backgroundColor: '#000',
    paddingVertical: 25,
    paddingHorizontal: 30,
    width: '100%',
    alignItems: 'center',
  },

  heading: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 5,
  },

  subText2: {
    color: '#BDBDBD',
    fontSize: 14,
    textAlign: 'center',
  },

  bottomContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    paddingTop: 20,
  },

  boxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  boxWrapper: {
    width: 89,
    alignItems: 'center',
    marginBottom: 10,
  },

  box: {
    width: 89,
    height: 114,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    position: 'relative',
  },

  boxSelected: {
    borderColor: '#05FF00',
    borderWidth: 2,
    backgroundColor: 'rgba(5, 255, 0, 0.1)',
  },

  checkmarkOverlay: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
  },

  boxImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },

  boxTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },

  customNextButton: {
    width: 328,
    height: 45,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#05FF00',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 255, 0, 0.2)',
    shadowColor: '#05FF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 9.9,
    elevation: 5,
    marginBottom: 20,
  },

  customNextText: {
    color: '#05FF00',
    fontSize: 16,
    fontWeight: '700',
  },

  // Desktop responsive styles
  backgroundDesktop: {
    justifyContent: 'center',
  },

  overlayDesktop: {
    alignSelf: 'center',
    maxWidth: 600,
    paddingHorizontal: 40,
  },

  titleDesktop: {
    fontSize: 36,
    textAlign: 'center',
  },

  subTextDesktop: {
    fontSize: 16,
    textAlign: 'center',
  },

  dotsContainerDesktop: {
    marginTop: 20,
  },

  nextButtonDesktop: {
    width: 56,
    height: 56,
    borderRadius: 28,
    right: 50,
    bottom: 80,
  },

  topBackgroundDesktop: {
    width: '100%',
    maxWidth: 800,
  },

  textBoxWrapperDesktop: {
    maxWidth: 800,
  },

  textBoxDesktop: {
    maxWidth: 800,
  },

  bottomContainerDesktop: {
    maxWidth: 800,
    width: '100%',
  },

  boxGridDesktop: {
    maxWidth: 700,
    gap: 20,
  },
});

