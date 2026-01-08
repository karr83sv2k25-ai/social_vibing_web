import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useWallet } from "./context/WalletContext";
import { db } from "./firebaseConfig";
import { collection, query, where, orderBy, limit, getDocs, getDoc, doc } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import { auth } from './firebaseConfig';
import {
  isWeb,
  isDesktopOrLarger,
} from './utils/webResponsive';
import DesktopHeader from './components/DesktopHeader';

const BG = "#0B0B0E";
const CARD = "#17171C";
const TEXT = "#FFFFFF";
const TEXT_DIM = "#9CA3AF";
const ACCENT = "#7C3AED";
const CYAN = "#08FFE2";
const ORANGE = "#FF9800"; // coin button color

// ---- Dummy user data (for Colors / Characters / Bubbles cards) ----
const USERS = [
  { id: "3", name: "Monkey D. Luffy", tag: "@strawhat", coins: "50 Coins", avatar: require("./assets/profile.png") },
  { id: "4", name: "Edward Elric", tag: "@alchemy", coins: "70 Coins", avatar: require("./assets/profile.png") },
  { id: "5", name: "Itachi Uchiha", tag: "@genjutsu", coins: "55 Coins", avatar: require("./assets/profile.png") },
  { id: "6", name: "Levi Ackerman", tag: "@captain", coins: "80 Coins", avatar: require("./assets/profile.png") },
  { id: "7", name: "Naruto Uzumaki", tag: "@hokage", coins: "50 Coins", avatar: require("./assets/profile.png") },
  { id: "8", name: "Eren Yeager", tag: "@freedom", coins: "60 Coins", avatar: require("./assets/profile.png") },
  { id: "9", name: "Ichigo Kurosaki", tag: "@shinigami", coins: "45 Coins", avatar: require("./assets/profile.png") },
  { id: "10", name: "Gon Freecss", tag: "@hunter", coins: "40 Coins", avatar: require("./assets/profile.png") },
];

// ---- Store items (grid under Message Bubbles) ----
const PRODUCTS = [
  { id: "p1", title: "Edward Elric", rating: 5, price: 30, img: require("./assets/pp1.png") },
  { id: "p2", title: "Isaac Netero", rating: 4, price: 40, img: require("./assets/pp2.png") },
  { id: "p3", title: "Ken Kaneki", rating: 5, price: 100, img: require("./assets/pp3.png") },
  { id: "p4", title: "Itachi Uchiha", rating: 5, price: 20, img: require("./assets/pp4.png") },
  { id: "p5", title: "Satoru Gojo", rating: 5, price: 200, img: require("./assets/pp5.png") },
  { id: "p6", title: "Tengen Uzui", rating: 4, price: 120, img: require("./assets/pp6.png") },
];

// simple “filters” splitting products
const FILTERS = {
  Popular: PRODUCTS,
  Freebies: PRODUCTS.filter(() => false),
  Officials: PRODUCTS.slice(0, 3),
  "Community’s": PRODUCTS.slice(3),
};

