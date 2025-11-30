// components/SystemMessage.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const TEXT_DIM = '#9CA3AF';
const ACCENT = '#7C3AED';

export function SystemMessage({ message }) {
  const getIcon = () => {
    const text = message.text?.toLowerCase() || '';
    
    if (text.includes('added') || text.includes('joined')) {
      return <Ionicons name="person-add" size={14} color={TEXT_DIM} />;
    }
    if (text.includes('removed') || text.includes('left')) {
      return <Ionicons name="person-remove" size={14} color={TEXT_DIM} />;
    }
    if (text.includes('admin') || text.includes('promoted')) {
      return <MaterialCommunityIcons name="shield-account" size={14} color={ACCENT} />;
    }
    if (text.includes('name') || text.includes('renamed')) {
      return <Ionicons name="pencil" size={14} color={TEXT_DIM} />;
    }
    if (text.includes('icon') || text.includes('photo')) {
      return <Ionicons name="image" size={14} color={TEXT_DIM} />;
    }
    if (text.includes('created')) {
      return <Ionicons name="checkmark-circle" size={14} color={ACCENT} />;
    }
    
    return <Ionicons name="information-circle" size={14} color={TEXT_DIM} />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <View style={styles.content}>
        {getIcon()}
        <Text style={styles.text}>{message.text}</Text>
      </View>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#2A2A2F',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: 16,
  },
  text: {
    fontSize: 12,
    color: TEXT_DIM,
    fontStyle: 'italic',
  },
});
