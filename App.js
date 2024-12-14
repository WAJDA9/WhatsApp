import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Home from './Screens/Home';
import LoginScreen from './Screens/authentification';
import NewUser from './Screens/NewUser';
import Chat from './Screens/chat';
import Profile from './Screens/Profile';
import Discussions from './Screens/discussions';
const Stack = createNativeStackNavigator();


// Root Stack Navigator
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">

        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="NewUser" component={NewUser} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
        <Stack.Screen name="Chat" component={Chat} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={Profile} options={{ headerShown: false }} />
        <Stack.Screen name="Discussions" component={Discussions} options={{ headerShown: false }} />
       
      </Stack.Navigator>
    </NavigationContainer>
  );
}
