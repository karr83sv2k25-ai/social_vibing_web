import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    FlatList,
    Dimensions,
    TextInput,
    KeyboardAvoidingView,
    ScrollView,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import AgoraRTC from 'agora-rtc-sdk-ng';
import {
    doc,
    getDoc,
    updateDoc,
    onSnapshot,
    serverTimestamp,
    deleteDoc,
    collection,
    addDoc,
    query,
    orderBy,
    getDocs,
    where,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app as firebaseApp, db } from './firebaseConfig';
import { AGORA_CONFIG, generateAgoraToken } from './agoraConfig';

const { width } = Dimensions.get('window');

export default function GroupAudioCallScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { communityId, roomId, callId, groupTitle } = route.params || {};

    const actualRoomId = roomId || callId;

    const [currentUser, setCurrentUser] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [speakingUsers, setSpeakingUsers] = useState([]);
    const [callDuration, setCallDuration] = useState(0);
    const [isCallActive, setIsCallActive] = useState(false);

    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);

    const agoraClient = useRef(null);
    const localAudioTrack = useRef(null);
    const chatScrollRef = useRef(null);

    // Fetch current user
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const auth = getAuth(firebaseApp);

                if (auth.currentUser) {
                    const userId = auth.currentUser.uid;
                    const userRef = doc(db, 'users', userId);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        const userName =
                            userData.displayName ||
                            userData.name ||
                            userData.fullName ||
                            userData.username ||
                            userData.user_name ||
                            userData.firstName ||
                            userData.user_firstname ||
                            auth.currentUser.displayName ||
                            auth.currentUser.email?.split('@')[0] ||
                            'User';

                        setCurrentUser({
                            id: userId,
                            name: userName,
                            profileImage: userData.profileImage || userData.avatar || null,
                        });
                    } else {
                        const fallbackName = auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'User';
                        setCurrentUser({
                            id: userId,
                            name: fallbackName,
                            profileImage: null,
                        });
                    }
                } else {
                    window.alert('You must be logged in to join a call');
                    navigation.goBack();
                }
            } catch (e) {
                console.error('[Agora Web] Error fetching user:', e);
                window.alert('Failed to load user data: ' + e.message);
            }
        };

        fetchCurrentUser();
    }, []);

    // Initialize Agora Web SDK and join channel
    useEffect(() => {
        if (!currentUser?.id || !communityId || !actualRoomId) return;

        const initAgora = async () => {
            try {
                if (!AGORA_CONFIG.appId || AGORA_CONFIG.appId === 'YOUR_AGORA_APP_ID_HERE') {
                    window.alert('Please add your Agora App ID in agoraConfig.js\n\nGet it from: https://console.agora.io');
                    navigation.goBack();
                    return;
                }

                console.log('[Agora Web] Creating client...');

                // Create Agora client for web
                const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
                agoraClient.current = client;

                // Set up event handlers
                client.on('user-published', async (user, mediaType) => {
                    console.log('[Agora Web] User published:', user.uid, mediaType);
                    await client.subscribe(user, mediaType);

                    if (mediaType === 'audio') {
                        user.audioTrack?.play();
                    }
                });

                client.on('user-unpublished', (user, mediaType) => {
                    console.log('[Agora Web] User unpublished:', user.uid, mediaType);
                });

                client.on('user-left', (user) => {
                    console.log('[Agora Web] User left:', user.uid);
                });

                client.on('volume-indicator', (volumes) => {
                    const speaking = volumes
                        .filter((v) => v.level > 50)
                        .map((v) => v.uid);
                    setSpeakingUsers(speaking);
                });

                // Generate channel name and token
                const channelName = actualRoomId;
                console.log('[Agora Web] Joining channel:', channelName);

                const token = await generateAgoraToken(channelName, 0, 1);
                console.log('[Agora Web] Token:', token ? 'Received' : 'NULL');

                // Join channel
                const uid = await client.join(
                    AGORA_CONFIG.appId,
                    channelName,
                    token || null,
                    null
                );

                console.log('[Agora Web] Joined with UID:', uid);

                // Create and publish audio track
                const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                localAudioTrack.current = audioTrack;

                await client.publish([audioTrack]);
                console.log('[Agora Web] Published audio track');

                // Enable volume indicator
                client.enableAudioVolumeIndicator();

                // Add to Firebase room
                const roomRef = doc(db, 'audio_calls', communityId, 'rooms', actualRoomId);
                const roomSnap = await getDoc(roomRef);

                if (roomSnap.exists()) {
                    const roomData = roomSnap.data();
                    const participants = roomData.participants || [];

                    const alreadyJoined = participants.some(p => p.userId === currentUser.id);

                    if (!alreadyJoined) {
                        await updateDoc(roomRef, {
                            participants: [...participants, {
                                userId: currentUser.id,
                                userName: currentUser.name,
                                profileImage: currentUser.profileImage || null,
                                joinedAt: new Date().toISOString(),
                                isMuted: false,
                                isSpeaking: false,
                            }],
                            updatedAt: new Date().toISOString(),
                        });
                    }
                }

                setIsCallActive(true);
                console.log('[Agora Web] Successfully joined room');

            } catch (error) {
                console.error('[Agora Web] Init error:', error);
                window.alert('Failed to initialize audio call: ' + (error.message || error));
                navigation.goBack();
            }
        };

        initAgora();

        // Cleanup
        return () => {
            const cleanup = async () => {
                try {
                    if (localAudioTrack.current) {
                        localAudioTrack.current.close();
                    }

                    if (agoraClient.current) {
                        await agoraClient.current.leave();
                    }

                    // Remove from Firebase
                    if (currentUser?.id) {
                        const roomRef = doc(db, 'audio_calls', communityId, 'rooms', actualRoomId);
                        const snap = await getDoc(roomRef);

                        if (snap.exists()) {
                            const data = snap.data();
                            const updatedParticipants = (data.participants || []).filter(
                                (p) => p.userId !== currentUser.id
                            );

                            if (updatedParticipants.length === 0 && data.createdBy === currentUser.id) {
                                await deleteDoc(roomRef);
                            } else {
                                await updateDoc(roomRef, {
                                    participants: updatedParticipants,
                                    updatedAt: serverTimestamp(),
                                });
                            }
                        }
                    }
                } catch (err) {
                    console.error('[Agora Web] Cleanup error:', err);
                }
            };

            cleanup();
        };
    }, [currentUser?.id, communityId, actualRoomId]);

    // Listen for participants updates
    useEffect(() => {
        if (!communityId || !actualRoomId) return;

        const roomRef = doc(db, 'audio_calls', communityId, 'rooms', actualRoomId);

        const unsubscribe = onSnapshot(
            roomRef,
            (snap) => {
                if (snap.exists()) {
                    const data = snap.data();
                    const participantsList = data.participants || [];

                    if (data.isActive === false || participantsList.length === 0) {
                        window.alert('The voice call has ended');
                        navigation.goBack();
                        return;
                    }

                    setParticipants(participantsList);
                } else {
                    window.alert('Voice room no longer exists');
                    navigation.goBack();
                }
            },
            (error) => {
                console.error('[Agora Web] Room snapshot error:', error);
            }
        );

        return () => unsubscribe();
    }, [communityId, actualRoomId]);

    // Listen for chat messages
    useEffect(() => {
        if (!communityId || !actualRoomId) return;

        const chatRef = collection(db, 'audio_calls', communityId, 'rooms', actualRoomId, 'chat');
        const q = query(chatRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const messages = snapshot.docs.map(docSnap => ({
                    id: docSnap.id,
                    ...docSnap.data()
                }));

                const participantIds = participants.map(p => p.userId);
                const filteredMessages = messages.filter(msg => participantIds.includes(msg.userId));

                setChatMessages(filteredMessages);

                if (!showChat && filteredMessages.length > chatMessages.length) {
                    setUnreadCount(prev => prev + 1);
                }

                setTimeout(() => {
                    chatScrollRef.current?.scrollToEnd({ animated: true });
                }, 100);
            },
            (error) => {
                console.error('[Agora Web] Chat snapshot error:', error);
            }
        );

        return () => unsubscribe();
    }, [communityId, actualRoomId, participants, showChat]);

    // Reset unread count
    useEffect(() => {
        if (showChat) {
            setUnreadCount(0);
        }
    }, [showChat]);

    // Call duration timer
    useEffect(() => {
        if (!isCallActive) return;

        const interval = setInterval(() => {
            setCallDuration((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isCallActive]);

    // Toggle mute
    const toggleMute = async () => {
        if (!localAudioTrack.current) return;

        try {
            const newMutedState = !isMuted;
            await localAudioTrack.current.setEnabled(!newMutedState);
            setIsMuted(newMutedState);
            console.log('[Agora Web] Mute:', newMutedState);
        } catch (e) {
            console.error('[Agora Web] Error toggling mute:', e);
        }
    };

    // End call
    const endCall = async () => {
        try {
            const roomRef = doc(db, 'audio_calls', communityId, 'rooms', actualRoomId);
            const roomSnap = await getDoc(roomRef);

            if (roomSnap.exists()) {
                const data = roomSnap.data();
                const isCreator = data.createdBy === currentUser?.id;

                if (isCreator) {
                    if (window.confirm('You started this call. Do you want to end it for everyone?')) {
                        await endSession();
                    } else {
                        navigation.goBack();
                    }
                } else {
                    navigation.goBack();
                }
            } else {
                navigation.goBack();
            }
        } catch (error) {
            console.error('[Agora Web] Error in endCall:', error);
            navigation.goBack();
        }
    };

    // End session
    const endSession = async () => {
        if (!window.confirm('End this voice call for all participants?')) {
            return;
        }

        // Navigate immediately
        navigation.goBack();

        // Update in background
        try {
            const roomRef = doc(db, 'audio_calls', communityId, 'rooms', actualRoomId);
            await updateDoc(roomRef, {
                isActive: false,
                closedAt: serverTimestamp(),
                closedBy: currentUser.id,
            });
        } catch (error) {
            console.error('[Agora Web] Error ending session:', error);
        }
    };

    // Send chat message
    const sendChatMessage = async () => {
        if (!chatInput.trim() || !currentUser) return;

        try {
            const chatRef = collection(db, 'audio_calls', communityId, 'rooms', actualRoomId, 'chat');
            await addDoc(chatRef, {
                userId: currentUser.id,
                userName: currentUser.name,
                profileImage: currentUser.profileImage,
                message: chatInput.trim(),
                createdAt: serverTimestamp(),
            });

            setChatInput('');
            Keyboard.dismiss();
        } catch (error) {
            console.error('[Agora Web] Error sending message:', error);
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const renderParticipant = ({ item }) => {
        const isSpeaking = speakingUsers.includes(item.userId);

        return (
            <View style={styles.participantCard}>
                <View style={[styles.avatarContainer, isSpeaking && styles.avatarSpeaking]}>
                    {item.profileImage ? (
                        <Image source={{ uri: item.profileImage }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>
                                {item.userName?.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    {item.isMuted && (
                        <View style={styles.mutedBadge}>
                            <Ionicons name="mic-off" size={12} color="#fff" />
                        </View>
                    )}
                </View>
                <Text style={styles.participantName} numberOfLines={1}>
                    {item.userName}
                </Text>
            </View>
        );
    };

    const renderChatMessage = ({ item }) => {
        const isOwnMessage = item.userId === currentUser?.id;

        return (
            <View style={[styles.chatMessage, isOwnMessage && styles.chatMessageOwn]}>
                <View style={styles.chatMessageContent}>
                    {!isOwnMessage && (
                        <Text style={styles.chatSenderName}>{item.userName}</Text>
                    )}
                    <Text style={styles.chatMessageText}>{item.message}</Text>
                </View>
            </View>
        );
    };

    return (
        <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Top Bar */}
                <View style={styles.topBar}>
                    <TouchableOpacity style={styles.closeButton} onPress={endCall}>
                        <Ionicons name="chevron-down" size={28} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.participantCount}>
                        <Text style={styles.participantCountText}>
                            {participants.length} {participants.length === 1 ? 'Person' : 'People'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.chatToggle}
                        onPress={() => setShowChat(!showChat)}
                    >
                        <Ionicons name="chatbubbles" size={24} color="#fff" />
                        {unreadCount > 0 && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadText}>{unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Voice Chat Header */}
                <View style={styles.voiceChatHeader}>
                    <MaterialCommunityIcons name="microphone" size={48} color="#BF2EF0" />
                    <Text style={styles.roomTitle}>{groupTitle || 'Voice Chat'}</Text>
                    <Text style={styles.duration}>{formatDuration(callDuration)}</Text>
                </View>

                {/* Participants Grid */}
                {!showChat && (
                    <View style={styles.participantsContainer}>
                        <FlatList
                            data={participants}
                            renderItem={renderParticipant}
                            keyExtractor={(item) => item.userId}
                            numColumns={3}
                            contentContainerStyle={styles.participantsList}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                )}

                {/* Chat Section */}
                {showChat && (
                    <KeyboardAvoidingView style={styles.chatContainer} behavior="padding">
                        <ScrollView
                            ref={chatScrollRef}
                            style={styles.chatMessages}
                            contentContainerStyle={styles.chatMessagesContent}
                        >
                            {chatMessages.map((msg) => renderChatMessage({ item: msg }))}
                        </ScrollView>

                        <View style={styles.chatInputContainer}>
                            <TextInput
                                style={styles.chatInput}
                                placeholder="Type a message..."
                                placeholderTextColor="#666"
                                value={chatInput}
                                onChangeText={setChatInput}
                                onSubmitEditing={sendChatMessage}
                                returnKeyType="send"
                            />
                            <TouchableOpacity
                                style={styles.sendButton}
                                onPress={sendChatMessage}
                                disabled={!chatInput.trim()}
                            >
                                <Ionicons
                                    name="send"
                                    size={20}
                                    color={chatInput.trim() ? '#BF2EF0' : '#666'}
                                />
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                )}

                {/* Controls */}
                <View style={styles.controls}>
                    <TouchableOpacity
                        style={[styles.controlButton, isMuted && styles.controlButtonActive]}
                        onPress={toggleMute}
                    >
                        <Ionicons
                            name={isMuted ? 'mic-off' : 'mic'}
                            size={28}
                            color={isMuted ? '#FF4757' : '#fff'}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
                        <MaterialCommunityIcons name="phone-hangup" size={32} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.endSessionButton}
                        onPress={endSession}
                    >
                        <MaterialCommunityIcons name="close-circle" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Status Indicator */}
                <View style={styles.statusContainer}>
                    <View style={[styles.statusIndicator, isCallActive && styles.statusActive]} />
                    <Text style={styles.statusText}>
                        {isCallActive ? 'Connected via Agora Web' : 'Connecting...'}
                    </Text>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    closeButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    participantCount: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    participantCountText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    chatToggle: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#FF4757',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    voiceChatHeader: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    roomTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 12,
    },
    duration: {
        color: '#aaa',
        fontSize: 16,
        marginTop: 4,
    },
    participantsContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    participantsList: {
        paddingVertical: 20,
    },
    participantCard: {
        width: width / 3 - 24,
        alignItems: 'center',
        marginBottom: 24,
        marginHorizontal: 4,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: 'transparent',
        marginBottom: 8,
    },
    avatarSpeaking: {
        borderColor: '#BF2EF0',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
        backgroundColor: '#BF2EF0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
    },
    mutedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#FF4757',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    participantName: {
        color: '#fff',
        fontSize: 14,
        textAlign: 'center',
    },
    chatContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    chatMessages: {
        flex: 1,
    },
    chatMessagesContent: {
        paddingVertical: 20,
    },
    chatMessage: {
        marginBottom: 12,
        maxWidth: '70%',
        alignSelf: 'flex-start',
    },
    chatMessageOwn: {
        alignSelf: 'flex-end',
    },
    chatMessageContent: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 12,
    },
    chatSenderName: {
        color: '#BF2EF0',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    chatMessageText: {
        color: '#fff',
        fontSize: 14,
    },
    chatInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 16,
    },
    chatInput: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        paddingVertical: 8,
    },
    sendButton: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 20,
        gap: 20,
    },
    controlButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlButtonActive: {
        backgroundColor: 'rgba(255,71,87,0.3)',
    },
    endCallButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#FF4757',
        justifyContent: 'center',
        alignItems: 'center',
    },
    endSessionButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,71,87,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 16,
    },
    statusIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#666',
        marginRight: 8,
    },
    statusActive: {
        backgroundColor: '#4CAF50',
    },
    statusText: {
        color: '#aaa',
        fontSize: 12,
    },
});
