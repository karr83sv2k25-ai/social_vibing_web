import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Share,
  RefreshControl,
} from 'react-native';
import { Ionicons, Entypo } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  updateDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
} from 'firebase/firestore';
import { app, db } from './firebaseConfig';
import NetInfo from '@react-native-community/netinfo';
import CacheManager from './cacheManager';
import { InlineStatus } from './components/StatusBadge';
import StatusBadge from './components/StatusBadge';
import StatusSelector from './components/StatusSelector';
import { useFocusEffect } from '@react-navigation/native';
import {
  isWeb,
  isDesktopOrLarger,
  getContainerWidth,
  getResponsivePadding,
  getResponsiveFontSize
} from './utils/webResponsive';
import HomescreenDesktopWrapper from './components/HomescreenDesktopWrapper';

const { width } = Dimensions.get('window');
const IMAGE_WIDTH = 267;
const SPACING = 10;

// Top communities will be dynamically loaded

const buttons = ['Discovery', 'Following', 'Communities', 'Streaming'];

const posts = [
  {
    id: 1,
    name: 'Hitachi BlackSoul',
    username: '@hitachi',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque euismod.',
    likes: 123,
    images: [
      require('./assets/post1.1.jpg'),
      require('./assets/post1.2.jpg'),
      require('./assets/post1.3.jpg'),
    ],
  },
  {
    id: 2,
    name: 'Hitachi BlackSoul',
    username: '@hitachi',
    text: 'Just tried this amazing app feature, and it’s really cool! #ReactNative #UI',
    likes: 98,
    images: [require('./assets/post2.png')],
  },
];

const getPostDocInfo = (post) => {
  if (!post || !post.id) {
    return null;
  }

  const type = post.type || 'post';
  const collectionMap = {
    blog: 'blogs',
    image: 'posts',
    post: 'posts',
    poll: 'polls',
    quiz: 'quizzes',
    question: 'questions',
  };

  const commentsCollectionMap = {
    question: 'answers',
  };

  const countFieldMap = {
    question: 'answerCount',
  };

  const baseCollection = collectionMap[type] || 'posts';
  const commentsCollectionName = commentsCollectionMap[type] || 'comments';
  const countField = countFieldMap[type] || 'comments';

  if (post.scope === 'global' || !post.communityId) {
    const docRef = doc(db, baseCollection, post.id);
    const commentsCol = collection(db, baseCollection, post.id, commentsCollectionName);
    return {
      docRef,
      commentsCol,
      isGlobal: true,
      collectionName: baseCollection,
      commentsCollectionName,
      countField,
    };
  }

  const docRef = doc(db, 'communities', post.communityId, baseCollection, post.id);
  const commentsCol = collection(
    db,
    'communities',
    post.communityId,
    baseCollection,
    post.id,
    commentsCollectionName,
  );

  return {
    docRef,
    commentsCol,
    isGlobal: false,
    collectionName: baseCollection,
    commentsCollectionName,
    countField,
  };
};

