// components/MessageActionsSheet.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

export function MessageActionsSheet({ 
  visible, 
  message, 
  currentUserId,
  onClose, 
  onEdit,
  onDelete,
  onReply,
  onForward,
  onReact,
  onCopy,
  onPin
}) {
  if (!message) return null;
  
  const isOwnMessage = message.senderId === currentUserId;
  const canEdit = isOwnMessage && !message.isDeleted && message.type === 'text';
  const canDeleteForEveryone = isOwnMessage && !message.isDeleted;
  
  const actions = [
    {
      icon: 'arrow-undo',
      label: 'Reply',
      onPress: () => { onClose(); onReply(message); },
      show: true
    },
    {
      icon: 'arrow-forward',
      label: 'Forward',
      onPress: () => { onClose(); onForward(message); },
      show: !message.isDeleted
    },
    {
      icon: 'copy-outline',
      label: 'Copy',
      onPress: () => { onClose(); onCopy(message); },
      show: message.type === 'text' && !message.isDeleted
    },
    {
      icon: 'pin-outline',
      label: 'Pin',
      onPress: () => { onClose(); onPin(message); },
      show: true
    },
    {
      icon: 'create-outline',
      label: 'Edit',
      onPress: () => { onClose(); onEdit(message); },
      show: canEdit
    },
    {
      icon: 'trash-outline',
      label: 'Delete for me',
      onPress: () => { onClose(); onDelete(message, 'me'); },
      show: true,
      danger: true
    },
    {
      icon: 'trash',
      label: 'Delete for everyone',
      onPress: () => { onClose(); onDelete(message, 'everyone'); },
      show: canDeleteForEveryone,
      danger: true
    }
  ];
  
  const reactions = ['❤️', '👍', '😂', '😮', '😢', '🙏'];
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.sheet}>
          {/* Quick reactions */}
          <View style={styles.reactionsRow}>
            {reactions.map(emoji => (
              <TouchableOpacity
                key={emoji}
                style={styles.reactionButton}
                onPress={() => { onClose(); onReact(message.id, emoji); }}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Actions */}
          <View style={styles.actions}>
            {actions.filter(a => a.show).map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionItem}
                onPress={action.onPress}
              >
                <Ionicons 
                  name={action.icon} 
                  size={24} 
                  color={action.danger ? '#EF4444' : '#fff'} 
                />
                <Text style={[
                  styles.actionText,
                  action.danger && styles.dangerText
                ]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Cancel */}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end'
  },
  sheet: {
    backgroundColor: '#17171C',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: height * 0.7
  },
  reactionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  reactionButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222',
    borderRadius: 22
  },
  reactionEmoji: {
    fontSize: 24
  },
  actions: {
    paddingVertical: 8
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500'
  },
  dangerText: {
    color: '#EF4444'
  },
  cancelButton: {
    marginTop: 8,
    marginHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#222',
    borderRadius: 12,
    alignItems: 'center'
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});
