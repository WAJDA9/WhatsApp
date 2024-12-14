import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import firebase from '../Config';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  'https://uocydybukiajyblhwwec.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvY3lkeWJ1a2lhanlibGh3d2VjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzc3MTA5MywiZXhwIjoyMDQ5MzQ3MDkzfQ.MjsPMsuhmx3C0v9WZBp2NnRAvb2br-YmcAariLgacGA'
);
const database = firebase.database();
const auth = firebase.auth();

export default function Chat({ route }) {
  const { discussionID, userID } = route.params;
  const currentUserID = auth.currentUser.uid;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipientData, setRecipientData] = useState({
    name: '',
    profileImage: ''
  });
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);
  const [userProfiles, setUserProfiles] = useState({});
  const [uploading, setUploading] = useState(false);

  // Fetch messages from Firebase
  useEffect(() => {
    const messagesRef = database.ref(`discussions/${discussionID}`);
    const onValueChange = messagesRef.on('value', (snapshot) => {
      if (snapshot.exists()) {
        const messagesData = snapshot.val();
        const formattedMessages = Object.keys(messagesData).map((key) => ({
          id: key,
          ...messagesData[key],
        }));
        setMessages(formattedMessages);
      } else {
        setMessages([]);
      }
    });

    return () => messagesRef.off('value', onValueChange);
  }, [discussionID]);

  // Fetch recipient data from Firebase
  useEffect(() => {
    const userRef = database.ref(`users/${userID}`);
    userRef.once('value').then((snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setRecipientData({
          name: userData.name || '',
          profileImage: userData.profileImage || ''
        });
      }
    });
  }, [userID]);

  // Fetch user profile images
  useEffect(() => {
    const fetchUserProfiles = async () => {
      const usersRef = database.ref('users');
      const snapshot = await usersRef.once('value');
      const users = snapshot.val();
      const profiles = {};
      Object.entries(users).forEach(([id, user]) => {
        profiles[id] = user.profileImage;
      });
      setUserProfiles(profiles);
    };
    fetchUserProfiles();
  }, []);

  // Listen for typing status changes
  useEffect(() => {
    const typingRef = database.ref(`discussions/${discussionID}/typing`);
    const typingHandler = typingRef.on('value', (snapshot) => {
      const typingUsers = snapshot.val();
      if (typingUsers && Object.keys(typingUsers).length > 0) {
        const typingUserIDs = Object.keys(typingUsers);
        if (typingUserIDs.includes(userID)) {
          setIsRecipientTyping(true);
        } else {
          setIsRecipientTyping(false);
        }
      } else {
        setIsRecipientTyping(false);
      }
    });

    return () => typingRef.off('value', typingHandler);
  }, [discussionID, userID]);

  // Handle typing status updates
  const handleTyping = () => {
    if (typingTimeout) clearTimeout(typingTimeout);
    setIsTyping(true);
    setTypingTimeout(
      setTimeout(() => {
        setIsTyping(false);
        database.ref(`discussions/${discussionID}/typing`).child(currentUserID).remove();
      }, 1000) // Adjust delay as needed
    );
    database.ref(`discussions/${discussionID}/typing`).child(currentUserID).set(true);
  };

  // Send a message
  const sendMessage = async () => {
    if (newMessage.trim() === '') return;
    const message = {
      senderID: currentUserID,
      receiverID: userID,
      content: newMessage,
      sendTime: new Date().toISOString(),
    };
    await database.ref(`discussions/${discussionID}`).push(message);
    setNewMessage('');
    setIsTyping(false); // Reset typing status after sending
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    setUploading(true);
    const fileName = `chat-${discussionID}-${Date.now()}.jpg`;
  
    try {
      // Read file as base64
      const base64File = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
  
      // Convert to ArrayBuffer
      const fileData = decode(base64File);
  
      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, fileData, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: true,
        });
  
      if (error) {
        console.error('Error uploading image:', error.message);
        Alert.alert('Upload Error', error.message);
      } else {
        const imageUrl = data?.path
          ? supabase.storage.from('images').getPublicUrl(data.path).data.publicUrl
          : null;
  
        if (imageUrl) {
          // Store message with image URL in Firebase
          const message = {
            senderID: currentUserID,
            receiverID: userID,
            content: imageUrl,
            type: 'image',
            sendTime: new Date().toISOString(),
          };
          await database.ref(`discussions/${discussionID}`).push(message);
        }
      }
    } catch (error) {
      console.error('Error in uploadImage:', error);
      Alert.alert('Upload Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {recipientData.profileImage ? (
          <Image 
            source={{ uri: recipientData.profileImage }} 
            style={styles.profileImage} 
          />
        ) : (
          <View style={styles.profilePlaceholder} />
        )}
        <Text style={styles.userName}>{recipientData.name || 'Group'}</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[
            styles.messageRow,
            item.senderID === currentUserID ? styles.sentMessageRow : styles.receivedMessageRow
          ]}>
            {item.senderID !== currentUserID && (
              <Image 
                source={{ uri: userProfiles[item.senderID] }} 
                style={styles.messageAvatar}
              />
            )}
            <View style={[
              styles.messageBubble,
              item.senderID === currentUserID ? styles.sentMessage : styles.receivedMessage,
            ]}>
              {item.type === 'image' ? (
                <Image 
                  source={{ uri: item.content }}
                  style={styles.messageImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.messageText}>{item.content}</Text>
              )}
              <Text style={styles.timestamp}>{item.sendTime}</Text>
            </View>
          </View>
        )}
      />
      {isRecipientTyping && (
        <Text>Recipient is typing...</Text>
      )}

      {/* Input and Send Button */}
      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
          <Ionicons name="image-outline" size={24} color="#0084ff" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={(text) => {
            setNewMessage(text);
            handleTyping();
          }}
          placeholder="Type a message..."
          onBlur={() => {
            setIsTyping(false);
            database.ref(`discussions/${discussionID}/typing`).child(currentUserID).remove();
          }}
        />
        <TouchableOpacity onPress={sendMessage}>
          <Ionicons name="send" size={24} color="#0084ff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    marginTop: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ddd',
    marginRight: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  sentMessageRow: {
    justifyContent: 'flex-end',
  },
  receivedMessageRow: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  sentMessage: {
    backgroundColor: '#0084ff',
    marginLeft: 40,
  },
  receivedMessage: {
    backgroundColor: '#C9C9C9FF',
  },
  messageText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 5,
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 10,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  typingIndicator: {
    marginVertical: 10,
    textAlign: 'center',
    color: '#555',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
  },
  imageButton: {
    padding: 10,
  },
});