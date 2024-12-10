import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import firebase from '../Config';

const auth = firebase.auth();
const database = firebase.database();

export default function Discussions({ navigation }) {
  const [users, setUsers] = useState([]);
  const currentUserID = auth.currentUser.uid;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await database.ref('users').once('value');
        const usersList = [];
        snapshot.forEach((childSnapshot) => {
          const userData = childSnapshot.val();
          if (childSnapshot.key !== currentUserID) {
            usersList.push({ id: childSnapshot.key, ...userData });
          }
        });
        setUsers(usersList);
      } catch (error) {
        Alert.alert('Error', 'Could not fetch users.');
        console.error(error);
      }
    };

    fetchUsers();
  }, []);

  const startChat = (userID) => {
    const discussionID =
      currentUserID < userID
        ? `${currentUserID}-${userID}`
        : `${userID}-${currentUserID}`;
    navigation.navigate('Chat', { discussionID, userID });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Users</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userCard}
            onPress={() => startChat(item.id)}
          >
            <Text style={styles.userName}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  userCard: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  userName: {
    fontSize: 18,
  },
});
