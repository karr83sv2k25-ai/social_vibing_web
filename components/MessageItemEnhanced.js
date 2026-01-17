// components/MessageItem.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Image,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SystemMessage } from './SystemMessage';

export function MessageItem({
  message,
  currentUserId,
  onEdit,
  onDelete,
  onReact,
  onReply,
  onForward,
  onLongPress
}) {
  const isOwnMessage = message.senderId === currentUserId;

  // Don't show if deleted for this user
  if (message.deletedFor?.includes(currentUserId)) {
    return null;
  }

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress(message);
    }
  };

  // Render system messages differently
  if (message.type === 'system') {
    return <SystemMessage message={message} />;
  }

  return (
    <Pressable onLongPress={handleLongPress}>
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {/* Forwarded indicator */}
        {message.forwardedFrom && (
          <View style={styles.forwardedBadge}>
            <Ionicons name="arrow-forward" size={12} color="#999" />
            <Text style={styles.forwardedText}>Forwarded</Text>
          </View>
        )}

        {/* Reply context */}
        {message.replyTo && (
          <View style={styles.replyContext}>
            <View style={styles.replyBorder} />
            <View style={styles.replyContent}>
              <Text style={styles.replyName}>
                {message.replyTo.senderId === currentUserId ? 'You' : 'Reply'}
              </Text>
              <Text style={styles.replyText} numberOfLines={2}>
                {message.replyTo.text}
              </Text>
            </View>
          </View>
        )}

        {/* Message content */}
        {message.type === 'text' && (
          <Text style={styles.messageText}>
            {message.isDeleted ? '🚫 This message was deleted' : (message.text || '[No text]')}
          </Text>
        )}

        {/* Show text even if type is not explicitly 'text' but text exists */}
        {!message.type && message.text && (
          <Text style={styles.messageText}>
            {message.text}
          </Text>
        )}

        {message.type === 'image' && message.mediaUrl && !message.isDeleted && (
          <Image
            source={{ uri: message.mediaUrl }}
            style={styles.messageImage}
            resizeMode="cover"
          />
        )}

        {message.type === 'image' && message.url && !message.isDeleted && (
          <Image
            source={{ uri: message.url }}
            style={styles.messageImage}
            resizeMode="cover"
          />
        )}

        {message.type === 'video' && (message.mediaUrl || message.url) && !message.isDeleted && (
          <View style={styles.videoContainer}>
            <Image
              source={{ uri: message.mediaThumbnail || message.mediaUrl || message.url }}
              style={styles.messageImage}
              resizeMode="cover"
            />
            <View style={styles.playButton}>
              <Ionicons name="play" size={32} color="#fff" />
            </View>
          </View>
        )}

        {message.type === 'voice' && !message.isDeleted && (
          <View style={styles.voiceMessage}>
            <TouchableOpacity style={styles.voicePlayButton}>
              <Ionicons name="play" size={20} color={isOwnMessage ? "#fff" : "#7C3AED"} />
            </TouchableOpacity>
            <View style={styles.voiceWaveform}>
              <View style={styles.voiceWave} />
              <View style={[styles.voiceWave, { height: 20 }]} />
              <View style={[styles.voiceWave, { height: 14 }]} />
              <View style={[styles.voiceWave, { height: 22 }]} />
              <View style={[styles.voiceWave, { height: 16 }]} />
              <View style={[styles.voiceWave, { height: 18 }]} />
              <View style={[styles.voiceWave, { height: 12 }]} />
            </View>
            <Text style={styles.voiceDuration}>
              {Math.floor(message.duration / 60)}:{(message.duration % 60).toString().padStart(2, '0')}
            </Text>
          </View>
        )}

        {/* Message info */}
        {message.type !== 'system' && (
          <View style={styles.messageInfo}>
            {message.isEdited && <Text style={styles.editedLabel}>edited</Text>}
            <Text style={styles.timeText}>
              {formatTime(message.createdAt)}
            </Text>
            {isOwnMessage && (
              <MessageStatusIcon status={getMessageStatus(message, currentUserId)} />
            )}
          </View>
        )}

        {/* Reactions */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <View style={styles.reactions}>
            {Object.entries(message.reactions).map(([emoji, users]) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.reaction,
                  users.includes(currentUserId) && styles.reactionHighlighted
                ]}
                onPress={() => onReact && onReact(message.id, emoji)}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                <Text style={styles.reactionCount}>{users.length}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

function MessageStatusIcon({ status }) {
  switch (status) {
    case 'sent':
      return <Ionicons name="checkmark" size={14} color="#999" />;
    case 'delivered':
      return <Ionicons name="checkmark-done" size={14} color="#999" />;
    case 'read':
      return <Ionicons name="checkmark-done" size={14} color="#7C3AED" />;
    default:
      return <Ionicons name="time-outline" size={14} color="#999" />;
  }
}

function getMessageStatus(message, currentUserId) {
  if (!message.status) return 'sent';

  const { delivered, read } = message.status;

  if (read && Object.keys(read).some(uid => uid !== currentUserId)) {
    return 'read';
  }
  if (delivered && Object.keys(delivered).some(uid => uid !== currentUserId)) {
    return 'delivered';
  }
  return 'sent';
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  messageContainer: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
    marginHorizontal: 8
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#7C3AED'
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#17171C'
  },
  systemMessage: {
    color: '#999',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center'
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22
  },
  messageImage: {
    width: 200,
    aspectRatio: 1,
    maxHeight: 300,
    borderRadius: 8,
    marginBottom: 4,
    resizeMode: 'contain'
  },
  videoContainer: {
    position: 'relative',
    width: 200,
    aspectRatio: 1,
    maxHeight: 300
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4
  },
  editedLabel: {
    color: '#999',
    fontSize: 11,
    fontStyle: 'italic'
  },
  timeText: {
    color: '#999',
    fontSize: 11
  },
  forwardedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4
  },
  forwardedText: {
    color: '#999',
    fontSize: 11,
    fontStyle: 'italic'
  },
  replyContext: {
    flexDirection: 'row',
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
    padding: 8
  },
  replyBorder: {
    width: 3,
    backgroundColor: '#7C3AED',
    borderRadius: 2,
    marginRight: 8
  },
  replyContent: {
    flex: 1
  },
  replyName: {
    color: '#7C3AED',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2
  },
  replyText: {
    color: '#ccc',
    fontSize: 13
  },
  reactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6
  },
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4
  },
  reactionHighlighted: {
    backgroundColor: 'rgba(124, 58, 237, 0.3)',
    borderWidth: 1,
    borderColor: '#7C3AED'
  },
  reactionEmoji: {
    fontSize: 14
  },
  reactionCount: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600'
  },
  voiceMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 200,
    paddingVertical: 4,
  },
  voicePlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceWaveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 24,
  },
  voiceWave: {
    width: 3,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 2,
  },
  voiceDuration: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});
