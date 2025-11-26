import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { View, ActivityIndicator } from 'react-native';
import { app as firebaseApp, db } from './firebaseConfig';
import LoginScreen from './loginscreen';
import SignupScreen from './signupscreen';
import WithPhoneScreen from './withphonescreen';
import WithEmailScreen from './withemailscreen';
import OtpVerificationScreen from './otpverify';
import CreateAccountScreen from './createaccount';
import AgeVerificationScreen from './ageverification';
import AccountLoginScreen from './accountloginscreen';
import SplashScreen from './splashscreen';
import HomeScreen from './homescreen';
import SearchBarScreen from './searchbar';
import NotificationScreen from './notification';
import TabBarScreen from './tabbarview';
import CommunityScreen from './community';
import CommunityDetailScreen from './communitydetail';
import ExploreScreen from './explore';
import GroupInfoScreen from './groupinfo';
import MessageScreen from './messagescreen';
import ChatScreen from './chatscreen';
import MarketPlaceScreen from './marketplace';
import MarketPlaceExploreScreen from './marketplaceexplore';
import StickerPreviewScreen from './stickerpreview';
import PaymentDetailScreen from './paymentdetail';
import PaymentSelectionScreen from './paymentselection';
import CoinPurchaseScreen from './coinpurchase';
import DiamondPurchaseScreen from './diamondpurchase';
import ProfileScreen from './profile';
import EditProfileScreen from './editprofile';
import MyStoreScreen from './mystore';
import StoreManagmentScreen from './storemanagment';
import RewardScreen from './reward';
import DailyRewardScreen from './dailyreward';
import MembershipScreen from './membership';
import WhatsHappeningScreen from './whatshappening';
import CreateCommunityScreen from './CreateCommunityScreen';
import EditCommunityScreen from './EditCommunityScreen';
import GroupAudioCallScreen from './GroupAudioCallScreen';
import ScreenSharingRoom from './ScreenSharingRoom';
import RoleplayScreen from './RoleplayScreen';

const Stack = createStackNavigator();

export default function App() {
  const [initializing, setInitializing] = React.useState(true);
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const auth = getAuth(firebaseApp);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });

    return unsubscribe;
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
        <ActivityIndicator size="large" color="#8B2EF0" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={user ? 'Home' : 'Login'}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="WithPhone" component={WithPhoneScreen} />
        <Stack.Screen name="WithEmail" component={WithEmailScreen} />
        <Stack.Screen name="OtpVerify" component={OtpVerificationScreen} />
        <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
        <Stack.Screen name="AgeVerification"component={AgeVerificationScreen}/>
        <Stack.Screen name="AccountLogin" component={AccountLoginScreen} />
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="SearchBar" component={SearchBarScreen} />
        <Stack.Screen name="Notification" component={NotificationScreen} />
        <Stack.Screen name="TabBar" component={TabBarScreen} />
        <Stack.Screen name="Community" component={CommunityScreen} />
  <Stack.Screen name="CommunityDetail" component={CommunityDetailScreen} />
        <Stack.Screen name="Explore" component={ExploreScreen} />
        <Stack.Screen name="GroupInfo" component={GroupInfoScreen} />
        <Stack.Screen name="Message" component={MessageScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="MarketPlace" component={MarketPlaceScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="MarketPlaceExplore" component={MarketPlaceExploreScreen}/>
        <Stack.Screen name="StickerPreview" component={StickerPreviewScreen} />
        <Stack.Screen name="PaymentDetail" component={PaymentDetailScreen} />
        <Stack.Screen name="PaymentSelection"component={PaymentSelectionScreen}/>
        <Stack.Screen name="CoinPurchase" component={CoinPurchaseScreen} />
        <Stack.Screen name="DiamondPurchase" component={DiamondPurchaseScreen}/>
        <Stack.Screen name="MyStore" component={MyStoreScreen}/>
         <Stack.Screen name="StoreManagment" component={StoreManagmentScreen}/>
           <Stack.Screen name="Reward" component={RewardScreen}/>
            <Stack.Screen name="DailyReward" component={DailyRewardScreen}/>
             <Stack.Screen name="Membership" component={MembershipScreen}/>
             <Stack.Screen name="WhatsHappening" component={WhatsHappeningScreen}/>
             <Stack.Screen name="CreateCommunityScreen" component={CreateCommunityScreen}/>
             <Stack.Screen name="EditCommunity" component={EditCommunityScreen}/>
             <Stack.Screen name="GroupAudioCall" component={GroupAudioCallScreen}/>
             <Stack.Screen name="ScreenSharingRoom" component={ScreenSharingRoom}/>
             <Stack.Screen name="RoleplayScreen" component={RoleplayScreen}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

