/**
 * StickerPicker Component
 * 
 * Modal component for selecting stickers to send in chat
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const ACCENT = '#7C3AED';
const BG = '#0B0B0E';
const CARD = '#17171C';
const TEXT_DIM = '#9CA3AF';

const { width } = Dimensions.get('window');
const STICKER_SIZE = (width - 80) / 4; // 4 stickers per row with padding

// Comprehensive sticker packs with all emoji types
const STICKER_PACKS = [
  {
    id: 'smileys',
    name: 'Smileys',
    icon: '😊',
    stickers: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
      '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
      '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛',
      '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
      '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄',
      '😬', '😮‍💨', '🤥', '😌', '😔', '😪', '🤤', '😴',
      '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶',
      '🥴', '😵', '😵‍💫', '🤯', '🤠', '🥳', '🥸', '😎',
    ]
  },
  {
    id: 'emotions',
    name: 'Emotions',
    icon: '😢',
    stickers: [
      '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳',
      '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭',
      '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱',
      '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️',
      '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖',
      '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿',
      '😾', '🙈', '🙉', '🙊', '💋', '💌', '💘', '💝',
    ]
  },
  {
    id: 'hearts',
    name: 'Hearts',
    icon: '❤️',
    stickers: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓',
      '💗', '💖', '💘', '💝', '💟', '♥️', '💑', '💏',
      '👨‍❤️‍👨', '👩‍❤️‍👩', '💑', '💏', '👨‍❤️‍💋‍👨', '👩‍❤️‍💋‍👩', '🫶', '💌',
    ]
  },
  {
    id: 'gestures',
    name: 'Gestures',
    icon: '👋',
    stickers: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏',
      '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
      '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛',
      '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️',
      '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂',
      '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀',
      '👁️', '👅', '👄', '🫦', '🧑', '👶', '🧒', '👦',
    ]
  },
  {
    id: 'people',
    name: 'People',
    icon: '👨',
    stickers: [
      '👨', '👩', '🧑', '👴', '👵', '🧓', '👶', '👧',
      '🧒', '👦', '👨‍🦰', '👨‍🦱', '👨‍🦳', '👨‍🦲', '👩‍🦰', '👩‍🦱',
      '👩‍🦳', '👩‍🦲', '🧔', '🧔‍♂️', '🧔‍♀️', '👱', '👱‍♂️', '👱‍♀️',
      '👨‍⚕️', '👩‍⚕️', '👨‍🎓', '👩‍🎓', '👨‍🏫', '👩‍🏫', '👨‍⚖️', '👩‍⚖️',
      '👨‍🌾', '👩‍🌾', '👨‍🍳', '👩‍🍳', '👨‍🔧', '👩‍🔧', '👨‍🏭', '👩‍🏭',
      '👨‍💼', '👩‍💼', '👨‍🔬', '👩‍🔬', '👨‍💻', '👩‍💻', '👨‍🎤', '👩‍🎤',
      '👨‍🎨', '👩‍🎨', '👨‍✈️', '👩‍✈️', '👨‍🚀', '👩‍🚀', '👨‍🚒', '👩‍🚒',
      '👮', '👮‍♂️', '👮‍♀️', '🕵️', '🕵️‍♂️', '🕵️‍♀️', '💂', '💂‍♂️',
    ]
  },
  {
    id: 'animals',
    name: 'Animals',
    icon: '🐶',
    stickers: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
      '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵',
      '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤',
      '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗',
      '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜',
      '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎',
      '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡',
      '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅',
    ]
  },
  {
    id: 'food',
    name: 'Food',
    icon: '🍕',
    stickers: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇',
      '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥',
      '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️',
      '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠',
      '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳',
      '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴',
      '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆',
      '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝',
      '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤',
      '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡',
      '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮',
      '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜',
    ]
  },
  {
    id: 'drinks',
    name: 'Drinks',
    icon: '☕',
    stickers: [
      '🥛', '☕', '🫖', '🍵', '🍶', '🍾', '🍷', '🍸',
      '🍹', '🍺', '🍻', '🥂', '🥃', '🫗', '🧃', '🧉',
      '🧊', '🥤', '🧋', '🍼', '🍯', '🧂', '🧈', '🫙',
    ]
  },
  {
    id: 'activities',
    name: 'Activities',
    icon: '⚽',
    stickers: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
      '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍',
      '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿',
      '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌',
      '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺',
      '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏊', '🤽', '🚣',
      '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅',
    ]
  },
  {
    id: 'travel',
    name: 'Travel',
    icon: '✈️',
    stickers: [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑',
      '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦯', '🦽',
      '🦼', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚔',
      '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋',
      '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇',
      '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🛰️',
      '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥️', '🛳️',
      '⛴️', '🚢', '⚓', '⛽', '🚧', '🚦', '🚥', '🗺️',
    ]
  },
  {
    id: 'objects',
    name: 'Objects',
    icon: '💎',
    stickers: [
      '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️',
      '🖲️', '🕹️', '🗜️', '💾', '💿', '📀', '📼', '📷',
      '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟',
      '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️',
      '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌',
      '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵',
      '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️',
      '🪜', '🧰', '🪛', '🔧', '🔨', '⚒️', '🛠️', '⛏️',
    ]
  },
  {
    id: 'symbols',
    name: 'Symbols',
    icon: '❤️',
    stickers: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
      '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️',
      '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈',
      '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
      '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️',
      '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️',
      '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹',
    ]
  },
  {
    id: 'flags',
    name: 'Flags',
    icon: '🏳️',
    stickers: [
      '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️',
      '🇺🇸', '🇬🇧', '🇨🇦', '🇦🇺', '🇮🇳', '🇨🇳', '🇯🇵', '🇰🇷',
      '🇫🇷', '🇩🇪', '🇮🇹', '🇪🇸', '🇧🇷', '🇲🇽', '🇷🇺', '🇿🇦',
      '🇸🇦', '🇦🇪', '🇪🇬', '🇹🇷', '🇵🇰', '🇧🇩', '🇮🇩', '🇹🇭',
      '🇻🇳', '🇵🇭', '🇲🇾', '🇸🇬', '🇳🇱', '🇧🇪', '🇨🇭', '🇸🇪',
      '🇳🇴', '🇩🇰', '🇫🇮', '🇵🇱', '🇺🇦', '🇬🇷', '🇵🇹', '🇦🇷',
    ]
  },
  {
    id: 'nature',
    name: 'Nature',
    icon: '🌸',
    stickers: [
      '🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼',
      '🌷', '🌱', '🪴', '🌲', '🌳', '🌴', '🌵', '🌾',
      '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🪹', '🪺',
      '🍄', '🌰', '🦀', '🐚', '🪸', '🪨', '🌍', '🌎',
      '🌏', '🌐', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖',
      '🌗', '🌘', '🌙', '🌚', '🌛', '🌜', '☀️', '🌝',
      '🌞', '⭐', '🌟', '✨', '⚡', '☄️', '💫', '🔥',
      '💥', '☁️', '⛅', '⛈️', '🌤️', '🌥️', '🌦️', '🌧️',
      '🌨️', '🌩️', '🌪️', '🌫️', '🌬️', '🌀', '🌈', '⛱️',
    ]
  },
];

export const StickerPicker = ({ visible, onClose, onSelectSticker }) => {
  const [activePack, setActivePack] = useState(STICKER_PACKS[0].id);

  const selectedPack = STICKER_PACKS.find(pack => pack.id === activePack) || STICKER_PACKS[0];

  const handleStickerSelect = (sticker) => {
    onSelectSticker(sticker);
    onClose();
  };

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
        <View 
          style={styles.container}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Stickers</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Pack Selector */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.packSelector}
            contentContainerStyle={styles.packSelectorContent}
          >
            {STICKER_PACKS.map(pack => (
              <TouchableOpacity
                key={pack.id}
                style={[
                  styles.packButton,
                  activePack === pack.id && styles.packButtonActive
                ]}
                onPress={() => setActivePack(pack.id)}
              >
                <Text style={styles.packIcon}>{pack.icon}</Text>
                <Text style={[
                  styles.packName,
                  activePack === pack.id && styles.packNameActive
                ]}>
                  {pack.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Sticker Grid */}
          <ScrollView style={styles.stickerGrid}>
            <View style={styles.gridContent}>
              {selectedPack.stickers.map((sticker, index) => (
                <TouchableOpacity
                  key={`${selectedPack.id}-${index}`}
                  style={styles.stickerButton}
                  onPress={() => handleStickerSelect(sticker)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sticker}>{sticker}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: CARD,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#23232A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#23232A',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  packSelector: {
    borderBottomWidth: 1,
    borderBottomColor: '#23232A',
  },
  packSelectorContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  packButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: '#23232A',
    marginRight: 8,
  },
  packButtonActive: {
    backgroundColor: ACCENT + '33',
    borderColor: ACCENT,
  },
  packIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  packName: {
    color: TEXT_DIM,
    fontSize: 14,
    fontWeight: '600',
  },
  packNameActive: {
    color: '#fff',
  },
  stickerGrid: {
    flex: 1,
  },
  gridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
  stickerButton: {
    width: STICKER_SIZE,
    height: STICKER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: BG,
    margin: 4,
    borderWidth: 1,
    borderColor: '#23232A',
  },
  sticker: {
    fontSize: 32,
  },
});

export default StickerPicker;
