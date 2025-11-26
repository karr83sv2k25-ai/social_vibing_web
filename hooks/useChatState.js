/**
 * useChatState Hook
 * 
 * WhatsApp-style chat state management for persistent message box behavior
 * Handles: draft messages, keyboard state, scroll position, typing indicators
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const DRAFT_STORAGE_KEY = '@chat_drafts';

export const useChatState = (chatId) => {
  // Input State
  const [messageText, setMessageText] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Keyboard State
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Scroll State
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // Input Mode State (mic vs send button)
  const [inputMode, setInputMode] = useState('mic'); // 'mic' | 'send'

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Network State
  const [isOnline, setIsOnline] = useState(true);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected && state.isInternetReachable !== false);
    });

    // Initial check
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected && state.isInternetReachable !== false);
    });

    return () => unsubscribe();
  }, []);

  // Load draft message on mount
  useEffect(() => {
    loadDraft();
  }, [chatId]);

  // Save draft when text changes
  useEffect(() => {
    if (messageText.trim()) {
      saveDraft();
    } else {
      clearDraft();
    }
  }, [messageText]);

  // Update input mode based on text
  useEffect(() => {
    setInputMode(messageText.trim() ? 'send' : 'mic');
  }, [messageText]);

  // Typing indicator logic
  useEffect(() => {
    if (messageText.trim()) {
      setIsTyping(true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout - stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    } else {
      setIsTyping(false);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [messageText]);

  // Load draft from storage
  const loadDraft = async () => {
    try {
      const draftsJSON = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
      if (draftsJSON) {
        const drafts = JSON.parse(draftsJSON);
        if (drafts[chatId]) {
          setMessageText(drafts[chatId]);
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  // Save draft to storage
  const saveDraft = async () => {
    try {
      const draftsJSON = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
      const drafts = draftsJSON ? JSON.parse(draftsJSON) : {};
      drafts[chatId] = messageText;
      await AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  // Clear draft from storage
  const clearDraft = async () => {
    try {
      const draftsJSON = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
      if (draftsJSON) {
        const drafts = JSON.parse(draftsJSON);
        delete drafts[chatId];
        await AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
      }
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  };

  // Clear message (after send)
  const clearMessage = useCallback(() => {
    setMessageText('');
    clearDraft();
  }, []);

  // Handle scroll events
  const handleScroll = useCallback((event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    
    // Show "scroll to bottom" button if user scrolled up more than 100px
    setShowScrollToBottom(distanceFromBottom > 100);
    
    // Auto-scroll enabled when near bottom (within 50px)
    setShouldAutoScroll(distanceFromBottom < 50);
    
    // Track if user is actively scrolling
    setIsUserScrolling(distanceFromBottom > 50);
  }, []);

  // Handle keyboard show
  const handleKeyboardShow = useCallback((e) => {
    setKeyboardVisible(true);
    setKeyboardHeight(e.endCoordinates.height);
  }, []);

  // Handle keyboard hide
  const handleKeyboardHide = useCallback(() => {
    setKeyboardVisible(false);
    setKeyboardHeight(0);
  }, []);

  // Handle back button
  const handleBackPress = useCallback(() => {
    if (keyboardVisible) {
      // Close keyboard first
      return true; // Prevent navigation
    }
    // Allow navigation back
    return false;
  }, [keyboardVisible]);

  return {
    // Input State
    messageText,
    setMessageText,
    cursorPosition,
    setCursorPosition,
    isTyping,
    clearMessage,

    // Keyboard State
    keyboardHeight,
    keyboardVisible,
    handleKeyboardShow,
    handleKeyboardHide,

    // Scroll State
    shouldAutoScroll,
    showScrollToBottom,
    isUserScrolling,
    setIsUserScrolling,
    handleScroll,

    // Input Mode
    inputMode,
    isRecording,
    setIsRecording,
    recordingDuration,
    setRecordingDuration,

    // Network State
    isOnline,
    setIsOnline,

    // Navigation
    handleBackPress,
  };
};
