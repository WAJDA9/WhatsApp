import React, { useEffect, useState } from 'react';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import Profile from './Profile';
import Discussions from './discussions';
import firebase from '../Config';

const auth = firebase.auth();
const database = firebase.database();
const Tab = createMaterialBottomTabNavigator();

export default function Home({ navigation }) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    if (!auth.currentUser) {
      navigation.reset({
        routes: [{ name: 'Login' }],
      });
      return;
    }

    // Update isActive status for current user
    const userRef = database.ref(`users/${auth.currentUser.uid}`);
    
    userRef.update({
      isActive: true
    }).then(() => {
      setIsActive(true);
    }).catch((error) => {
      console.error("Error updating isActive: ", error);
    });

    // Cleanup function
    return () => {
      if (auth.currentUser) {
        userRef.update({
          isActive: false
        }).catch((error) => {
          console.error("Error updating isActive on unmount: ", error);
        });
      }
    };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Discussions') {
            iconName = 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = 'person-outline';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6200EE',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Discussions" component={Discussions} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}