import React, { useEffect, useState } from 'react';
import {
  View, 
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SectionList
} from 'react-native';
import firebase from '../Config';

const auth = firebase.auth();
const database = firebase.database();

export default function Discussions({ navigation }) {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const currentUserID = auth.currentUser.uid;

  useEffect(() => {
    const usersRef = database.ref('users');
    const groupsRef = database.ref('groups');

    const handleUsers = (snapshot) => {
      const usersData = snapshot.val();
      if (usersData) {
        const usersList = Object.entries(usersData)
          .filter(([id]) => id !== currentUserID)
          .map(([id, data]) => ({
            id,
            ...data,
          }));
        setUsers(usersList);
      }
    };

    const handleGroups = (snapshot) => {
      const groupsData = snapshot.val();
      if (groupsData) {
        const groupsList = Object.entries(groupsData)
          .filter(([_, group]) => group.members?.includes(currentUserID))
          .map(([id, data]) => ({
            id,
            ...data,
          }));
        setGroups(groupsList);
      }
    };

    usersRef.on('value', handleUsers);
    groupsRef.on('value', handleGroups);

    return () => {
      usersRef.off('value', handleUsers);
      groupsRef.off('value', handleGroups);
    };
  }, []);

  const generateDiscussionID = (id1, id2) => {
    // Sort IDs by length and concatenate
    return id1 <= id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
  };
  
  const handlePress = (item, sectionTitle) => {
    
    if (sectionTitle === 'Users') {
      const discussionID = generateDiscussionID(currentUserID, item.id);
      navigation.navigate('Chat', {
        discussionID,
        userID: item.id,
      });
    } else {
      // Group chat navigation remains the same
      navigation.navigate('Chat', {
        discussionID: item.id,
        userID: item.id,
      });
    }
  };

  const handleLongPress = (item) => {
    if (selectedUsers.find(u => u.id === item.id)) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== item.id));
    } else if (selectedUsers.length < 2) {
      setSelectedUsers([...selectedUsers, item]);
      if (selectedUsers.length === 1) {
        createGroupChat([...selectedUsers, item]);
      }
    }
  };

  const createGroupChat = async (members) => {
    try {
      const groupName = members.map(user => user.name).join(', ');
      const groupMembers = [...members.map(user => user.id), currentUserID];

      const newGroupRef = database.ref('groups').push();
      await newGroupRef.set({
        name: groupName,
        members: groupMembers,
        createdAt: new Date().toISOString(),
        createdBy: currentUserID
      });

      setSelectedUsers([]);
      Alert.alert('Success', 'Group chat created!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create group chat');
      console.error(error);
    }
  };

  const renderItem = ({ item, section }) => (
    <TouchableOpacity
      style={[
        styles.userCard,
        selectedUsers.find(u => u.id === item.id) && styles.selectedUser,
      ]}
      onPress={() => handlePress(item, section.title)}
      onLongPress={() => section.title === 'Users' && handleLongPress(item)}
    >
      <View style={styles.userInfo}>
        <Image 
          source={{ uri: item.profileImage }} 
          style={styles.profileImage}
        />
        <Text style={styles.userName}>{item.name}</Text>
        {item.isActive && <View style={styles.activeDot} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SectionList
        sections={[
          { title: 'Groups', data: groups },
          { title: 'Users', data: users }
        ]}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        keyExtractor={item => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  sectionHeader: {
    padding: 15,
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#f4f4f4',
  },
  userCard: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedUser: {
    backgroundColor: '#e3f2fd',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userName: {
    marginLeft: 15,
    fontSize: 16,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginLeft: 10,
  },
});
