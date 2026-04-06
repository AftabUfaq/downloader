import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import InstagramScreen from '../screens/InstagramScreen';
import FacebookScreen from '../screens/FacebookScreen';
import TikTokScreen from '../screens/TikTokScreen';
import YouTubeScreen from '../screens/YouTubeScreen';
import TwitterScreen from '../screens/TwitterScreen';
import SnapchatScreen from '../screens/SnapchatScreen';
import PinterestScreen from '../screens/PinterestScreen';
import LinkedInScreen from '../screens/LinkedInScreen';

const Stack = createStackNavigator();

export default function HomeStack() {
  return (
  <Stack.Navigator 
  screenOptions={{ 
    headerStyle: { 
      backgroundColor: '#FFFFFF',
      elevation: 0,               
      shadowOpacity: 0,           
      borderBottomWidth: 1,       
      borderBottomColor: '#EEE',
    },
    headerTitleAlign: 'center', 
    headerTitleStyle: {
      fontWeight: '900',
      color: '#FF1212',           
      fontSize: 20,
    },
    // This controls the Back Button color
    headerTintColor: '#00CC00',  
    headerBackTitleVisible: false, 
  }}
>
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{ title: 'SnappySave' }} 
      />
      <Stack.Screen name="Instagram" component={InstagramScreen} />
      <Stack.Screen name="Facebook" component={FacebookScreen} />
      <Stack.Screen name="TikTok" component={TikTokScreen} />
      <Stack.Screen name="YouTube" component={YouTubeScreen} />
      <Stack.Screen name="Twitter" component={TwitterScreen} />
      <Stack.Screen name="Snapchat" component={SnapchatScreen} />
      <Stack.Screen name="Pinterest" component={PinterestScreen} />
      <Stack.Screen name="LinkedIn" component={LinkedInScreen} />
    </Stack.Navigator>
  );
}