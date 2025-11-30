/**
 * EmojiPicker Component
 * 
 * Inline emoji picker that appears above the keyboard for quick emoji insertion
 * Similar to WhatsApp's emoji picker
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ACCENT = '#7C3AED';
const BG = '#0B0B0E';
const CARD = '#17171C';
const TEXT_DIM = '#9CA3AF';

const { width } = Dimensions.get('window');

// Comprehensive emoji categories
const EMOJI_CATEGORIES = [
  {
    id: 'recent',
    name: 'Recent',
    icon: 'time-outline',
    emojis: ['😀', '❤️', '😂', '👍', '🎉', '🔥', '✨', '💯'],
  },
  {
    id: 'smileys',
    name: 'Smileys',
    icon: 'happy-outline',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
      '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚',
      '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭',
      '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄',
      '😬', '😮‍💨', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒',
      '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '😵‍💫', '🤯',
      '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️',
      '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥',
      '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱',
    ]
  },
  {
    id: 'gestures',
    name: 'Gestures',
    icon: 'hand-left-outline',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
      '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
      '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
      '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂',
      '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅',
    ]
  },
  {
    id: 'hearts',
    name: 'Hearts',
    icon: 'heart',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝',
      '💟', '♥️', '💌', '💋', '🫶', '💑', '💏',
    ]
  },
  {
    id: 'animals',
    name: 'Animals',
    icon: 'paw-outline',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
      '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒',
      '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇',
      '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜',
      '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕',
      '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳',
      '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣', '🐘',
    ]
  },
  {
    id: 'food',
    name: 'Food',
    icon: 'fast-food-outline',
    emojis: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐',
      '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑',
      '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅',
      '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳',
      '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔',
      '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗',
      '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟',
      '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡',
      '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬',
      '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '☕', '🫖',
      '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃',
      '🫗', '🧃', '🧉', '🧊', '🥤', '🧋',
    ]
  },
  {
    id: 'travel',
    name: 'Travel',
    icon: 'airplane-outline',
    emojis: [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
      '🛻', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵',
      '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟',
      '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇',
      '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🛰️', '🚀', '🛸',
      '🚁', '🛶', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '⛽',
    ]
  },
  {
    id: 'activities',
    name: 'Activities',
    icon: 'football-outline',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
      '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
      '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷',
      '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺',
      '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏊', '🤽', '🚣', '🧗', '🚵',
      '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫',
      '🎟️', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼',
      '🎹', '🥁', '🪘', '🎷', '🎺', '🪗', '🎸', '🪕', '🎻', '🎲',
      '♟️', '🎯', '🎳', '🎮', '🎰', '🧩',
    ]
  },
  {
    id: 'objects',
    name: 'Objects',
    icon: 'bulb-outline',
    emojis: [
      '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️',
      '🗜️', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️',
      '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️',
      '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌',
      '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶',
      '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧',
      '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫',
      '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦',
      '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️',
      '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️',
    ]
  },
  {
    id: 'symbols',
    name: 'Symbols',
    icon: 'star-outline',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
      '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
      '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
      '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳',
      '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️',
      '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️',
      '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️',
      '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓',
      '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️',
    ]
  },
  {
    id: 'flags',
    name: 'Flags',
    icon: 'flag-outline',
    emojis: [
      '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️',
      '🇺🇸', '🇬🇧', '🇨🇦', '🇦🇺', '🇮🇳', '🇨🇳', '🇯🇵', '🇰🇷',
      '🇫🇷', '🇩🇪', '🇮🇹', '🇪🇸', '🇧🇷', '🇲🇽', '🇷🇺', '🇿🇦',
      '🇸🇦', '🇦🇪', '🇪🇬', '🇹🇷', '🇵🇰', '🇧🇩', '🇮🇩', '🇹🇭',
      '🇻🇳', '🇵🇭', '🇲🇾', '🇸🇬', '🇳🇱', '🇧🇪', '🇨🇭', '🇸🇪',
      '🇳🇴', '🇩🇰', '🇫🇮', '🇵🇱', '🇺🇦', '🇬🇷', '🇵🇹', '🇦🇷',
      '🇨🇱', '🇨🇴', '🇵🇪', '🇻🇪', '🇪🇨', '🇧🇴', '🇺🇾', '🇵🇾',
      '🇳🇬', '🇰🇪', '🇪🇹', '🇬🇭', '🇹🇿', '🇺🇬', '🇿🇼', '🇲🇦',
    ]
  },
];

export const EmojiPicker = ({ visible, onClose, onEmojiSelect }) => {
  const [activeCategory, setActiveCategory] = useState(EMOJI_CATEGORIES[1].id); // Start with Smileys

  if (!visible) return null;

  const selectedCategory = EMOJI_CATEGORIES.find(cat => cat.id === activeCategory) || EMOJI_CATEGORIES[1];

  const handleEmojiSelect = (emoji) => {
    onEmojiSelect(emoji);
    // Don't close - allow multiple emoji selections
  };

  return (
    <View style={styles.container}>
      {/* Category Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryTabs}
        contentContainerStyle={styles.categoryTabsContent}
      >
        {EMOJI_CATEGORIES.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryTab,
              activeCategory === category.id && styles.categoryTabActive
            ]}
            onPress={() => setActiveCategory(category.id)}
          >
            {category.icon ? (
              <Ionicons 
                name={category.icon} 
                size={20} 
                color={activeCategory === category.id ? ACCENT : TEXT_DIM} 
              />
            ) : (
              <Text style={[
                styles.categoryEmoji,
                activeCategory === category.id && styles.categoryEmojiActive
              ]}>
                {category.emojis[0]}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Emoji Grid */}
      <ScrollView 
        style={styles.emojiScroll}
        contentContainerStyle={styles.emojiGrid}
        showsVerticalScrollIndicator={false}
      >
        {selectedCategory.emojis.map((emoji, index) => (
          <TouchableOpacity
            key={`${selectedCategory.id}-${index}`}
            style={styles.emojiButton}
            onPress={() => handleEmojiSelect(emoji)}
            activeOpacity={0.6}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Close Button */}
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={onClose}
      >
        <Ionicons name="chevron-down" size={24} color={TEXT_DIM} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: CARD,
    borderTopWidth: 1,
    borderTopColor: '#23232A',
    height: 280,
  },
  categoryTabs: {
    borderBottomWidth: 1,
    borderBottomColor: '#23232A',
    maxHeight: 50,
  },
  categoryTabsContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 2,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTabActive: {
    backgroundColor: ACCENT + '22',
  },
  categoryEmoji: {
    fontSize: 20,
    opacity: 0.6,
  },
  categoryEmojiActive: {
    opacity: 1,
  },
  emojiScroll: {
    flex: 1,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  emojiButton: {
    width: width / 8,
    height: width / 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  emoji: {
    fontSize: 28,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
    backgroundColor: BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#23232A',
  },
});

export default EmojiPicker;