export default function MarketPlaceScreen({ navigation }) {
  const { wallet, loading: walletLoading } = useWallet();
  const [activeTab, setActiveTab] = useState("Popular");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const currentUser = auth.currentUser;

  // Fetch user profile
  useEffect(() => {
    if (!currentUser) {
      setUserProfile(null);
      return;
    }

    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchProfile();
  }, [currentUser]);

  useEffect(() => {
    fetchProducts();
  }, [activeTab]);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      // Fetch from Firestore
      const productsRef = collection(db, 'products');
      let q;

      // Simplified queries while indexes are building
      if (activeTab === 'Popular') {
        // Try with index, fallback to simple query
        try {
          q = query(productsRef, where('status', '==', 'active'), orderBy('purchaseCount', 'desc'), limit(20));
        } catch (indexError) {
          // Fallback to simple query without compound index
          q = query(productsRef, limit(20));
        }
      } else if (activeTab === 'Freebies') {
        q = query(productsRef, where('price', '==', 0), limit(20));
      } else if (activeTab === 'Officials') {
        q = query(productsRef, where('isOfficial', '==', true), limit(20));
      } else {
        q = query(productsRef, limit(20));
      }

      const snapshot = await getDocs(q);
      const fetchedProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filter on client side if needed
      let filteredProducts = fetchedProducts.filter(p => p.status === 'active' || !p.status);

      if (activeTab === 'Popular') {
        filteredProducts.sort((a, b) => (b.purchaseCount || 0) - (a.purchaseCount || 0));
      } else if (activeTab === 'Officials') {
        filteredProducts = filteredProducts.filter(p => p.isOfficial === true);
      } else if (activeTab === 'Freebies') {
        filteredProducts = filteredProducts.filter(p => p.price === 0);
      }

      setProducts(filteredProducts.length > 0 ? filteredProducts : PRODUCTS);
    } catch (error) {
      console.error('Failed to fetch products:', error);

      // Show helpful message if index is building
      if (error.message?.includes('index is currently building')) {
        console.log('⏳ Firestore indexes are building. This takes 1-2 minutes. Showing dummy data...');
      }

      // Fallback to dummy data if Firestore fails
      setProducts(PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const handleProductPress = (productId) => {
    navigation.navigate('ProductDetail', { productId });
  };

  const useDesktopLayout = isWeb && isDesktopOrLarger();

  return (
    <SafeAreaView style={styles.container}>
      {/* Desktop Header */}
      {useDesktopLayout && (
        <DesktopHeader
          userProfile={userProfile}
          onSearchPress={() => navigation.navigate('SearchBar')}
          onNotificationsPress={() => navigation.navigate('Notification')}
          onSettingsPress={() => navigation.navigate('Profile')}
          onProfilePress={() => navigation.navigate('Profile')}
          navigation={navigation}
        />
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#08FFE2"
          />
        }
      >
        {/* 🔹 Header */}
        <View style={[styles.header, useDesktopLayout && { display: 'none' }]}>
          <View style={styles.headerLeft}>
            <Image source={require("./assets/profile.png")} style={styles.avatar} />
            <Text style={styles.headerTitle}>Marketplace</Text>
          </View>
          <View style={styles.headerIcons}>
            {/* ✅ Search icon navigates to MarketplaceExplore */}
            <TouchableOpacity onPress={() => navigation.navigate("MarketPlaceExplore")}>
              <Ionicons name="search-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <Ionicons name="cart-outline" size={22} color="#fff" />
          </View>
        </View>

        {/* 💰 Coins & Diamonds */}
        <View style={styles.balanceRow}>
          <TouchableOpacity
            style={styles.balanceBtn}
            onPress={() => navigation.navigate('CoinPurchase')}
          >
            <Ionicons name="logo-usd" size={16} color={CYAN} />
            <Text style={styles.balanceText}>
              {walletLoading ? '...' : wallet.coins} Coins
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.balanceBtn}
            onPress={() => navigation.navigate('DiamondPurchase')}
          >
            <MaterialCommunityIcons name="diamond-stone" size={16} color="#ff00ff" />
            <Text style={styles.balanceText}>
              {walletLoading ? '...' : wallet.diamonds} Diamonds
            </Text>
          </TouchableOpacity>
        </View>

        {/* 🎁 Promo Card */}
        <LinearGradient
          colors={["#7C3AED", "#08FFE2"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.promoCard}
        >
          <View>
            <Text style={styles.promoTitle}>Enjoy Social Vibing ✨</Text>
            <Text style={styles.promoDesc}>Get 50% off special gifts today!</Text>
          </View>
          <Image source={require("./assets/gift.png")} style={styles.promoImage} />
        </LinearGradient>

        {/* 🧩 Categories */}
        <View style={styles.categoryRow}>
          <Category
            icon={require("./assets/character.png")}
            label="Characters"
            onPress={() => navigation.navigate('MarketPlaceExplore')}
          />
          <Category
            icon={require("./assets/profileframe.png")}
            label="Frames"
            onPress={() => navigation.navigate('MarketPlaceExplore')}
          />
          <Category
            icon={require("./assets/chatbubbles.png")}
            label="Bubbles"
            onPress={() => navigation.navigate('MarketPlaceExplore')}
          />
          <Category
            icon={require("./assets/photos.png")}
            label="Art"
            onPress={() => navigation.navigate('MarketPlaceExplore')}
          />
        </View>

        {/* 🤖 AI Generation Section */}
        <View style={{ marginTop: 20 }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>✨ AI Generation</Text>
          </View>
          <View style={styles.aiGenerationRow}>
            <TouchableOpacity
              style={styles.aiGenCard}
              onPress={() => navigation.navigate('KingMediaImageGen')}
            >
              <LinearGradient
                colors={['#10B981', '#06B6D4']}
                style={styles.aiGenGradient}
              >
                <Ionicons name="image" size={32} color="#fff" />
                <Text style={styles.aiGenTitle}>Generate Image</Text>
                <Text style={styles.aiGenDesc}>AI-powered text to image</Text>
                <View style={styles.aiGenBadge}>
                  <Text style={styles.aiGenBadgeText}>5/hour</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.aiGenCard}
              onPress={() => navigation.navigate('KingMediaVideoGen')}
            >
              <LinearGradient
                colors={['#F59E0B', '#EF4444']}
                style={styles.aiGenGradient}
              >
                <Ionicons name="videocam" size={32} color="#fff" />
                <Text style={styles.aiGenTitle}>Generate Video</Text>
                <Text style={styles.aiGenDesc}>AI-powered text to video</Text>
                <View style={styles.aiGenBadge}>
                  <Text style={styles.aiGenBadgeText}>2/hour</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* 🛠️ Quick Setup (Show if no products) */}
        {!loading && products.length === 0 && (
          <TouchableOpacity
            style={styles.setupButton}
            onPress={() => navigation.navigate('TestMarketplaceSetup')}
          >
            <MaterialCommunityIcons name="cog-outline" size={20} color="#fff" />
            <Text style={styles.setupText}>Setup Marketplace Data</Text>
          </TouchableOpacity>
        )}

        {/* 🔸 Colors Section */}
        <Section title="Colors" data={USERS} />
        {/* 🔸 Characters Section */}
        <Section title="Characters" data={USERS} />
        {/* 🔸 Message Bubbles Section */}
        <Section title="Message Bubbles" data={USERS} />

        {/* Tabs + Product Grid */}
        <FilterTabs active={activeTab} onChange={setActiveTab} />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={ACCENT} />
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="package-variant" size={60} color={TEXT_DIM} />
            <Text style={styles.emptyTitle}>No Products Yet</Text>
            <Text style={styles.emptyDesc}>
              Click "Setup Marketplace Data" above to add sample products
            </Text>
          </View>
        ) : (
          <ProductGrid items={products} onProductPress={handleProductPress} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- Small Components ---------- */
function Category({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.catItem} onPress={onPress}>
      <Image source={icon} style={styles.catIcon} />
      {!!label && <Text style={styles.catText}>{label}</Text>}
    </TouchableOpacity>
  );
}

function Section({ title, data }) {
  const grouped = [];
  for (let i = 0; i < data.length; i += 5) grouped.push(data.slice(i, i + 5));

  return (
    <View style={{ marginTop: 20 }}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionView}>View all ➜</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 10 }}
      >
        {grouped.map((group, idx) => (
          <View key={idx} style={styles.userCard}>
            {group.map((u) => (
              <View key={u.id} style={styles.userRow}>
                <Image source={u.avatar} style={styles.userAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{u.name}</Text>
                  <Text style={styles.userTag}>{u.tag}</Text>
                </View>
                <TouchableOpacity style={[styles.coinBtn, { backgroundColor: ORANGE }]}>
                  <Text style={styles.coinText}>{u.coins}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function FilterTabs({ active, onChange }) {
  const tabs = ["Popular", "Freebies", "Officials", "Community’s"];
  return (
    <View style={styles.tabsRow}>
      {tabs.map((t) => {
        const isActive = t === active;
        return (
          <TouchableOpacity
            key={t}
            style={[styles.tabPill, isActive && styles.tabPillActive]}
            onPress={() => onChange(t)}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ProductGrid({ items, onProductPress }) {
  return (
    <View style={styles.gridWrap}>
      {items.map((it) => (
        <TouchableOpacity
          key={it.productId || it.id}
          style={styles.productCard}
          onPress={() => onProductPress(it.productId || it.id)}
          activeOpacity={0.8}
        >
          <Image
            source={typeof it.img === 'string' ? { uri: it.img || it.coverImage } : it.img}
            style={styles.productImg}
          />
          <Text style={styles.productTitle} numberOfLines={1}>
            {it.title}
          </Text>

          {/* ⭐ Rating */}
          <View style={styles.ratingRow}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Ionicons
                key={i}
                name={i < (it.stats?.rating || it.rating || 0) ? "star" : "star-outline"}
                size={12}
                color="#FFD54F"
                style={{ marginRight: 2 }}
              />
            ))}
          </View>

          {/* 🪙 Currency icon + price */}
          <View style={styles.priceRow}>
            {it.currency === 'diamonds' || !it.currency ? (
              <MaterialCommunityIcons name="diamond-stone" size={16} color="#EC4899" />
            ) : (
              <Image source={require("./assets/goldicon.png")} style={styles.goldIcon} />
            )}
            <Text style={styles.priceText}>
              {it.price} {it.currency === 'coins' ? 'Coins' : 'Diamonds'}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  headerIcons: { flexDirection: "row", gap: 14 },
  avatar: { width: 38, height: 38, borderRadius: 19 },

  balanceRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 8,
  },
  balanceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: CARD,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#23232A",
  },
  balanceText: { color: "#fff", fontWeight: "600" },

  promoCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 14,
  },
  promoTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  promoDesc: { color: "#fff", fontSize: 12, opacity: 0.9, marginTop: 4 },
  promoImage: { width: 70, height: 70 },

  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
    paddingHorizontal: 8,
  },
  catItem: { alignItems: "center", gap: 6 },
  catIcon: { width: 72, height: 72, borderRadius: 8, resizeMode: "contain" },
  catText: { color: TEXT_DIM, fontSize: 12 },

  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  setupText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 6,
  },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  sectionView: { color: CYAN, fontSize: 12, fontWeight: "600" },

  userCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#23232A",
    padding: 10,
    marginRight: 10,
    width: 220,
  },
  userRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  userAvatar: { width: 38, height: 38, borderRadius: 19, marginRight: 10 },
  userName: { color: "#fff", fontWeight: "700" },
  userTag: { color: TEXT_DIM, fontSize: 12 },
  coinBtn: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  coinText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  aiGenerationRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
  },
  aiGenCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  aiGenGradient: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 160,
  },
  aiGenTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
  },
  aiGenDesc: {
    color: "#fff",
    fontSize: 12,
    opacity: 0.9,
    marginTop: 4,
    textAlign: "center",
  },
  aiGenBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  aiGenBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  tabsRow: { flexDirection: "row", gap: 8, paddingHorizontal: 14, marginTop: 14 },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: "#23232A",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabPillActive: {
    backgroundColor: `${ACCENT}33`,
    borderColor: `${ACCENT}88`,
    borderBottomColor: ACCENT,
  },
  tabText: { color: TEXT_DIM, fontSize: 13, fontWeight: "700" },
  tabTextActive: { color: ACCENT },

  gridWrap: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 10, paddingBottom: 30 },
  productCard: {
    width: "47%",
    margin: "1.5%",
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#23232A",
    padding: 10,
  },
  productImg: { width: "100%", height: 110, borderRadius: 10, marginBottom: 8 },
  productTitle: { color: "#fff", fontWeight: "700", marginBottom: 6 },
  ratingRow: { flexDirection: "row", marginBottom: 8 },
  priceRow: { flexDirection: "row", alignItems: "center" },
  goldIcon: { width: 16, height: 16, marginRight: 6, resizeMode: "contain" },
  priceText: { color: "#fff", fontWeight: "800" },

  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: TEXT_DIM,
    fontSize: 14,
    marginTop: 12,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDesc: {
    color: TEXT_DIM,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

