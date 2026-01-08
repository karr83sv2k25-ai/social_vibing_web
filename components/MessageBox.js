/**
 * MessageBox Component
 * 
 * WhatsApp-style persistent message input with:
 * - Auto-resize textarea
 * - Emoji picker
 * - Attachment handling
 * - Voice recording (long press)
 * - Dynamic send/mic button
 * - Network status indicator
 * - Typing state management
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  StyleSheet,
  Animated,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export const MessageBox = React.forwardRef(({
  value,
  onChangeText,
  onSend,
  onEmojiPress,
  onAttachPress,
  onVoiceRecordStart,
  onVoiceRecordEnd,
  onFocus,
  placeholder = 'Message',
  isLoading = false,
  isOnline = true,
  isBlocked = false,
  inputMode, // 'mic' | 'send' - required prop
  isRecording = false,
  recordingDuration = 0,
  maxLength = 500,
  selectedColor,
  disabled = false,
  style,
}, ref) => {
  const inputRef = useRef(null);
  const recordingScale = useRef(new Animated.Value(1)).current;
  const micPressTimer = useRef(null);

  // Animate recording button
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingScale, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(recordingScale, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      recordingScale.setValue(1);
    }
  }, [isRecording]);

  // Format recording duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle send
  const handleSend = () => {
    if (!value.trim() || isLoading || disabled || !isOnline) return;
    onSend();
  };

  // Handle keyboard events for web
  const handleKeyPress = (e) => {
    if (Platform.OS === 'web') {
      // Check if Enter key is pressed without Shift
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevent default new line behavior

        // Check if message is valid before attempting to send
        if (value.trim() && !isLoading && !disabled && isOnline) {
          handleSend(); // Send the message
        }
      }
      // Shift+Enter will create a new line (default behavior)
    }
  };

  // Handle mic press
  const handleMicPressIn = () => {
    micPressTimer.current = setTimeout(() => {
      onVoiceRecordStart?.();
    }, 200); // 200ms to distinguish from tap
  };

  const handleMicPressOut = () => {
    if (micPressTimer.current) {
      clearTimeout(micPressTimer.current);
    }
    if (isRecording) {
      onVoiceRecordEnd?.();
    }
  };

  // Get status message
  const getStatusMessage = () => {
    if (isBlocked) return "You can't send messages to this chat";
    if (!isOnline) return 'Waiting for network...';
    return null;
  };

  const statusMessage = getStatusMessage();

  return (
    <View style={[styles.container, style]}>
      {/* Status Bar */}
      {statusMessage && (
        <View style={styles.statusBar}>
          <Ionicons
            name={isBlocked ? 'ban' : 'cloud-offline'}
            size={16}
            color="#ef4444"
          />
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <Animated.View style={{ transform: [{ scale: recordingScale }] }}>
            <View style={styles.recordingDot} />
          </Animated.View>
          <Text style={styles.recordingText}>
            Recording... {formatDuration(recordingDuration)}
          </Text>
          <Text style={styles.recordingHint}>Release to send</Text>
        </View>
      )}

      {/* Input Bar */}
      <View style={styles.inputBar}>
        {/* Left Actions */}
        <View style={styles.leftActions}>
          <TouchableOpacity
            onPress={onAttachPress}
            style={styles.actionButton}
            disabled={disabled}
          >
            <Ionicons
              name="add-circle-outline"
              size={24}
              color={disabled ? '#444' : '#999'}
            />
          </TouchableOpacity>
        </View>

        {/* Input Field - Wrap in Pressable to ensure emoji picker closes on tap */}
        <Pressable
          style={{ flex: 1 }}
          onPress={() => {
            // This will trigger focus which calls onFocus
            inputRef.current?.focus();
          }}
        >
          <TextInput
            ref={ref || inputRef}
            value={value}
            onChangeText={onChangeText}
            onFocus={onFocus}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            placeholderTextColor="#666"
            style={[
              styles.input,
              selectedColor && { color: selectedColor }
            ]}
            multiline
            maxLength={maxLength}
            textAlignVertical="center"
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            editable={!disabled && !isRecording && isOnline && !isBlocked}
          />
        </Pressable>

        {/* Right Action (Send or Mic) */}
        {inputMode === 'send' ? (
          <TouchableOpacity
            onPress={handleSend}
            style={[
              styles.sendButton,
              (!value.trim() || disabled || !isOnline) && styles.sendButtonDisabled
            ]}
            disabled={!value.trim() || isLoading || disabled || !isOnline}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={value.trim() && isOnline ? '#fff' : '#666'}
              />
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPressIn={handleMicPressIn}
            onPressOut={handleMicPressOut}
            style={[styles.micButton, isRecording && styles.micButtonRecording]}
            disabled={disabled || !isOnline}
          >
            <Ionicons
              name={isRecording ? 'stop-circle' : 'mic'}
              size={24}
              color={isRecording ? '#ef4444' : '#999'}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Character Count */}
      {value.length > maxLength * 0.8 && (
        <Text style={styles.charCount}>
          {value.length}/{maxLength}
        </Text>
      )})
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0B0B0E',
    borderTopWidth: 1,
    borderTopColor: '#1F1F25',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#1a0a0a',
    gap: 8,
  },
  statusText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '500',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1a0a0a',
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
  },
  recordingText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  recordingHint: {
    color: '#999',
    fontSize: 12,
    marginLeft: 8,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    padding: 6,
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    backgroundColor: '#17171C',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#23232A',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#23232A',
    shadowOpacity: 0,
    elevation: 0,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#17171C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#23232A',
  },
  micButtonRecording: {
    backgroundColor: '#2a0a0a',
    borderColor: '#ef4444',
  },
  charCount: {
    textAlign: 'right',
    paddingHorizontal: 16,
    paddingTop: 4,
    color: '#666',
    fontSize: 11,
  },
});
