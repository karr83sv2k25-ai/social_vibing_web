// components/TypingIndicator.js
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const ACCENT = '#7C3AED';
const CARD = '#17171C';

export function TypingIndicator({ userNames = [] }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const createAnimation = (dot, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true
          })
        ])
      );
    };
    
    const anim1 = createAnimation(dot1, 0);
    const anim2 = createAnimation(dot2, 200);
    const anim3 = createAnimation(dot3, 400);
    
    anim1.start();
    anim2.start();
    anim3.start();
    
    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);
  
  const getTypingText = () => {
    if (userNames.length === 0) return 'Someone is typing';
    if (userNames.length === 1) return `${userNames[0]} is typing`;
    if (userNames.length === 2) return `${userNames[0]} and ${userNames[1]} are typing`;
    return `${userNames[0]} and ${userNames.length - 1} others are typing`;
  };
  
  const dotScale1 = dot1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3]
  });
  
  const dotScale2 = dot2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3]
  });
  
  const dotScale3 = dot3.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3]
  });
  
  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <View style={styles.dotsContainer}>
          <Animated.View 
            style={[
              styles.dot,
              { transform: [{ scale: dotScale1 }] }
            ]}
          />
          <Animated.View 
            style={[
              styles.dot,
              { transform: [{ scale: dotScale2 }] }
            ]}
          />
          <Animated.View 
            style={[
              styles.dot,
              { transform: [{ scale: dotScale3 }] }
            ]}
          />
        </View>
      </View>
      <Text style={styles.typingText}>{getTypingText()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8
  },
  bubble: {
    backgroundColor: CARD,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ACCENT
  },
  typingText: {
    color: ACCENT,
    fontSize: 12
  }
});