const Post = ({
  post,
  onLike,
  onComment,
  onShare,
  onFollow,
  onDelete,
  onPollVote,
  pollVoteBusy,
  onStartQuiz,
  onImagePress,
  onProfilePress,
  isLiked,
  isFollowing,
  likeBusy,
  followBusy,
  currentUser,
  imageLoadErrors,
  setImageLoadErrors,
  imageDimensions,
  setImageDimensions,
  activeVideoPostId,
  onVideoPlayChange,
}) => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef(null);

  // Pause video if another video starts playing or if this video is no longer active
  useEffect(() => {
    if (activeVideoPostId !== post.id && isVideoPlaying) {
      setIsVideoPlaying(false);
      if (videoRef.current) {
        videoRef.current.pauseAsync?.().catch(() => { });
      }
    }
  }, [activeVideoPostId, post.id, isVideoPlaying]);

  const handlePlayVideo = () => {
    setIsVideoPlaying(true);
    if (onVideoPlayChange) {
      onVideoPlayChange(post.id);
    }
  };
  // Don't show follow button if post is by current logged-in user
  const showFollowButton = post.authorId && onFollow && currentUser?.id && post.authorId !== currentUser.id;
  const canDelete = post.authorId && currentUser?.id && post.authorId === currentUser.id;

  const handleDeletePress = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete && onDelete(post)
        }
      ]
    );
  };

  const currentUserId = currentUser?.id || null;

  const commentCount = typeof post.commentCount === 'number'
    ? post.commentCount
    : typeof post.comments === 'number'
      ? post.comments
      : typeof post.answerCount === 'number'
        ? post.answerCount
        : 0;

  const commentLabel = post.type === 'question' ? 'Answers' : 'Comments';
  const totalPollVotes = Array.isArray(post.options)
    ? post.options.reduce((sum, option) => sum + (option.votes || 0), 0)
    : typeof post.totalVotes === 'number'
      ? post.totalVotes
      : 0;

  return (
    <View style={styles.postContainer}>
      {/* Author Info */}
      <View style={styles.postHeader}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center' }}
          onPress={() => onProfilePress && post.authorId && onProfilePress(post.authorId)}
          activeOpacity={0.7}
        >
          {post.authorImage ? (
            <Image
              source={{ uri: post.authorImage }}
              style={styles.postProfileImage}
            />
          ) : (
            <View style={[styles.postProfileImage, { backgroundColor: '#E1E8ED', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="person" size={30} color="#657786" />
            </View>
          )}
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.postName}>{post.authorName || 'User'}</Text>
            <Text style={styles.postUsername}>
              {post.createdAt
                ? new Date(post.createdAt.toDate?.() || post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Recently'
              }
            </Text>
            {/* Author Status */}
            {post.authorId && (
              <View style={{ marginTop: 2 }}>
                <InlineStatus userId={post.authorId} isOwnStatus={false} />
              </View>
            )}
          </View>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {canDelete && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeletePress}
            >
              <Ionicons name="trash-outline" size={20} color="#ff4b6e" />
            </TouchableOpacity>
          )}
          {showFollowButton && (
            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowing && styles.followButtonFollowing,
                followBusy && { opacity: 0.6 }
              ]}
              onPress={() => onFollow(post.authorId)}
              disabled={followBusy}
            >
              <Text style={[styles.followText, isFollowing && styles.followTextFollowing]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Blog Post - Show Title and Content */}
      {post.type === 'blog' && (
        <>
          <Text style={styles.postTitle}>{post.title}</Text>
          <Text style={styles.postText} numberOfLines={3}>{post.content}</Text>
        </>
      )}

      {/* Image Post - Show Image and Caption */}
      {post.type === 'image' && (
        <>
          {post.imageUri && !imageLoadErrors[`${post.id}-image`] ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onImagePress && onImagePress(post.imageUri, [post.imageUri], 0)}
            >
              <Image
                source={{ uri: post.imageUri }}
                style={[
                  styles.postImageFull,
                  imageDimensions[`${post.id}-image`] && {
                    aspectRatio: imageDimensions[`${post.id}-image`].aspectRatio
                  }
                ]}
                resizeMode="contain"
                onLoad={(e) => {
                  if (e?.nativeEvent?.source) {
                    const { width, height } = e.nativeEvent.source;
                    if (width && height) {
                      setImageDimensions(prev => ({
                        ...prev,
                        [`${post.id}-image`]: {
                          width,
                          height,
                          aspectRatio: width / height
                        }
                      }));
                    }
                  }
                }}
                onError={(error) => {
                  console.log('Image load error for post:', post.id, error.nativeEvent?.error);
                  setImageLoadErrors(prev => ({ ...prev, [`${post.id}-image`]: true }));
                }}
              />
            </TouchableOpacity>
          ) : post.imageUri ? (
            <View style={[styles.postImageFull, styles.imageFallback]}>
              <Ionicons name="image-outline" size={48} color="#666" />
              <Text style={styles.imageFallbackText}>Image unavailable</Text>
            </View>
          ) : (
            <View style={styles.noImagePlaceholder}>
              <Ionicons name="image-outline" size={48} color="#666" />
              <Text style={styles.noImageText}>No image available</Text>
            </View>
          )}
          {post.caption && (
            <Text style={styles.postText}>{post.caption}</Text>
          )}
        </>
      )}

      {/* Global/Text Post */}
      {post.type === 'post' && (
        <>
          {post.text ? <Text style={styles.postText}>{post.text}</Text> : null}
          {Array.isArray(post.images) && post.images.length > 0 && (
            <TouchableOpacity
              style={styles.globalPostImageWrapper}
              activeOpacity={0.9}
              onPress={() => onImagePress && onImagePress(post.images[0], post.images, 0)}
            >
              {imageLoadErrors[`${post.id}-0`] ? (
                <View style={[styles.postImageFull, styles.imageFallback]}>
                  <Ionicons name="image-outline" size={48} color="#666" />
                  <Text style={styles.imageFallbackText}>Image not available</Text>
                </View>
              ) : (
                <Image
                  source={{ uri: post.images[0] }}
                  style={[
                    styles.postImageFull,
                    imageDimensions[`${post.id}-0`] && {
                      aspectRatio: imageDimensions[`${post.id}-0`].aspectRatio
                    }
                  ]}
                  resizeMode="contain"
                  onLoad={(e) => {
                    if (e?.nativeEvent?.source) {
                      const { width, height } = e.nativeEvent.source;
                      if (width && height) {
                        setImageDimensions(prev => ({
                          ...prev,
                          [`${post.id}-0`]: {
                            width,
                            height,
                            aspectRatio: width / height
                          }
                        }));
                      }
                    }
                  }}
                  onError={(error) => {
                    console.log('Image load error:', post.images[0], error.nativeEvent?.error);
                    setImageLoadErrors(prev => ({ ...prev, [`${post.id}-0`]: true }));
                  }}
                />
              )}
              {post.images.length > 1 && (
                <View style={styles.multipleImagesBadge}>
                  <Text style={styles.multipleImagesText}>+{post.images.length - 1}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          {Array.isArray(post.videos) && post.videos.length > 0 && (
            <View style={styles.globalPostImageWrapper}>
              <Video
                ref={videoRef}
                source={{ uri: post.videos[0] }}
                style={[
                  styles.postVideoFull,
                  imageDimensions[`${post.id}-video`]
                    ? { aspectRatio: imageDimensions[`${post.id}-video`].aspectRatio }
                    : { aspectRatio: 16 / 9 }
                ]}
                useNativeControls={isVideoPlaying}
                resizeMode="contain"
                shouldPlay={isVideoPlaying}
                isLooping={false}
                isMuted={false}
                volume={1.0}
                onLoad={(data) => {
                  if (data?.naturalSize) {
                    const { width, height } = data.naturalSize;
                    if (width && height && height > 0) {
                      setImageDimensions(prev => ({
                        ...prev,
                        [`${post.id}-video`]: {
                          width,
                          height,
                          aspectRatio: width / height
                        }
                      }));
                    }
                  }
                }}
                onPlaybackStatusUpdate={(status) => {
                  if (status.didJustFinish) {
                    setIsVideoPlaying(false);
                  }
                }}
              />
              {!isVideoPlaying && (
                <TouchableOpacity
                  style={styles.videoPlayButton}
                  onPress={handlePlayVideo}
                  activeOpacity={0.8}
                >
                  <View style={styles.videoPlayButtonCircle}>
                    <Ionicons name="play" size={40} color="#fff" style={{ marginLeft: 4 }} />
                  </View>
                </TouchableOpacity>
              )}
              {post.videos.length > 1 && (
                <View style={styles.multipleImagesBadge}>
                  <Text style={styles.multipleImagesText}>+{post.videos.length - 1}</Text>
                </View>
              )}
            </View>
          )}
        </>
      )}

      {/* Poll */}
      {post.type === 'poll' && (
        <View style={styles.pollContainer}>
          <Text style={styles.pollQuestion}>{post.question}</Text>
          <Text style={styles.pollMeta}>
            {totalPollVotes} vote{totalPollVotes === 1 ? '' : 's'}
            {post.allowMultipleAnswers ? ' • Multiple answers allowed' : ''}
          </Text>
          {Array.isArray(post.options) && post.options.length > 0 ? (
            post.options.map((option, index) => {
              const votes = typeof option?.votes === 'number' ? option.votes : 0;
              const voters = Array.isArray(option?.voters) ? option.voters : [];
              const percent = totalPollVotes > 0 ? Math.round((votes / totalPollVotes) * 100) : 0;
              const userSelected = currentUserId ? voters.includes(currentUserId) : false;
              const minFill = userSelected ? 12 : votes > 0 ? 8 : 0;

              return (
                <TouchableOpacity
                  key={`${option?.text || 'option'}-${index}`}
                  activeOpacity={0.85}
                  style={[
                    styles.pollOption,
                    userSelected && styles.pollOptionSelected,
                    (pollVoteBusy || !onPollVote) && styles.pollOptionDisabled,
                  ]}
                  onPress={() => onPollVote && onPollVote(post, index)}
                  disabled={pollVoteBusy || !onPollVote}
                >
                  <View style={styles.pollOptionBarTrack}>
                    <View
                      style={[
                        styles.pollOptionBarFill,
                        userSelected && styles.pollOptionBarFillSelected,
                        { width: `${Math.min(Math.max(percent, minFill), 100)}%` },
                      ]}
                    />
                  </View>
                  <View style={styles.pollOptionRow}>
                    <Text
                      style={[
                        styles.pollOptionText,
                        userSelected && styles.pollOptionTextSelected,
                      ]}
                    >
                      {option?.text || `Option ${index + 1}`}
                    </Text>
                    <Text style={styles.pollOptionVotes}>
                      {votes} ({percent}%)
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.pollEmptyText}>No options available.</Text>
          )}
        </View>
      )}

      {/* Quiz */}
      {post.type === 'quiz' && (
        <View style={styles.quizContainer}>
          <Text style={styles.quizTitle}>{post.title || 'Untitled Quiz'}</Text>
          <Text style={styles.quizMeta}>
            {Array.isArray(post.questions) ? post.questions.length : post.questionCount || 0} question
            {Array.isArray(post.questions) ? (post.questions.length === 1 ? '' : 's') : ((post.questionCount || 0) === 1 ? '' : 's')}
            {' • '}
            {post.attempts || 0} attempt{(post.attempts || 0) === 1 ? '' : 's'}
          </Text>
          {Array.isArray(post.questions) && post.questions.length > 0 && (
            <View style={styles.quizPreview}>
              <Text style={styles.quizPreviewLabel}>Sample question:</Text>
              <Text style={styles.quizPreviewQuestion} numberOfLines={2}>
                {post.questions[0].question}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.quizActionButton}
            activeOpacity={0.85}
            onPress={() => onStartQuiz && onStartQuiz(post)}
            disabled={!onStartQuiz}
          >
            <Text style={styles.quizActionButtonText}>Attempt Quiz</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Question */}
      {post.type === 'question' && (
        <View style={styles.questionContainer}>
          <View style={styles.questionHeaderRow}>
            <Text style={styles.questionTag}>Question</Text>
            {post.category ? (
              <Text style={styles.questionCategory}>{post.category}</Text>
            ) : null}
          </View>
          <Text style={styles.questionTitle}>{post.question}</Text>
          {post.description ? (
            <Text style={styles.questionDescription}>{post.description}</Text>
          ) : null}
          {post.image ? (
            imageLoadErrors[`${post.id}-question`] ? (
              <View style={[styles.questionImage, styles.imageFallback]}>
                <Ionicons name="image-outline" size={40} color="#666" />
              </View>
            ) : (
              <Image
                source={{ uri: post.image }}
                style={styles.questionImage}
                resizeMode="cover"
                onError={(error) => {
                  console.log('Question image load error:', post.image, error.nativeEvent?.error);
                  setImageLoadErrors(prev => ({ ...prev, [`${post.id}-question`]: true }));
                }}
              />
            )
          ) : null}
        </View>
      )}

      {/* Community Share */}
      {post.type === 'community_share' && (
        <View style={styles.communityShareContainer}>
          <Text style={styles.postText}>{post.text}</Text>
          <TouchableOpacity
            style={styles.communityCard}
            onPress={async () => {
              if (post.communityId) {
                // Check if user is already a member - if yes, go directly to community
                // If no, navigate to Community screen for validation flow
                try {
                  const { getAuth } = await import('firebase/auth');
                  const { collection, query, where, getDocs, doc, getDoc } = await import('firebase/firestore');
                  const { db } = await import('./firebaseConfig');

                  const auth = getAuth();
                  if (auth.currentUser) {
                    // Check membership
                    const q = query(
                      collection(db, 'communities_members'),
                      where('user_id', '==', auth.currentUser.uid),
                      where('community_id', '==', post.communityId)
                    );
                    const snap = await getDocs(q);

                    if (!snap.empty) {
                      // Already a member - go directly to community
                      navigation.navigate('GroupInfo', { communityId: post.communityId });
                      return;
                    }

                    // Check fallback membership format
                    try {
                      const membershipId = `${auth.currentUser.uid}_${post.communityId}`;
                      const membershipDoc = await getDoc(doc(db, 'communities_members', membershipId));
                      if (membershipDoc.exists()) {
                        navigation.navigate('GroupInfo', { communityId: post.communityId });
                        return;
                      }
                    } catch (e) {
                      // Continue to validation flow
                    }
                  }
                } catch (error) {
                  console.log('Error checking membership:', error);
                }

                // Not a member - show validation flow
                navigation.navigate('Community', {
                  openCommunityId: post.communityId,
                  openCommunityData: {
                    id: post.communityId,
                    community_id: post.communityId,
                    name: post.communityName,
                    community_title: post.communityName,
                    profileImage: post.communityImage,
                    img: post.communityImage ? { uri: post.communityImage } : null,
                    description: post.communityDescription,
                    community_members: post.memberCount || 0,
                  }
                });
              }
            }}
          >
            {post.communityImage ? (
              <Image
                source={{ uri: post.communityImage }}
                style={styles.communityCardImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.communityCardImage, styles.imageFallback]}>
                <Ionicons name="people" size={40} color="#666" />
              </View>
            )}
            <View style={styles.communityCardInfo}>
              <Text style={styles.communityCardName}>{post.communityName || 'Community'}</Text>
              {post.communityDescription ? (
                <Text style={styles.communityCardDescription} numberOfLines={2}>
                  {post.communityDescription}
                </Text>
              ) : null}
              <View style={styles.communityCardStats}>
                <Ionicons name="people" size={14} color="#888" />
                <Text style={styles.communityCardStatsText}>
                  {post.memberCount || 0} members
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.postFooter}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center' }}
          onPress={() => onLike && onLike(post)}
          disabled={likeBusy}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={24}
            color={isLiked ? '#ff4b6e' : '#fff'}
          />
          <Text style={{ color: isLiked ? '#ff4b6e' : '#fff', marginLeft: 5 }}>
            {post.likes || 0}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 20 }}
          onPress={() => onComment && onComment(post)}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#fff" />
          <Text style={{ color: '#fff', marginLeft: 5 }}>{commentCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 20 }}
          onPress={() => onShare && onShare(post)}
        >
          <Ionicons name="share-social-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// OPTIMIZATION: Export memoized component to prevent unnecessary re-renders
const HomeScreen = React.memo(({ navigation }) => {
  const [activeButton, setActiveButton] = useState(null);
  const [userName, setUserName] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likeProcessingIds, setLikeProcessingIds] = useState([]);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSaving, setCommentSaving] = useState(false);
  const [selectedPostForComment, setSelectedPostForComment] = useState(null);
  const [postComments, setPostComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsUnsubscribe, setCommentsUnsubscribe] = useState(null);
  const [followLoadingIds, setFollowLoadingIds] = useState([]);
  const [followingUserIds, setFollowingUserIds] = useState([]);
  const [pollVoteBusyIds, setPollVoteBusyIds] = useState([]);
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizResponses, setQuizResponses] = useState({});
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [imageLoadErrors, setImageLoadErrors] = useState({});
  const [imageDimensions, setImageDimensions] = useState({});
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [allImagesInPost, setAllImagesInPost] = useState([]);
  const [activeVideoPostId, setActiveVideoPostId] = useState(null);
  const scrollViewRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const [topCommunities, setTopCommunities] = useState([]);
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [joiningCommunityId, setJoiningCommunityId] = useState(null);
  const [statusSelectorVisible, setStatusSelectorVisible] = useState(false);

  // Refs for tracking data loading
  const hasFetchedPosts = useRef(false);
  const lastLoadTimeRef = useRef(0);
  const shouldRefreshOnFocus = useRef(false);
  const isFetchingPosts = useRef(false);

  // Fetch current user - always from Firestore for real-time data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const auth = getAuth(app);
        // db is now imported globally

        if (auth.currentUser) {
          const userId = auth.currentUser.uid;

          // Set basic user info from auth immediately for instant UI
          const basicUserInfo = {
            id: userId,
            uid: userId,
            name: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'User',
            profileImage: auth.currentUser.photoURL || null,
            email: auth.currentUser.email
          };

          setUserName(basicUserInfo.name);
          setProfileImage(basicUserInfo.profileImage);
          setCurrentUser(basicUserInfo);

          // Immediately fetch fresh data from Firestore for real-time updates
          try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              const userData = userSnap.data();
              const fullName = [userData.firstName || userData.user_firstname, userData.lastName || userData.user_lastname].filter(Boolean).join(' ').trim();
              const userName = fullName || userData.username || userData.user_name || userData.displayName || userData.name || auth.currentUser.displayName || 'User';
              const img = userData.profileImage || userData.user_picture || userData.profile_image || userData.profile_picture || userData.photoURL || null;

              const userProfile = {
                id: userId,
                uid: userId,
                name: userName,
                profileImage: img,
                email: userData.email || userData.user_email || auth.currentUser.email,
                ...userData
              };

              console.log('✅ Fresh user data loaded from Firestore');
              setUserName(userName);
              setProfileImage(img);
              setCurrentUser(userProfile);

              // Update cache with fresh data
              await CacheManager.saveUserProfile(userId, userProfile);
            }
          } catch (firestoreError) {
            console.warn('⚠️  Could not fetch user from Firestore (using auth data):', firestoreError.message);
            // Continue with auth data - don't throw error
          }
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };

    fetchCurrentUser();

    // NetInfo listener
    NetInfo.fetch().then(state => setIsConnected(Boolean(state.isConnected))).catch(() => setIsConnected(false));
    const unsubscribeNet = NetInfo.addEventListener(state => setIsConnected(Boolean(state.isConnected)));

    return () => {
      unsubscribeNet();
    };
  }, []);

  // Fetch top 3 communities by member count - always fresh from Firestore
  useEffect(() => {
    const fetchTopCommunities = async () => {
      try {
        console.log('🔄 Fetching fresh communities from Firestore');
        // Always fetch fresh communities data
        const communitiesRef = collection(db, 'communities');
        const communitiesSnapshot = await getDocs(communitiesRef);

        const communitiesList = [];
        communitiesSnapshot.forEach((doc) => {
          const data = doc.data();
          const memberCount = data.members_count ||
            (Array.isArray(data.members) ? data.members.length : 0) ||
            (Array.isArray(data.community_members) ? data.community_members.length :
              (typeof data.community_members === 'number' ? data.community_members : 0));

          communitiesList.push({
            id: doc.id,
            community_id: doc.id,
            name: data.name || data.community_title || data.title || 'Community',
            description: data.description || data.community_description || '',
            category: data.category || data.community_category || '',
            img: data.img || data.image || data.community_image || null,
            memberCount,
            members: data.members || []
          });
        });

        // Sort by member count and get top 3
        const sortedCommunities = communitiesList.sort((a, b) => b.memberCount - a.memberCount).slice(0, 3);
        setTopCommunities(sortedCommunities);
      } catch (error) {
        console.error('Error fetching top communities:', error);
      }
    };

    fetchTopCommunities();
  }, []);

  // Separate useEffect for joined communities listener - depends on user authentication
  useEffect(() => {
    const auth = getAuth(app);
    let unsubscribe = null;

    // Only set up listener if user is authenticated
    if (auth.currentUser) {
      const userId = auth.currentUser.uid;

      try {
        const membershipsQuery = query(
          collection(db, 'communities_members'),
          where('user_id', '==', userId)
        );

        // Real-time listener for joined communities
        unsubscribe = onSnapshot(membershipsQuery, (snapshot) => {
          const joinedIds = snapshot.docs.map(doc => doc.data().community_id).filter(Boolean);
          setJoinedCommunities(joinedIds);
          console.log('✅ Updated joined communities:', joinedIds.length);
        }, (error) => {
          // Only log error if user is still authenticated
          if (auth.currentUser) {
            console.error('Error listening to joined communities:', error);
          }
          setJoinedCommunities([]);
        });
      } catch (error) {
        console.error('Error setting up communities listener:', error);
        setJoinedCommunities([]);
      }
    } else {
      // Clear joined communities when user is not authenticated
      setJoinedCommunities([]);
    }

    // Cleanup listener on unmount or when auth state changes
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUser]); // Re-run when currentUser changes (login/logout)

  // Fetch all posts (global + community)
  const fetchAllPosts = useCallback(async (user, isRefreshing = false) => {
    // Prevent concurrent fetches
    if (isFetchingPosts.current) {
      console.log('⏭️ Skipping fetchAllPosts - already in progress');
      return;
    }

    isFetchingPosts.current = true;
    console.log('🚀 fetchAllPosts called - isRefreshing:', isRefreshing, 'currentUser:', user?.uid || 'not logged in');

    // 🛑 CRITICAL GUARD: If the user object is not valid, abort immediately.
    if (!user || (!user.uid && !user.id)) {
      console.error('❌ ABORTING fetchAllPosts: User object is invalid or missing UID.');
      isFetchingPosts.current = false;
      setLoading(false);
      setRefreshing(false);
      setAllPosts([]);
      return;
    }

    // Ensure we have a valid userId for Firestore queries
    const userId = user.uid || user.id;
    console.log('✅ Valid user confirmed:', userId);

    if (!isRefreshing) {
      setLoading(true);
    }

    // 🔥 CRITICAL: Wait for Firestore to be ready before making any queries
    try {
      console.log('⏳ Waiting for Firestore to be ready...');
      const { waitForFirestore } = await import('./firebaseConfig');
      await waitForFirestore();
      console.log('✅ Firestore is ready, proceeding with queries...');
    } catch (error) {
      console.error('❌ Firestore initialization failed:', error.message);
      isFetchingPosts.current = false;
      setLoading(false);
      setRefreshing(false);
      Alert.alert('Connection Error', 'Unable to connect to server. Please check your internet connection and try again.');
      return;
    }

    const combinedPosts = [];
    const authorCache = {}; // Cache authors to avoid duplicate fetches

    // Helper function to get author data with caching
    const getAuthorData = async (authorId, existingName, existingImage, existingUsername) => {
      if (!authorId || (existingName && existingImage)) {
        return { authorName: existingName || 'User', authorImage: existingImage || null, username: existingUsername || '' };
      }

      if (authorCache[authorId]) {
        return authorCache[authorId];
      }

      try {
        const userRef = doc(db, 'users', authorId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const fullName = [userData.firstName || userData.user_firstname, userData.lastName || userData.user_lastname].filter(Boolean).join(' ').trim();
          const result = {
            authorName: fullName || userData.displayName || userData.name || userData.username || userData.user_name || 'User',
            authorImage: userData.profileImage || userData.user_picture || userData.avatar || userData.profile_image || userData.photoURL || null,
            username: userData.username || userData.user_name || '',
          };
          authorCache[authorId] = result;
          return result;
        }
      } catch (error) {
        console.log('Error fetching author:', error);
      }

      return { authorName: existingName || 'User', authorImage: existingImage || null, username: existingUsername || '' };
    };

    // Initialize snapshots with empty docs array as default
    let globalPostsSnapshot = { docs: [] };
    let pollsSnapshot = { docs: [] };
    let quizzesSnapshot = { docs: [] };
    let questionsSnapshot = { docs: [] };
    let communitiesSnapshot = { docs: [] };
    let sortByCreatedAt = (a, b) => {
      const aTime = a.data()?.createdAt?.toDate?.() || new Date(0);
      const bTime = b.data()?.createdAt?.toDate?.() || new Date(0);
      return bTime - aTime;
    };

    try {
      console.log('📡 Checking network...');

      // Quick network check only
      try {
        const networkState = await NetInfo.fetch();
        console.log('📶 Network:', networkState.type, '- Connected:', networkState.isConnected);

        if (!networkState.isConnected) {
          throw new Error('No network connection');
        }
      } catch (netError) {
        console.warn('⚠️ Network check issue:', netError.message);
      }

      console.log('📥 Fetching posts from Firestore...');

      // Increase timeout to 30 seconds for long polling mode
      const fetchWithTimeout = (promise, timeoutMs = 30000, label = 'Query') => {
        const startTime = Date.now();
        return Promise.race([
          promise.then(result => {
            const elapsed = Date.now() - startTime;
            console.log(`✅ ${label} completed in ${elapsed}ms`);
            return result;
          }).catch(error => {
            const elapsed = Date.now() - startTime;
            console.log(`❌ ${label} promise rejected after ${elapsed}ms:`, error.code || error.message);
            throw error;
          }),
          new Promise((_, reject) =>
            setTimeout(() => {
              console.log(`⏱️ ${label} timeout triggered at ${timeoutMs}ms`);
              reject(new Error(`${label} timeout after ${timeoutMs}ms`));
            }, timeoutMs)
          )
        ]);
      };

      // ⚡ Fetch all collections in parallel for 5x faster loading
      console.log('📥 Fetching all collections in parallel...');
      const [postsResult, pollsResult, quizzesResult, questionsResult, communitiesResult] = await Promise.all([
        fetchWithTimeout(
          getDocs(query(collection(db, 'posts'), limit(10))),
          15000,
          'Posts'
        ).catch(err => {
          console.log('❌ Posts fetch error:', err.message);
          return { docs: [] };
        }),
        fetchWithTimeout(
          getDocs(query(collection(db, 'polls'), limit(5))),
          15000,
          'Polls'
        ).catch(err => {
          console.log('❌ Polls fetch error:', err.message);
          return { docs: [] };
        }),
        fetchWithTimeout(
          getDocs(query(collection(db, 'quizzes'), limit(5))),
          15000,
          'Quizzes'
        ).catch(err => {
          console.log('❌ Quizzes fetch error:', err.message);
          return { docs: [] };
        }),
        fetchWithTimeout(
          getDocs(query(collection(db, 'questions'), limit(5))),
          15000,
          'Questions'
        ).catch(err => {
          console.log('❌ Questions fetch error:', err.message);
          return { docs: [] };
        }),
        fetchWithTimeout(
          getDocs(query(collection(db, 'communities'), limit(3))),
          15000,
          'Communities'
        ).catch(err => {
          console.log('❌ Communities fetch error:', err.message);
          return { docs: [] };
        })
      ]);

      globalPostsSnapshot = postsResult;
      pollsSnapshot = pollsResult;
      quizzesSnapshot = quizzesResult;
      questionsSnapshot = questionsResult;
      communitiesSnapshot = communitiesResult;

      console.log('✅ All collections fetched', {
        posts: globalPostsSnapshot.docs?.length || 0,
        polls: pollsSnapshot.docs?.length || 0,
        quizzes: quizzesSnapshot.docs?.length || 0,
        questions: questionsSnapshot.docs?.length || 0,
        communities: communitiesSnapshot.docs?.length || 0
      });
    } catch (fetchError) {
      console.log('❌ Error during data fetching:', fetchError);
      console.error('❌ Full fetch error:', fetchError);
      // Variables are already initialized with empty arrays, so we can continue
    }

    console.log('📊 Starting to process fetched data into posts...');
    try {
      // Global posts
      const sortedPosts = [...globalPostsSnapshot.docs].sort(sortByCreatedAt).slice(0, 10);
      for (const postDoc of sortedPosts) {
        const postData = postDoc.data();
        const authorId = postData.authorId || postData.userId || null;

        const { authorName, authorImage, username } = await getAuthorData(
          authorId,
          postData.authorName,
          postData.authorImage,
          postData.authorUsername || postData.username
        );

        const images = Array.isArray(postData.images) ? postData.images : [];

        const type = postData.type || 'post';
        const commentCount = type === 'question'
          ? typeof postData.answerCount === 'number'
            ? postData.answerCount
            : 0
          : typeof postData.comments === 'number'
            ? postData.comments
            : 0;

        combinedPosts.push({
          id: postDoc.id,
          ...postData,
          type,
          scope: 'global',
          communityId: null,
          authorId,
          authorName,
          authorImage,
          username,
          images,
          imageUri: postData.imageUri || (images.length > 0 ? images[0] : null),
          likes: typeof postData.likes === 'number' ? postData.likes : Array.isArray(postData.likedBy) ? postData.likedBy.length : 0,
          likedBy: Array.isArray(postData.likedBy) ? postData.likedBy : [],
          comments: commentCount,
          commentCount,
        });
      }

      // Global polls
      const sortedPolls = [...pollsSnapshot.docs].sort(sortByCreatedAt).slice(0, 5);
      for (const pollDoc of sortedPolls) {
        const pollData = pollDoc.data();
        const authorId = pollData.authorId || pollData.userId || null;

        const { authorName, authorImage, username } = await getAuthorData(
          authorId,
          pollData.authorName,
          pollData.authorImage,
          pollData.authorUsername || pollData.username
        );

        const commentCount = typeof pollData.comments === 'number' ? pollData.comments : 0;

        combinedPosts.push({
          id: pollDoc.id,
          ...pollData,
          type: 'poll',
          scope: 'global',
          communityId: null,
          authorId,
          authorName,
          authorImage,
          username,
          likes: typeof pollData.likes === 'number' ? pollData.likes : Array.isArray(pollData.likedBy) ? pollData.likedBy.length : 0,
          likedBy: Array.isArray(pollData.likedBy) ? pollData.likedBy : [],
          comments: commentCount,
          commentCount,
          options: Array.isArray(pollData.options) ? pollData.options : [],
          totalVotes: typeof pollData.totalVotes === 'number' ? pollData.totalVotes : 0,
        });
      }

      // Global quizzes
      const sortedQuizzes = [...quizzesSnapshot.docs].sort(sortByCreatedAt).slice(0, 5);
      for (const quizDoc of sortedQuizzes) {
        const quizData = quizDoc.data();
        const authorId = quizData.authorId || quizData.userId || null;

        const { authorName, authorImage, username } = await getAuthorData(
          authorId,
          quizData.authorName,
          quizData.authorImage,
          quizData.authorUsername || quizData.username
        );

        const questionCount = Array.isArray(quizData.questions) ? quizData.questions.length : quizData.questionCount || 0;
        const commentCount = typeof quizData.comments === 'number' ? quizData.comments : 0;

        combinedPosts.push({
          id: quizDoc.id,
          ...quizData,
          type: 'quiz',
          scope: 'global',
          communityId: null,
          authorId,
          authorName,
          authorImage,
          username,
          questionCount,
          likes: typeof quizData.likes === 'number' ? quizData.likes : Array.isArray(quizData.likedBy) ? quizData.likedBy.length : 0,
          likedBy: Array.isArray(quizData.likedBy) ? quizData.likedBy : [],
          comments: commentCount,
          commentCount,
          attempts: typeof quizData.attempts === 'number' ? quizData.attempts : 0,
        });
      }

      // Global questions
      const sortedQuestions = [...questionsSnapshot.docs].sort(sortByCreatedAt).slice(0, 5);
      for (const questionDoc of sortedQuestions) {
        const questionData = questionDoc.data();
        const authorId = questionData.authorId || questionData.userId || null;

        const { authorName, authorImage, username } = await getAuthorData(
          authorId,
          questionData.authorName,
          questionData.authorImage,
          questionData.authorUsername || questionData.username
        );

        const answerCount = typeof questionData.answerCount === 'number' ? questionData.answerCount : 0;

        combinedPosts.push({
          id: questionDoc.id,
          ...questionData,
          type: 'question',
          scope: 'global',
          communityId: null,
          authorId,
          authorName,
          authorImage,
          username,
          likes: typeof questionData.likes === 'number' ? questionData.likes : Array.isArray(questionData.likedBy) ? questionData.likedBy.length : 0,
          likedBy: Array.isArray(questionData.likedBy) ? questionData.likedBy : [],
          comments: answerCount,
          commentCount: answerCount,
        });
      }

      // Community posts and blogs (already fetched communities)
      for (const commDoc of communitiesSnapshot.docs) {
        const commId = commDoc.id;

        // Community blogs
        try {
          const blogsCol = collection(db, 'communities', commId, 'blogs');
          const blogsQuery = query(blogsCol, orderBy('createdAt', 'desc'), limit(5));
          const blogsSnapshot = await getDocs(blogsQuery);

          for (const blogDoc of blogsSnapshot.docs) {
            const blogData = blogDoc.data();
            const authorId = blogData.authorId || null;

            const { authorName, authorImage, username } = await getAuthorData(
              authorId,
              blogData.authorName,
              blogData.authorImage,
              blogData.username
            );

            combinedPosts.push({
              id: blogDoc.id,
              ...blogData,
              type: 'blog',
              scope: 'community',
              communityId: commId,
              authorId,
              authorName,
              authorImage,
              username,
              likes: typeof blogData.likes === 'number' ? blogData.likes : 0,
              comments: typeof blogData.comments === 'number' ? blogData.comments : 0,
              commentCount: typeof blogData.comments === 'number' ? blogData.comments : 0,
              likedBy: Array.isArray(blogData.likedBy) ? blogData.likedBy : [],
            });
          }
        } catch (e) {
          console.log('Error fetching blogs:', e);
        }

        // Community posts - REDUCED LIMIT
        try {
          const postsCol = collection(db, 'communities', commId, 'posts');
          const postsQuery = query(postsCol, orderBy('createdAt', 'desc'), limit(10));
          const postsSnapshot = await getDocs(postsQuery);

          for (const postDoc of postsSnapshot.docs) {
            const postData = postDoc.data();
            const authorId = postData.authorId || null;

            const { authorName, authorImage, username } = await getAuthorData(
              authorId,
              postData.authorName,
              postData.authorImage,
              postData.username
            );

            const images = Array.isArray(postData.images) ? postData.images : [];

            combinedPosts.push({
              id: postDoc.id,
              ...postData,
              type: 'image',
              scope: 'community',
              communityId: commId,
              authorId,
              authorName,
              authorImage,
              username,
              images,
              imageUri: postData.imageUri || postData.imageUrl || postData.mediaUrl || postData.image || (images.length > 0 ? images[0] : null),
              likes: typeof postData.likes === 'number' ? postData.likes : 0,
              comments: typeof postData.comments === 'number' ? postData.comments : 0,
              commentCount: typeof postData.comments === 'number' ? postData.comments : 0,
              likedBy: Array.isArray(postData.likedBy) ? postData.likedBy : [],
            });
          }
        } catch (e) {
          console.log('Error fetching posts:', e);
        }
      }

      combinedPosts.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
        const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
        return bTime - aTime;
      });

      console.log('✅ Loaded', combinedPosts.length, 'posts with', Object.keys(authorCache).length, 'unique authors');

      // Debug: Log first few posts to verify structure
      if (combinedPosts.length > 0) {
        console.log('📋 Sample post structure:', JSON.stringify({
          id: combinedPosts[0].id,
          type: combinedPosts[0].type,
          scope: combinedPosts[0].scope,
          authorId: combinedPosts[0].authorId,
          authorName: combinedPosts[0].authorName,
          hasText: !!combinedPosts[0].text,
          hasImage: !!combinedPosts[0].imageUri,
          hasImages: Array.isArray(combinedPosts[0].images) ? combinedPosts[0].images.length : 0
        }, null, 2));
      }

      setAllPosts(combinedPosts.slice(0, 30));
    } catch (e) {
      console.log('❌ ERROR fetching all posts:', e);
      console.error('Full error details:', e);
      // Still set empty posts so UI doesn't stay in loading state
      setAllPosts([]);
    } finally {
      isFetchingPosts.current = false;
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []); // 🛑 REMOVED `currentUser` from dependency array to prevent re-creating the function unnecessarily.

  useEffect(() => {
    let isMounted = true;

    const loadPosts = async () => {
      console.log('📱 useEffect loadPosts triggered');

      // 🛑 GUARD: Do not fetch posts until the user is authenticated.
      if (!currentUser) {
        console.log('⏭️ Skipping post fetch: User not authenticated yet.');
        if (isMounted) {
          setLoading(false);
          setAllPosts([]); // Clear any stale posts from a previous session
        }
        return;
      }

      console.log('✅ User is authenticated, proceeding to fetch posts.');
      await fetchAllPosts(currentUser); // ✅ PASS `currentUser` directly into the function
      if (isMounted) {
        hasFetchedPosts.current = true;
        lastLoadTimeRef.current = Date.now();
      }
    };

    loadPosts();

    return () => {
      isMounted = false;
    };
  }, [fetchAllPosts, currentUser]);

  // Refresh profile and posts when returning to homepage
  useFocusEffect(
    useCallback(() => {
      const refreshData = async () => {
        try {
          // Refresh profile - always fetch from Firestore for real-time data
          const auth = getAuth(app);
          if (auth.currentUser) {
            const userId = auth.currentUser.uid;

            // Fetch fresh data from Firestore
            try {
              const userRef = doc(db, 'users', userId);
              const userSnap = await getDoc(userRef);

              if (userSnap.exists()) {
                const userData = userSnap.data();
                const fullName = [userData.firstName || userData.user_firstname, userData.lastName || userData.user_lastname].filter(Boolean).join(' ').trim();
                const userName = fullName || userData.username || userData.user_name || userData.displayName || userData.name || auth.currentUser.displayName || 'User';
                const img = userData.profileImage || userData.user_picture || userData.profile_image || userData.profile_picture || userData.photoURL || null;

                const userProfile = {
                  id: userId,
                  uid: userId,
                  name: userName,
                  profileImage: img,
                  email: userData.email || userData.user_email || auth.currentUser.email,
                  ...userData
                };

                setUserName(userName);
                setProfileImage(img);
                setCurrentUser(userProfile);

                // Update cache with fresh data
                await CacheManager.saveUserProfile(userId, userProfile);
                console.log('🔄 Profile refreshed from Firestore');
              }
            } catch (firestoreError) {
              console.log('⚠️ Firestore fetch failed, using cache:', firestoreError.message);
              // Fallback to cache if Firestore fails
              const cachedUser = await CacheManager.getUserProfile(userId);
              if (cachedUser) {
                const fullName = [cachedUser.firstName || cachedUser.user_firstname, cachedUser.lastName || cachedUser.user_lastname].filter(Boolean).join(' ').trim();
                const userName = fullName || cachedUser.username || cachedUser.user_name || cachedUser.displayName || cachedUser.name || auth.currentUser.displayName || 'User';
                const img = cachedUser.profileImage || cachedUser.user_picture || cachedUser.profile_image || cachedUser.profile_picture || cachedUser.photoURL || null;

                setUserName(userName);
                setProfileImage(img);
                setCurrentUser(cachedUser);
              }
            }
          }

          // Always reload posts if they've been fetched before (skip only on initial mount)
          if (hasFetchedPosts.current && auth.currentUser) {
            console.log('🔄 Reloading posts with real-time data');
            await fetchAllPosts(userProfile, false); // ✅ PASS `userProfile` directly
          }
        } catch (err) {
          console.log('⚠️ Data refresh error:', err);
        }
      };

      refreshData();
    }, [fetchAllPosts])
  );

  // Real-time listeners for posts updates - OPTIMIZED
  useEffect(() => {
    if (allPosts.length === 0) return;

    // Limit real-time listeners to first 20 posts only for better performance
    const postsToWatch = allPosts.slice(0, 20);
    const unsubscribes = [];

    postsToWatch.forEach((post) => {
      const postInfo = getPostDocInfo(post);
      if (!postInfo?.docRef) {
        return;
      }

      const unsubscribe = onSnapshot(
        postInfo.docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const countField = postInfo.countField || 'comments';
            const commentCount = typeof data[countField] === 'number'
              ? data[countField]
              : typeof data.comments === 'number'
                ? data.comments
                : 0;
            setAllPosts((prev) =>
              prev.map((p) =>
                p.id === post.id && p.communityId === post.communityId && p.scope === post.scope
                  ? {
                    ...p,
                    likes: typeof data.likes === 'number' ? data.likes : 0,
                    comments: commentCount,
                    commentCount,
                    likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
                  }
                  : p
              )
            );
          }
        },
        (error) => {
          console.log(`[Firestore] Error in post snapshot listener for ${post.id}:`, error.code);
          // Silently ignore permission errors for real-time updates
        }
      );

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [allPosts.length]);

  // Listen to current user's following list
  useEffect(() => {
    if (!currentUser?.id) {
      setFollowingUserIds([]);
      return;
    }

    // db is now imported globally
    const followCol = collection(db, 'users', currentUser.id, 'following');

    const unsubscribe = onSnapshot(
      followCol,
      (snapshot) => {
        const ids = snapshot.docs.map((docSnap) => docSnap.id);
        setFollowingUserIds(ids);
      },
      (error) => {
        console.log('[Firestore] Error in following snapshot listener:', error.code);
        setFollowingUserIds([]);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser?.id]);

  // Filter posts based on active tab
  const filteredPosts = useMemo(() => {
    console.log('🔍 FilteredPosts calculation - allPosts.length:', allPosts.length, 'activeButton:', activeButton);

    if (activeButton === null) {
      // No tab selected, show all posts (For You)
      console.log('📋 Showing all posts (activeButton is null):', allPosts.length);
      return allPosts;
    }

    const tabName = buttons[activeButton];
    console.log('📋 Active tab:', tabName);

    switch (tabName) {
      case 'Discovery':
        // Show all posts
        console.log('📋 Discovery - showing all posts:', allPosts.length);
        return allPosts;

      case 'Following':
        // Show posts only from users the current user is following
        const followingPosts = allPosts.filter(post =>
          post.authorId && followingUserIds.includes(post.authorId)
        );
        console.log('📋 Following - filtered posts:', followingPosts.length, 'from', allPosts.length);
        return followingPosts;

      case 'Communities':
        // Show posts from communities the user has joined
        // For now, show all community posts (can be refined with membership data)
        console.log('📋 Communities - showing all posts:', allPosts.length);
        return allPosts;

      case 'Streaming':
        // Show posts from specific communities
        // For now, show all posts (can be refined based on specific logic)
        console.log('📋 Streaming - showing all posts:', allPosts.length);
        return allPosts;

      default:
        console.log('📋 Default - showing all posts:', allPosts.length);
        return allPosts;
    }
  }, [activeButton, allPosts, followingUserIds]);

  // Handler functions
  const handleToggleLike = async (post) => {
    if (!currentUser?.id) {
      Alert.alert('Login Required', 'Please log in to like posts.');
      return;
    }
    if (!post?.id) return;

    const likeKey = `${post.scope || 'global'}-${post.type}-${post.id}-${post.communityId || 'global'}`;
    if (likeProcessingIds.includes(likeKey)) return;
    setLikeProcessingIds((prev) => [...prev, likeKey]);

    // ⚡ Optimistic UI Update - instant feedback
    const likedBy = Array.isArray(post.likedBy) ? [...post.likedBy] : [];
    const alreadyLiked = likedBy.includes(currentUser.id);
    const optimisticLikedBy = alreadyLiked
      ? likedBy.filter((id) => id !== currentUser.id)
      : [...likedBy, currentUser.id];
    const optimisticLikes = alreadyLiked
      ? Math.max(0, (post.likes || 0) - 1)
      : (post.likes || 0) + 1;

    // Update UI immediately
    setAllPosts((prev) =>
      prev.map((p) =>
        p.id === post.id && p.communityId === post.communityId && p.scope === post.scope
          ? { ...p, likedBy: optimisticLikedBy, likes: optimisticLikes }
          : p
      )
    );

    try {
      const postInfo = getPostDocInfo(post);
      if (!postInfo?.docRef) {
        // Rollback on error
        setAllPosts((prev) =>
          prev.map((p) =>
            p.id === post.id && p.communityId === post.communityId && p.scope === post.scope
              ? { ...p, likedBy, likes: post.likes }
              : p
          )
        );
        return;
      }

      const postRef = postInfo.docRef;
      let result = null;

      // Background sync with Firestore
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(postRef);
        if (!snapshot.exists()) {
          return;
        }
        const data = snapshot.data();
        const serverLikedBy = Array.isArray(data.likedBy) ? [...data.likedBy] : [];
        const serverAlreadyLiked = serverLikedBy.includes(currentUser.id);

        let newLikedBy;
        if (serverAlreadyLiked) {
          newLikedBy = serverLikedBy.filter((id) => id !== currentUser.id);
        } else {
          newLikedBy = [...serverLikedBy, currentUser.id];
        }

        const currentLikeCount =
          typeof data.likes === 'number' ? data.likes : serverLikedBy.length;
        const newLikes = serverAlreadyLiked
          ? Math.max(0, currentLikeCount - 1)
          : currentLikeCount + 1;

        transaction.update(postRef, {
          likedBy: newLikedBy,
          likes: newLikes,
        });

        result = { likedBy: newLikedBy, likes: newLikes };
      });

      // Sync UI with server result if different
      if (result && (result.likes !== optimisticLikes)) {
        setAllPosts((prev) =>
          prev.map((p) =>
            p.id === post.id && p.communityId === post.communityId && p.scope === post.scope
              ? { ...p, ...result }
              : p
          )
        );
      }
    } catch (e) {
      console.log('Error toggling like:', e);
      // Rollback optimistic update on error
      setAllPosts((prev) =>
        prev.map((p) =>
          p.id === post.id && p.communityId === post.communityId && p.scope === post.scope
            ? { ...p, likedBy, likes: post.likes }
            : p
        )
      );
      Alert.alert('Error', 'Unable to update like right now.');
    } finally {
      setLikeProcessingIds((prev) => prev.filter((key) => key !== likeKey));
    }
  };

  const handlePollVote = async (post, optionIndex) => {
    if (!currentUser?.id) {
      Alert.alert('Login Required', 'Please log in to vote on polls.');
      return;
    }
    if (!post?.id || post.type !== 'poll' || typeof optionIndex !== 'number') {
      return;
    }

    const voteKey = `${post.scope || 'global'}-poll-${post.id}-${post.communityId || 'global'}`;
    if (pollVoteBusyIds.includes(voteKey)) {
      return;
    }
    setPollVoteBusyIds((prev) => [...prev, voteKey]);

    let result = null;

    try {
      const postInfo = getPostDocInfo(post);
      if (!postInfo?.docRef) {
        throw new Error('Missing poll reference');
      }

      await runTransaction(db, async (transaction) => {
        const pollSnap = await transaction.get(postInfo.docRef);
        if (!pollSnap.exists()) {
          throw new Error('Poll not found');
        }

        const pollData = pollSnap.data();
        const userId = currentUser.id;
        const allowMultiple = Boolean(pollData.allowMultipleAnswers);
        const rawOptions = Array.isArray(pollData.options) ? pollData.options : [];

        if (!rawOptions[optionIndex]) {
          throw new Error('Invalid poll option');
        }

        const options = rawOptions.map((opt) => ({
          ...opt,
          voters: Array.isArray(opt?.voters) ? [...opt.voters] : [],
          votes:
            typeof opt?.votes === 'number'
              ? opt.votes
              : Array.isArray(opt?.voters)
                ? opt.voters.length
                : 0,
        }));

        let totalVotes =
          typeof pollData.totalVotes === 'number'
            ? pollData.totalVotes
            : options.reduce((sum, opt) => sum + (typeof opt.votes === 'number' ? opt.votes : 0), 0);

        const userSelections = [];
        options.forEach((opt, idx) => {
          if (opt.voters.includes(userId)) {
            userSelections.push(idx);
          }
        });

        const selectedOption = options[optionIndex];
        const alreadySelected = selectedOption.voters.includes(userId);
        let changeDetected = false;
        let totalChange = 0;

        if (allowMultiple) {
          if (alreadySelected) {
            selectedOption.voters = selectedOption.voters.filter((id) => id !== userId);
            if (selectedOption.votes > 0) {
              selectedOption.votes -= 1;
              totalChange -= 1;
            }
            changeDetected = true;
          } else {
            selectedOption.voters.push(userId);
            selectedOption.votes += 1;
            totalChange += 1;
            changeDetected = true;
          }
        } else {
          if (alreadySelected) {
            changeDetected = false;
          } else {
            userSelections.forEach((idx) => {
              if (idx !== optionIndex) {
                const previousOption = options[idx];
                previousOption.voters = previousOption.voters.filter((id) => id !== userId);
                if (previousOption.votes > 0) {
                  previousOption.votes -= 1;
                  totalChange -= 1;
                }
              }
            });
            selectedOption.voters.push(userId);
            selectedOption.votes += 1;
            totalChange += 1;
            changeDetected = true;
          }
        }

        if (!changeDetected) {
          return;
        }

        totalVotes = Math.max(0, totalVotes + totalChange);

        transaction.update(postInfo.docRef, {
          options,
          totalVotes,
          updatedAt: serverTimestamp(),
        });

        result = {
          options: options.map((opt) => ({
            ...opt,
            voters: Array.isArray(opt.voters) ? [...opt.voters] : [],
          })),
          totalVotes,
        };
      });

      if (result) {
        setAllPosts((prev) =>
          prev.map((p) =>
            p.id === post.id && p.scope === post.scope && p.communityId === post.communityId
              ? {
                ...p,
                options: result.options,
                totalVotes: result.totalVotes,
              }
              : p
          )
        );
      }
    } catch (e) {
      console.log('Error casting poll vote:', e);
      Alert.alert('Error', 'Unable to update vote right now.');
    } finally {
      setPollVoteBusyIds((prev) => prev.filter((id) => id !== voteKey));
    }
  };

  const handleStartQuiz = (quizPost) => {
    if (!quizPost?.id || !Array.isArray(quizPost.questions) || quizPost.questions.length === 0) {
      Alert.alert('Quiz Unavailable', 'This quiz does not have any questions yet.');
      return;
    }

    const initialResponses = {};
    quizPost.questions.forEach((_, idx) => {
      initialResponses[idx] = null;
    });

    setActiveQuiz(quizPost);
    setQuizResponses(initialResponses);
    setQuizResult(null);
    setQuizModalVisible(true);
  };

  const handleSelectQuizOption = (questionIndex, optionIndex) => {
    if (quizSubmitting || quizResult || !activeQuiz) {
      return;
    }

    setQuizResponses((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) {
      return;
    }

    if (!currentUser?.id) {
      Alert.alert('Login Required', 'Please log in to attempt quizzes.');
      return;
    }

    const questionCount = Array.isArray(activeQuiz.questions) ? activeQuiz.questions.length : 0;
    if (questionCount === 0) {
      Alert.alert('Quiz Unavailable', 'This quiz does not have any questions yet.');
      return;
    }

    const unanswered = [];
    for (let i = 0; i < questionCount; i += 1) {
      if (quizResponses[i] === null || typeof quizResponses[i] === 'undefined') {
        unanswered.push(i + 1);
      }
    }

    if (unanswered.length > 0) {
      Alert.alert(
        'Incomplete Quiz',
        `Please answer question${unanswered.length > 1 ? 's' : ''} ${unanswered.join(', ')} before submitting.`,
      );
      return;
    }

    setQuizSubmitting(true);

    try {
      const breakdown = activeQuiz.questions.map((question, index) => {
        const selectedIndex = quizResponses[index];
        const isCorrect =
          typeof question?.correctAnswer === 'number' && question.correctAnswer === selectedIndex;
        return {
          selectedIndex,
          isCorrect,
        };
      });

      const correctCount = breakdown.filter((item) => item.isCorrect).length;
      const score = Math.round((correctCount / questionCount) * 100);

      const postInfo = getPostDocInfo(activeQuiz);
      if (postInfo?.docRef) {
        try {
          await runTransaction(db, async (transaction) => {
            const quizSnap = await transaction.get(postInfo.docRef);
            if (!quizSnap.exists()) {
              throw new Error('Quiz not found');
            }
            const quizData = quizSnap.data();
            const attempts = typeof quizData.attempts === 'number' ? quizData.attempts : 0;
            transaction.update(postInfo.docRef, {
              attempts: attempts + 1,
              updatedAt: serverTimestamp(),
            });
          });
        } catch (updateError) {
          console.log('Error recording quiz attempt:', updateError);
        }
      }

      setAllPosts((prev) =>
        prev.map((p) =>
          p.id === activeQuiz.id && p.scope === activeQuiz.scope && p.communityId === activeQuiz.communityId
            ? {
              ...p,
              attempts: (p.attempts || 0) + 1,
            }
            : p
        )
      );

      setQuizResult({
        correctCount,
        questionCount,
        score,
        breakdown,
      });
    } catch (e) {
      console.log('Error submitting quiz:', e);
      Alert.alert('Error', 'Unable to submit quiz right now.');
    } finally {
      setQuizSubmitting(false);
    }
  };

  const handleCloseQuizModal = () => {
    if (quizSubmitting) {
      return;
    }
    setQuizModalVisible(false);
    setActiveQuiz(null);
    setQuizResponses({});
    setQuizResult(null);
  };

  const fetchCommentsForPost = async (post) => {
    if (!post?.id) return;

    setCommentsLoading(true);
    try {
      const postInfo = getPostDocInfo(post);
      if (!postInfo?.commentsCol) {
        setCommentsLoading(false);
        return;
      }

      const q = query(postInfo.commentsCol, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          const commentsPromises = snapshot.docs.map(async (docSnap) => {
            const commentData = docSnap.data();
            let userProfileImage = commentData.userImage || null;

            if (!userProfileImage && commentData.userId) {
              try {
                const userRef = doc(db, 'users', commentData.userId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                  const userData = userSnap.data();
                  userProfileImage = userData.profileImage || userData.avatar || userData.profile_image || userData.photoURL || null;
                }
              } catch (e) {
                console.log('Error fetching user profile for comment:', e);
              }
            }

            return {
              id: docSnap.id,
              ...commentData,
              userImage: userProfileImage,
            };
          });

          const commentsList = await Promise.all(commentsPromises);
          setPostComments(commentsList);
          setCommentsLoading(false);
        }, (error) => {
          console.log('Error fetching comments:', error);
          setCommentsLoading(false);
        });

      setCommentsUnsubscribe(() => unsubscribe);
    } catch (e) {
      console.log('Error setting up comments listener:', e);
      setCommentsLoading(false);
    }
  };

  const handleCommentPress = (post) => {
    if (!currentUser?.id) {
      Alert.alert('Login Required', 'Please log in to comment on posts.');
      return;
    }
    setSelectedPostForComment(post);
    setCommentText('');
    setPostComments([]);
    setShowCommentModal(true);
    fetchCommentsForPost(post);
  };

  const handleSubmitComment = async () => {
    const text = commentText.trim();
    if (!text) {
      Alert.alert('Comment Required', 'Please write something before posting.');
      return;
    }
    if (!currentUser?.id || !selectedPostForComment?.id) return;

    setCommentSaving(true);

    try {
      const postInfo = getPostDocInfo(selectedPostForComment);
      if (!postInfo?.docRef || !postInfo?.commentsCol) {
        throw new Error('Missing post reference');
      }
      const postRef = postInfo.docRef;

      await runTransaction(db, async (transaction) => {
        const postSnap = await transaction.get(postRef);
        if (!postSnap.exists()) {
          throw new Error('Post not found');
        }

        const countField = postInfo.countField || 'comments';
        const postData = postSnap.data();
        const currentCount = typeof postData[countField] === 'number'
          ? postData[countField]
          : typeof postData.comments === 'number'
            ? postData.comments
            : 0;

        const commentRef = doc(postInfo.commentsCol);
        transaction.set(commentRef, {
          text,
          userId: currentUser.id,
          userName: currentUser.name || 'User',
          userImage: currentUser.profileImage || null,
          createdAt: serverTimestamp(),
          type: countField === 'answerCount' ? 'answer' : 'comment',
        });

        const updates = {
          [countField]: currentCount + 1,
        };

        if (countField !== 'comments') {
          updates.comments = currentCount + 1;
        }

        updates.updatedAt = serverTimestamp();

        transaction.update(postRef, updates);
      });

      setCommentText('');
    } catch (e) {
      console.log('Error adding comment:', e);
      Alert.alert('Error', 'Unable to post comment right now.');
    } finally {
      setCommentSaving(false);
    }
  };

  const handleSharePost = async (post) => {
    try {
      const title = post.title || post.caption || 'Social Vibing';
      const shareMessage =
        post.type === 'blog'
          ? `Check out this blog "${title}" on Social Vibing!`
          : `Check out this post on Social Vibing: "${title}"`;
      await Share.share({
        message: shareMessage,
      });
    } catch (e) {
      console.log('Error sharing post:', e);
    }
  };

  const handleToggleFollow = async (targetUserId) => {
    if (!currentUser?.id) {
      Alert.alert('Login Required', 'Please log in to follow users.');
      return;
    }
    if (!targetUserId || targetUserId === currentUser.id) return;
    if (followLoadingIds.includes(targetUserId)) return;

    setFollowLoadingIds((prev) => [...prev, targetUserId]);

    try {
      // db is now imported globally
      const followDocRef = doc(db, 'users', currentUser.id, 'following', targetUserId);
      const currentUserRef = doc(db, 'users', currentUser.id);
      const targetUserRef = doc(db, 'users', targetUserId);
      const isFollowing = followingUserIds.includes(targetUserId);

      if (isFollowing) {
        // Unfollow
        await deleteDoc(followDocRef);

        // Decrement counters
        await updateDoc(currentUserRef, {
          followingCount: increment(-1)
        });
        await updateDoc(targetUserRef, {
          followersCount: increment(-1)
        });

        setFollowingUserIds((prev) => prev.filter((id) => id !== targetUserId));
      } else {
        // Follow
        await setDoc(followDocRef, {
          userId: targetUserId,
          followedAt: new Date().toISOString(),
        });

        // Increment counters
        await updateDoc(currentUserRef, {
          followingCount: increment(1)
        });
        await updateDoc(targetUserRef, {
          followersCount: increment(1)
        });

        setFollowingUserIds((prev) => [...prev, targetUserId]);
      }
    } catch (e) {
      console.log('Error toggling follow:', e);
      Alert.alert('Error', 'Unable to update follow status right now.');
    } finally {
      setFollowLoadingIds((prev) => prev.filter((id) => id !== targetUserId));
    }
  };

  const handleDeletePost = async (post) => {
    if (!currentUser?.id || !post?.id) {
      return;
    }

    // Verify user owns the post
    if (post.authorId !== currentUser.id) {
      Alert.alert('Permission Denied', 'You can only delete your own posts.');
      return;
    }

    try {
      const postInfo = getPostDocInfo(post);
      if (!postInfo?.docRef) {
        Alert.alert('Error', 'Unable to delete this post right now.');
        return;
      }

      // Delete the post
      await deleteDoc(postInfo.docRef);

      // Remove from local state
      setAllPosts((prev) =>
        prev.filter(p => !(
          p.id === post.id &&
          p.type === post.type &&
          p.scope === post.scope &&
          (p.communityId || 'global') === (post.communityId || 'global')
        ))
      );

      Alert.alert('Success', 'Post deleted successfully.');
    } catch (e) {
      console.log('Error deleting post:', e);
      Alert.alert('Error', 'Unable to delete post. Please try again.');
    }
  };

  const handleImagePress = (imageUri, allImages = [], startIndex = 0) => {
    setSelectedImage(imageUri);
    setAllImagesInPost(allImages.length > 0 ? allImages : [imageUri]);
    setSelectedImageIndex(startIndex);
    setImageViewerVisible(true);
  };

  const handleCloseImageViewer = () => {
    setImageViewerVisible(false);
    setSelectedImage(null);
    setAllImagesInPost([]);
    setSelectedImageIndex(0);
  };

  const handleNextImage = () => {
    if (selectedImageIndex < allImagesInPost.length - 1) {
      const newIndex = selectedImageIndex + 1;
      setSelectedImageIndex(newIndex);
      setSelectedImage(allImagesInPost[newIndex]);
    }
  };

  const handlePrevImage = () => {
    if (selectedImageIndex > 0) {
      const newIndex = selectedImageIndex - 1;
      setSelectedImageIndex(newIndex);
      setSelectedImage(allImagesInPost[newIndex]);
    }
  };

  const handleProfilePress = (userId) => {
    if (userId) {
      navigation.navigate('Profile', { userId });
    }
  };

  const handleJoinCommunity = async (community) => {
    const auth = getAuth(app);
    if (!auth.currentUser) {
      Alert.alert('Login Required', 'Please log in to join communities.');
      return;
    }

    const communityId = community.community_id || community.id;

    // Check if already joined
    if (joinedCommunities.includes(communityId)) {
      // Navigate to GroupInfo if already joined
      navigation.navigate('GroupInfo', { communityId });
      return;
    }

    setJoiningCommunityId(communityId);

    try {
      const userId = auth.currentUser.uid;
      const membershipId = `${userId}_${communityId}`;
      const membershipRef = doc(db, 'communities_members', membershipId);

      await setDoc(membershipRef, {
        user_id: userId,
        community_id: communityId,
        joinedAt: new Date().toISOString(),
        validated: true,
        role: 'member'
      });

      // Update community document
      const communityRef = doc(db, 'communities', communityId);
      await updateDoc(communityRef, {
        members: arrayUnion(userId),
        members_count: increment(1)
      });

      // Update local state
      setJoinedCommunities(prev => [...prev, communityId]);

      Alert.alert('Success', `You've joined ${community.name}!`, [
        { text: 'OK', onPress: () => navigation.navigate('GroupInfo', { communityId }) }
      ]);
    } catch (error) {
      console.error('Error joining community:', error);
      Alert.alert('Error', 'Unable to join community. Please try again.');
    } finally {
      setJoiningCommunityId(null);
    }
  };

  const onRefresh = useCallback(() => {
    if (currentUser) {
      setRefreshing(true);
      fetchAllPosts(currentUser, true); // ✅ PASS `currentUser` directly
    } else {
      console.log('⏭️ Skipping refresh: User not authenticated.');
    }
  }, [fetchAllPosts, currentUser]);

  // Prepare data for desktop layout sidebars
  const userProfileData = currentUser ? {
    ...currentUser,
    displayName: userName,
    profileImage: profileImage,
    status: 'online', // You can enhance this with real status
    followersCount: currentUser?.followers?.length || 0,
    followingCount: followingUserIds.length || 0,
    friendsCount: currentUser?.friends?.length || 0,
    interests: currentUser?.interests || [],
  } : null;

  const walletData = currentUser ? {
    coins: currentUser?.coins || 0,
    diamonds: currentUser?.diamonds || 0,
    credits: currentUser?.credits || 0,
  } : null;

  const storiesData = []; // You can populate this with actual stories data

  const followedCommunitiesData = topCommunities.filter(c =>
    joinedCommunities.includes(c.community_id || c.id)
  );

  const suggestedCommunitiesData = topCommunities.filter(c =>
    !joinedCommunities.includes(c.community_id || c.id)
  ).slice(0, 3);

  const trendingTopicsData = []; // You can populate with trending topics

  const liveStreamsData = []; // You can populate with live streams

  const useDesktopLayout = isWeb && isDesktopOrLarger();

  return (
    <>
      <HomescreenDesktopWrapper
        userProfile={userProfileData}
        wallet={walletData}
        stories={storiesData}
        followedCommunities={followedCommunitiesData}
        suggestedCommunities={suggestedCommunitiesData}
        trendingTopics={trendingTopicsData}
        liveStreams={liveStreamsData}
        navigation={navigation}
        showBottomNav={!useDesktopLayout}
      >
        <ScrollView
          style={[
            styles.container,
            useDesktopLayout && styles.desktopContainer
          ]}
          contentContainerStyle={[
            styles.scrollContent,
            useDesktopLayout && styles.desktopScrollContent
          ]}
          showsVerticalScrollIndicator={false}
          bounces={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
              colors={['#BF2EF0', '#05FF00', '#FFD913']}
            />
          }
        >
          {/* Top Bar - Hidden on desktop (replaced by DesktopHeader) */}
          {!useDesktopLayout && (
            <>
              <View style={styles.topBar}>
                <View style={styles.profileContainer}>
                  {/* UPDATED: Wrap profile area with TouchableOpacity to open Profile */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('Profile')}
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                  >

                    {profileImage ? (
                      <Image
                        source={{ uri: profileImage }}
                        style={[styles.profileImage, { borderColor: isConnected ? '#08FFE2' : '#666' }]}
                      />
                    ) : (
                      <View style={[styles.profileImage, { borderColor: isConnected ? '#08FFE2' : '#666', backgroundColor: '#E1E8ED', justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="person" size={30} color="#657786" />
                      </View>
                    )}
                    <View style={styles.profileTextContainer}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.profileName}>{userName || 'User'}</Text>
                        <Image
                          source={require('./assets/starimage.png')}
                          style={{ width: 18, height: 18, marginLeft: 5 }}
                        />
                      </View>
                      {/* User Status Badge - Single status display */}
                      <View style={{ marginTop: 4 }}>
                        <StatusBadge
                          isOwnStatus={true}
                          size="small"
                          showEditIcon={false}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.iconsContainer}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => navigation.navigate('SearchBar')}
                  >
                    <Ionicons name="search-outline" size={24} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => navigation.navigate('Notification')}
                  >
                    <Ionicons name="notifications" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Navigation Buttons in Header */}
              <View style={styles.headerNavigation}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.headerNavContent}
                >
                  {buttons.map((btn, index) => {
                    const isActive = activeButton === index;
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[styles.headerNavButton, isActive && styles.headerNavButtonActive]}
                        onPress={() => setActiveButton(index)}
                      >
                        <Text style={[styles.headerNavText, isActive && styles.headerNavTextActive]}>{btn}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </>
          )}

          {/* Post Creation Box - LinkedIn Style */}
          <View style={styles.createPostBox}>
            <View style={styles.createPostHeader}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.createPostAvatar} />
              ) : (
                <View style={[styles.createPostAvatar, { backgroundColor: '#E1E8ED', justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="person" size={20} color="#657786" />
                </View>
              )}
              <TouchableOpacity
                style={styles.createPostInput}
                onPress={() => navigation.navigate('CreatePost')}
              >
                <Text style={styles.createPostPlaceholder}>Start a post...</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.createPostActions}>
              <TouchableOpacity
                style={styles.createPostAction}
                onPress={() => navigation.navigate('CreatePost')}
              >
                <Ionicons name="document-text" size={22} color="#FFD700" />
                <Text style={styles.createPostActionText}>Post</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.createPostAction}
                onPress={() => navigation.navigate('CreateStory')}
              >
                <Ionicons name="camera" size={22} color="#FF69B4" />
                <Text style={styles.createPostActionText}>Story</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.createPostAction}
                onPress={() => navigation.navigate('CreatePoll')}
              >
                <Ionicons name="bar-chart" size={22} color="#FF8C00" />
                <Text style={styles.createPostActionText}>Poll</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.createPostAction}
                onPress={() => navigation.navigate('CreateQuiz')}
              >
                <Ionicons name="help-circle" size={22} color="#32CD32" />
                <Text style={styles.createPostActionText}>Quiz</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.createPostAction}
                onPress={() => navigation.navigate('Draft')}
              >
                <Ionicons name="create" size={22} color="#9370DB" />
                <Text style={styles.createPostActionText}>Draft</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.createPostAction}
                onPress={() => navigation.navigate('CreateQuestion')}
              >
                <Ionicons name="chatbox-ellipses" size={22} color="#1E90FF" />
                <Text style={styles.createPostActionText}>Question</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Posts */}
          {loading ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#08FFE2" />
              <Text style={{ color: '#fff', marginTop: 10 }}>Loading posts...</Text>
            </View>
          ) : (() => {
            console.log('🎨 Rendering posts section - filteredPosts.length:', filteredPosts.length);
            if (filteredPosts.length === 0) {
              console.log('⚠️ No posts to display - showing empty state');
            } else {
              console.log('✅ Displaying', filteredPosts.length, 'posts');
            }

            return filteredPosts.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Ionicons name="document-text-outline" size={40} color="#666" />
                <Text style={{ color: '#888', marginTop: 10 }}>
                  {activeButton === 1 ? 'No posts from people you follow' : 'No posts found'}
                </Text>
                {activeButton === 1 && (
                  <Text style={{ color: '#666', marginTop: 5, fontSize: 12 }}>
                    Follow some users to see their posts here
                  </Text>
                )}
              </View>
            ) : (
              filteredPosts.map((post) => {
                const isLiked = Array.isArray(post.likedBy) && currentUser?.id
                  ? post.likedBy.includes(currentUser.id)
                  : false;
                const isFollowing = post.authorId && currentUser?.id
                  ? followingUserIds.includes(post.authorId)
                  : false;
                const likeKey = `${post.scope || 'community'}-${post.type}-${post.id}`;
                const likeBusy = likeProcessingIds.includes(likeKey);
                const followBusy = followLoadingIds.includes(post.authorId);
                const pollKey = `${post.scope || 'global'}-poll-${post.id}-${post.communityId || 'global'}`;
                const pollBusy = pollVoteBusyIds.includes(pollKey);

                return (
                  <Post
                    key={`${post.scope || post.communityId || 'global'}-${post.type}-${post.id}`}
                    post={post}
                    onLike={handleToggleLike}
                    onComment={handleCommentPress}
                    onShare={handleSharePost}
                    onFollow={handleToggleFollow}
                    onDelete={handleDeletePost}
                    onPollVote={post.type === 'poll' ? handlePollVote : undefined}
                    pollVoteBusy={post.type === 'poll' ? pollBusy : false}
                    onStartQuiz={post.type === 'quiz' ? handleStartQuiz : undefined}
                    onImagePress={handleImagePress}
                    onProfilePress={handleProfilePress}
                    isLiked={isLiked}
                    isFollowing={isFollowing}
                    likeBusy={likeBusy}
                    followBusy={followBusy}
                    currentUser={currentUser}
                    imageLoadErrors={imageLoadErrors}
                    setImageLoadErrors={setImageLoadErrors}
                    imageDimensions={imageDimensions}
                    setImageDimensions={setImageDimensions}
                    activeVideoPostId={activeVideoPostId}
                    onVideoPlayChange={setActiveVideoPostId}
                  />
                );
              })
            );
          })()}
        </ScrollView>
      </HomescreenDesktopWrapper>

      {/* Bottom Navigation Bar - Hidden on desktop */}
      {!useDesktopLayout && (
        <View style={styles.bottomNavBar}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Ionicons name="home" size={24} color="#08FFE2" />
            <Text style={[styles.navButtonText, { color: '#08FFE2' }]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('Community')}
          >
            <Ionicons name="people-outline" size={24} color="#888" />
            <Text style={styles.navButtonText}>Community</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('MarketPlace')}
          >
            <Ionicons name="cart-outline" size={24} color="#888" />
            <Text style={styles.navButtonText}>Market</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('Message')}
          >
            <Ionicons name="chatbubbles-outline" size={24} color="#888" />
            <Text style={styles.navButtonText}>Messages</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-outline" size={24} color="#888" />
            <Text style={styles.navButtonText}>Profile</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quiz Modal */}
      <Modal
        visible={quizModalVisible}
        animationType="slide"
        onRequestClose={handleCloseQuizModal}
        transparent={false}
      >
        <View style={styles.quizModalContainer}>
          <View style={styles.quizModalHeader}>
            <TouchableOpacity onPress={handleCloseQuizModal} disabled={quizSubmitting}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.quizModalTitle} numberOfLines={1}>
              {activeQuiz?.title || 'Quiz'}
            </Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.quizModalContent}>
            {Array.isArray(activeQuiz?.questions) && activeQuiz.questions.length > 0 ? (
              activeQuiz.questions.map((question, qIndex) => {
                const selectedIndex = quizResponses[qIndex];
                const hasSubmitted = Boolean(quizResult);

                return (
                  <View key={`quiz-question-${qIndex}`} style={styles.quizQuestionCard}>
                    <Text style={styles.quizQuestionHeader}>Question {qIndex + 1}</Text>
                    <Text style={styles.quizQuestionText}>{question?.question || 'No question text.'}</Text>

                    {Array.isArray(question?.options) && question.options.length > 0 ? (
                      question.options.map((option, optionIndex) => {
                        const isUserChoice = selectedIndex === optionIndex;
                        const isCorrectAnswer =
                          typeof question?.correctAnswer === 'number' &&
                          question.correctAnswer === optionIndex;

                        const optionStyles = [styles.quizOptionButton];
                        if (isUserChoice) {
                          optionStyles.push(styles.quizOptionButtonSelected);
                        }
                        if (hasSubmitted) {
                          if (isCorrectAnswer) {
                            optionStyles.push(styles.quizOptionButtonCorrect);
                          } else if (isUserChoice) {
                            optionStyles.push(styles.quizOptionButtonIncorrect);
                          }
                        }

                        return (
                          <TouchableOpacity
                            key={`quiz-question-${qIndex}-option-${optionIndex}`}
                            style={optionStyles}
                            activeOpacity={0.85}
                            onPress={() => handleSelectQuizOption(qIndex, optionIndex)}
                            disabled={hasSubmitted || quizSubmitting}
                          >
                            <View style={styles.quizOptionContent}>
                              <View style={styles.quizOptionIndicator}>
                                {hasSubmitted ? (
                                  isCorrectAnswer ? (
                                    <Ionicons name="checkmark" size={18} color="#0aff8c" />
                                  ) : isUserChoice ? (
                                    <Ionicons name="close" size={18} color="#ff4b6e" />
                                  ) : null
                                ) : isUserChoice ? (
                                  <Ionicons name="ellipse" size={14} color="#08FFE2" />
                                ) : (
                                  <Ionicons name="ellipse-outline" size={14} color="#666" />
                                )}
                              </View>
                              <Text style={styles.quizOptionText}>{option || `Option ${optionIndex + 1}`}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      <Text style={styles.quizOptionEmpty}>No options available for this question.</Text>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.quizEmptyState}>
                <Ionicons name="warning-outline" size={36} color="#666" />
                <Text style={styles.quizEmptyText}>No questions available for this quiz.</Text>
              </View>
            )}
          </ScrollView>

          {quizResult ? (
            <View style={styles.quizResultSummary}>
              <Text style={styles.quizResultTitle}>Quiz complete!</Text>
              <Text style={styles.quizResultScore}>
                {quizResult.correctCount} / {quizResult.questionCount} correct ({quizResult.score}%)
              </Text>
            </View>
          ) : null}

          <View style={styles.quizModalFooter}>
            {quizResult ? (
              <TouchableOpacity style={styles.quizModalButton} onPress={handleCloseQuizModal}>
                <Text style={styles.quizModalButtonText}>Close</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.quizModalButton, quizSubmitting && styles.quizModalButtonDisabled]}
                onPress={handleSubmitQuiz}
                disabled={quizSubmitting}
              >
                <Text style={styles.quizModalButtonText}>
                  {quizSubmitting ? 'Submitting...' : 'Submit Quiz'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Comment Modal */}
      <Modal
        visible={showCommentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (!commentSaving) {
            if (commentsUnsubscribe) {
              commentsUnsubscribe();
              setCommentsUnsubscribe(null);
            }
            setShowCommentModal(false);
            setSelectedPostForComment(null);
            setCommentText('');
            setPostComments([]);
          }
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.commentModalContainer}>
            <View style={styles.commentModalContent}>
              <View style={styles.commentModalHeader}>
                <TouchableOpacity
                  onPress={() => {
                    if (!commentSaving) {
                      if (commentsUnsubscribe) {
                        commentsUnsubscribe();
                        setCommentsUnsubscribe(null);
                      }
                      setShowCommentModal(false);
                      setSelectedPostForComment(null);
                      setCommentText('');
                      setPostComments([]);
                    }
                  }}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.commentModalTitle}>
                  Comments ({postComments.length})
                </Text>
                <TouchableOpacity
                  onPress={handleSubmitComment}
                  disabled={commentSaving || commentText.trim().length === 0}
                >
                  <Text
                    style={[
                      styles.commentModalSubmit,
                      {
                        color:
                          commentSaving || commentText.trim().length === 0 ? '#666' : '#08FFE2',
                      },
                    ]}
                  >
                    {commentSaving ? 'Posting...' : 'Post'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Comments List */}
              <ScrollView style={styles.commentsListContainer}>
                {commentsLoading ? (
                  <View style={styles.commentsLoadingContainer}>
                    <ActivityIndicator size="small" color="#08FFE2" />
                    <Text style={styles.commentsLoadingText}>Loading comments...</Text>
                  </View>
                ) : postComments.length === 0 ? (
                  <View style={styles.commentsEmptyContainer}>
                    <Ionicons name="chatbubbles-outline" size={40} color="#444" />
                    <Text style={styles.commentsEmptyText}>No comments yet</Text>
                    <Text style={styles.commentsEmptySubtext}>Be the first to comment!</Text>
                  </View>
                ) : (
                  postComments.map((comment) => (
                    <View key={comment.id} style={styles.commentItem}>
                      <Image
                        source={
                          comment.userImage
                            ? { uri: comment.userImage }
                            : require('./assets/a1.png')
                        }
                        style={styles.commentAvatar}
                      />
                      <View style={styles.commentContent}>
                        <View style={styles.commentHeader}>
                          <Text style={styles.commentUserName}>
                            {comment.userName || 'User'}
                          </Text>
                          {comment.createdAt && (
                            <Text style={styles.commentTime}>
                              {new Date(
                                comment.createdAt.toDate?.() || comment.createdAt
                              ).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.commentText}>{comment.text}</Text>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>

              {/* Comment Input Section */}
              <View style={styles.commentModalBody}>
                <Text style={styles.commentModalPostTitle}>
                  {selectedPostForComment?.title ||
                    selectedPostForComment?.caption ||
                    'Share your thoughts'}
                </Text>
                <View style={styles.commentInputContainer}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Write something nice..."
                    placeholderTextColor="#666"
                    multiline
                    value={commentText}
                    onChangeText={setCommentText}
                    editable={!commentSaving}
                  />
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        visible={imageViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseImageViewer}
      >
        <View style={styles.imageViewerContainer}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.imageViewerCloseButton}
            onPress={handleCloseImageViewer}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>

          {/* Image Counter */}
          {allImagesInPost.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {selectedImageIndex + 1} / {allImagesInPost.length}
              </Text>
            </View>
          )}

          {/* Main Image */}
          <View style={styles.imageViewerContent}>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
          </View>

          {/* Navigation Arrows */}
          {allImagesInPost.length > 1 && (
            <>
              {selectedImageIndex > 0 && (
                <TouchableOpacity
                  style={[styles.imageNavButton, styles.imageNavButtonLeft]}
                  onPress={handlePrevImage}
                >
                  <Ionicons name="chevron-back" size={40} color="#fff" />
                </TouchableOpacity>
              )}

              {selectedImageIndex < allImagesInPost.length - 1 && (
                <TouchableOpacity
                  style={[styles.imageNavButton, styles.imageNavButtonRight]}
                  onPress={handleNextImage}
                >
                  <Ionicons name="chevron-forward" size={40} color="#fff" />
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Image Thumbnails */}
          {allImagesInPost.length > 1 && (
            <ScrollView
              horizontal
              style={styles.imageThumbnailsContainer}
              contentContainerStyle={styles.imageThumbnailsContent}
              showsHorizontalScrollIndicator={false}
            >
              {allImagesInPost.map((img, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setSelectedImageIndex(index);
                    setSelectedImage(img);
                  }}
                  style={[
                    styles.thumbnailWrapper,
                    selectedImageIndex === index && styles.thumbnailWrapperActive
                  ]}
                >
                  <Image
                    source={{ uri: img }}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Status Selector Modal */}
      <StatusSelector
        visible={statusSelectorVisible}
        onClose={() => setStatusSelectorVisible(false)}
        title="Update Your Status"
      />
    </>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 50 },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Extra padding to prevent content from hiding behind tab bar
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  profileContainer: { flexDirection: 'row', alignItems: 'center' },
  profileImage: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#08FFE2' },
  profileTextContainer: { marginLeft: 15 },
  profileName: { color: '#fff', fontSize: 18, fontWeight: '700' },
  profileStatus: { color: '#08FFE2', fontSize: 14, marginTop: 3 },
  iconsContainer: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { marginLeft: 15 },

  // Header Navigation Styles
  headerNavigation: {
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    marginBottom: 20,
  },
  headerNavContent: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 8,
  },
  headerNavButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#111',
    marginHorizontal: 4,
  },
  headerNavButtonActive: {
    backgroundColor: '#08FFE2',
  },
  headerNavText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  headerNavTextActive: {
    color: '#000',
  },

  image: { width: IMAGE_WIDTH, height: 111, borderRadius: 17, borderWidth: 1.5, borderColor: '#08FFE2', shadowColor: '#08FFE280', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10.4, elevation: 5 },

  // Create Post Box Styles
  createPostBox: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  createPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  createPostAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#08FFE2',
  },
  createPostInput: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  createPostPlaceholder: {
    color: '#666',
    fontSize: 15,
  },
  createPostActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  createPostAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  createPostActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  buttonsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20 },
  textButton: { paddingVertical: 5, paddingHorizontal: 10 },
  activeButtonBorder: { borderBottomWidth: 2, borderColor: '#08FFE2' },
  buttonText: { color: '#fff', fontSize: 16 },

  postContainer: {
    marginBottom: 24,
    marginHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  postProfileImage: { width: 44, height: 44, borderRadius: 22, marginRight: 10 },
  postName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  postUsername: { color: '#888', fontSize: 12 },
  postTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  followButton: {
    backgroundColor: '#08FFE2',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: '#08FFE2',
  },
  followButtonFollowing: {
    backgroundColor: '#181818',
    borderColor: '#8B2EF0',
  },
  followText: { color: '#000', fontWeight: '700', fontSize: 14 },
  followTextFollowing: { color: '#8B2EF0' },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff4b6e33',
  },
  postText: { color: '#ccc', fontSize: 13, lineHeight: 18, marginBottom: 12 },
  postImage: { height: 100, borderRadius: 10, resizeMode: 'contain' },
  postImageFull: {
    width: '100%',
    aspectRatio: 1, // Use aspectRatio for responsive height
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  postVideoFull: {
    width: '100%',
    height: 'auto', // Set height to auto
    minHeight: 300, // Ensure a minimum height
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#000',
  },
  imageFallback: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageFallbackText: {
    color: '#666',
    marginTop: 8,
    fontSize: 12,
  },
  noImagePlaceholder: {
    width: '100%',
    height: 500,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  noImageText: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
  globalPostImageWrapper: {
    position: 'relative',
    marginTop: 12,
    width: '100%',
    minHeight: 300,
  },
  videoPlayButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    pointerEvents: 'box-none',
  },
  videoPlayButtonCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#08FFE2',
    shadowColor: '#08FFE2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  multipleImagesBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  multipleImagesText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  pollContainer: {
    marginTop: 12,
    backgroundColor: '#151515',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  pollQuestion: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  pollMeta: {
    color: '#888',
    fontSize: 12,
    marginBottom: 12,
  },
  pollOption: {
    marginBottom: 14,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#2a2a2a',
  },
  pollOptionBarTrack: {
    height: 48,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
  },
  pollOptionBarFill: {
    height: '100%',
    backgroundColor: '#00D9FF55',
  },
  pollOptionBarFillSelected: {
    backgroundColor: '#A855F7',
  },
  pollOptionRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  pollOptionText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  pollOptionTextSelected: {
    color: '#08FFE2',
    fontWeight: '600',
  },
  pollOptionVotes: {
    color: '#08FFE2',
    fontSize: 12,
    fontWeight: '600',
  },
  pollOptionSelected: {
    borderColor: '#08FFE255',
  },
  pollOptionDisabled: {
    opacity: 0.7,
  },
  pollEmptyText: {
    color: '#666',
    fontSize: 13,
  },
  quizContainer: {
    marginTop: 16,
    backgroundColor: '#1a1530',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2545',
  },
  quizTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  quizMeta: {
    color: '#8b7be5',
    fontSize: 12,
    fontWeight: '600',
  },
  quizPreview: {
    marginTop: 12,
    backgroundColor: '#1a1533',
    borderRadius: 10,
    padding: 12,
  },
  quizPreviewLabel: {
    color: '#8b7be5',
    fontSize: 12,
    marginBottom: 4,
  },
  quizPreviewQuestion: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  quizActionButton: {
    marginTop: 16,
    backgroundColor: '#08FFE2',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  quizActionButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  quizModalContainer: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 50,
  },
  quizModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f1f',
  },
  quizModalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  quizModalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  quizQuestionCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  quizQuestionHeader: {
    color: '#08FFE2',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  quizQuestionText: {
    color: '#fff',
    fontSize: 15,
    marginBottom: 16,
  },
  quizOptionButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#262626',
  },
  quizOptionButtonSelected: {
    borderColor: '#08FFE2',
    backgroundColor: '#102020',
  },
  quizOptionButtonCorrect: {
    borderColor: '#0aff8c',
    backgroundColor: '#0b261d',
  },
  quizOptionButtonIncorrect: {
    borderColor: '#ff4b6e',
    backgroundColor: '#2a1015',
  },
  quizOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quizOptionIndicator: {
    width: 28,
    alignItems: 'center',
  },
  quizOptionText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  quizOptionEmpty: {
    color: '#666',
    fontSize: 13,
  },
  quizEmptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  quizEmptyText: {
    color: '#777',
    marginTop: 12,
    fontSize: 14,
  },
  quizResultSummary: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#1f1f1f',
    backgroundColor: '#0f1416',
  },
  quizResultTitle: {
    color: '#08FFE2',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  quizResultScore: {
    color: '#fff',
    fontSize: 14,
  },
  quizModalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#1f1f1f',
    backgroundColor: '#000',
  },
  quizModalButton: {
    backgroundColor: '#08FFE2',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  quizModalButtonDisabled: {
    opacity: 0.6,
  },
  quizModalButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  questionContainer: {
    marginTop: 16,
    backgroundColor: '#1a1530',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2545',
  },
  questionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionTag: {
    backgroundColor: '#7C3AED',
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  questionCategory: {
    backgroundColor: '#404040',
    color: '#d0d0d0',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  questionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  questionDescription: {
    color: '#b5c6d0',
    fontSize: 13,
    lineHeight: 20,
  },
  questionImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginTop: 12,
  },
  communityShareContainer: {
    marginTop: 12,
  },
  communityCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  communityCardImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  communityCardInfo: {
    flex: 1,
  },
  communityCardName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  communityCardDescription: {
    color: '#888',
    fontSize: 13,
    marginBottom: 4,
  },
  communityCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  communityCardStatsText: {
    color: '#888',
    fontSize: 12,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  // Comment Modal Styles
  commentModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  commentModalContent: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    maxHeight: '90%',
    flex: 1,
  },
  commentModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  commentModalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  commentModalSubmit: {
    fontSize: 14,
    fontWeight: '700',
  },
  commentModalBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  commentModalPostTitle: {
    color: '#888',
    fontSize: 13,
    marginBottom: 8,
  },
  commentsListContainer: {
    maxHeight: 400,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  commentsLoadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsLoadingText: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
  },
  commentsEmptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsEmptyText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  commentsEmptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUserName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  commentTime: {
    color: '#666',
    fontSize: 12,
  },
  commentText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  commentInputContainer: {
    marginTop: 12,
  },
  commentInput: {
    minHeight: 120,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  bottomNavBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navButtonText: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  // Image Viewer Modal Styles
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  imageCounter: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imageViewerContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  imageNavButton: {
    position: 'absolute',
    top: '50%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    padding: 10,
    zIndex: 10,
  },
  imageNavButtonLeft: {
    left: 20,
  },
  imageNavButtonRight: {
    right: 20,
  },
  imageThumbnailsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    maxHeight: 80,
  },
  imageThumbnailsContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  thumbnailWrapper: {
    width: 60,
    height: 60,
    marginHorizontal: 5,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailWrapperActive: {
    borderColor: '#08FFE2',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
});

export default HomeScreen;





