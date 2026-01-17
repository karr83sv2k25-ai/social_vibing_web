import React, { useState } from 'react';
import { View, Modal, Text, TouchableOpacity, Alert, Platform, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import HomeScreen from './homescreen';
import CommunityScreen from './community';
import MessageScreen from './messagescreen';
import MarketPlaceScreen from './marketplace';
import ProfileScreen from './profile';

// Empty component for the Add button tab
const EmptyComponent = () => null;

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  const navigation = useNavigation();
  const [showAddOptions, setShowAddOptions] = useState(false);

  const handleAddOption = (option) => {
    setShowAddOptions(false);
    switch (option.id) {
      case 'post':
        // Navigate to create global post
        navigation.navigate('CreatePost');
        break;
      case 'story':
        // Navigate to create story
        navigation.navigate('CreateStory');
        break;
      case 'poll':
        // Navigate to create poll (WhatsApp style)
        navigation.navigate('CreatePoll');
        break;
      case 'quiz':
        // Navigate to create quiz
        navigation.navigate('CreateQuiz');
        break;
      case 'draft':
        // Navigate to draft posts
        navigation.navigate('Draft');
        break;
      case 'question':
        // Navigate to ask question
        navigation.navigate('CreateQuestion');
        break;
      default:
        break;
    }
  };

  const addOptions = [
    { id: 'post', name: 'Post', icon: 'document-text', color: '#FFD700', iconFamily: 'Ionicons' },
    { id: 'story', name: 'Story', icon: 'camera', color: '#FF69B4', iconFamily: 'Ionicons' },
    { id: 'poll', name: 'Poll', icon: 'bar-chart', color: '#FF8C00', iconFamily: 'Ionicons' },
    { id: 'quiz', name: 'Quiz', icon: 'help-circle', color: '#32CD32', iconFamily: 'Ionicons' },
    { id: 'draft', name: 'Draft', icon: 'create', color: '#9370DB', iconFamily: 'Ionicons' },
    { id: 'question', name: 'Question', icon: 'chatbox-ellipses', color: '#1E90FF', iconFamily: 'Ionicons' },
  ];

  const AddOptionsModal = () => (
    <Modal
      visible={showAddOptions}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAddOptions(false)}
    >
      <View style={{
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}>
        <View style={{
          backgroundColor: '#000',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 20,
          paddingBottom: 40,
        }}>
          {/* Close button */}
          <TouchableOpacity
            style={{
              alignSelf: 'center',
              marginBottom: 20,
              backgroundColor: '#fff',
              width: 40,
              height: 40,
              borderRadius: 20,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => setShowAddOptions(false)}
          >
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>

          {/* Grid of options */}
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-around',
            paddingHorizontal: 10,
          }}>
            {addOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={{
                  alignItems: 'center',
                  width: '30%',
                  marginBottom: 20,
                }}
                onPress={() => handleAddOption(option)}
              >
                <View style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: option.color,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 8,
                }}>
                  {option.iconFamily === 'Ionicons' ? (
                    <Ionicons name={option.icon} size={24} color="#fff" />
                  ) : option.iconFamily === 'FontAwesome5' ? (
                    <FontAwesome5 name={option.icon} size={24} color="#fff" />
                  ) : (
                    <MaterialCommunityIcons name={option.icon} size={24} color="#fff" />
                  )}
                </View>
                <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center' }}>
                  {option.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  const windowWidth = Dimensions.get('window').width;
  const isDesktop = windowWidth >= 768;

  return (
    <>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: false,
          tabBarStyle: {
            display: isDesktop ? 'none' : 'flex', // Show on mobile, hide on desktop
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
            backgroundColor: '#0a0a0a',
            borderTopWidth: 1,
            borderTopColor: '#1a1a1a',
            paddingBottom: Platform.OS === 'ios' ? 20 : 5,
            paddingTop: 5,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
            marginTop: -5,
            marginBottom: 5,
          },
          tabBarActiveTintColor: '#08FFE2',
          tabBarInactiveTintColor: '#888',
        }}
      >
        {/* 🏠 Home */}
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />

        {/* 👥 Community */}
        <Tab.Screen
          name="Community"
          component={CommunityScreen}
          options={{
            tabBarLabel: 'Community',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? 'people' : 'people-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />

        {/* 🛒 Market */}
        <Tab.Screen
          name="Marketplace"
          component={MarketPlaceScreen}
          options={{
            tabBarLabel: 'Market',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? 'cart' : 'cart-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />

        {/* 💬 Messages */}
        <Tab.Screen
          name="Message"
          component={MessageScreen}
          options={{
            tabBarLabel: 'Messages',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? 'chatbubble' : 'chatbubble-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />

        {/* 👤 Profile */}
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </>
  );
}
