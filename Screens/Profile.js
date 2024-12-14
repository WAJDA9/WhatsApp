import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Button,
  Switch,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { createClient } from '@supabase/supabase-js';
import firebase from '../Config';

const auth = firebase.auth();
const database = firebase.database();

// Initialize Supabase client (replace with your Supabase credentials)
const supabase = createClient(
  'https://uocydybukiajyblhwwec.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvY3lkeWJ1a2lhanlibGh3d2VjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzc3MTA5MywiZXhwIjoyMDQ5MzQ3MDkzfQ.MjsPMsuhmx3C0v9WZBp2NnRAvb2br-YmcAariLgacGA'
); // Replace with your Supabase URL and public key

export default function Profile(props) {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    pseudo: '',
    phone: '',
    profileImage: '',
  });
  const [uploading, setUploading] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Fetch user data from Firebase
    database.ref(`users/${auth.currentUser.uid}`).get().then((snapshot) => {
      if (snapshot.exists()) {
        setUserData({
          name: snapshot.val().name,
          email: snapshot.val().email,
          pseudo: snapshot.val().pseudo,
          phone: snapshot.val().phone,
          profileImage: snapshot.val().profileImage,
        });
      }
    });

    // Fetch initial isActive state
    database.ref(`users/${auth.currentUser.uid}/isActive`).once('value')
      .then((snapshot) => {
        setIsActive(snapshot.val() || false);
      });
  }, []);

  // Function to pick image from library
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Permission to access gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      uploadProfilePicture(imageUri);
    }
  };

  // Function to upload image to Supabase Storage
  const uploadProfilePicture = async (imageUri) => {
    setUploading(true);
    const fileName = `profile-${auth.currentUser.uid}.jpg`; // Unique file name for the user

    try {
      // Read the file as a base64 encoded string
      const base64File = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to ArrayBuffer
      const fileData = decode(base64File);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('profile-pictures')
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
          ? supabase.storage.from('profile-pictures').getPublicUrl(data.path).data.publicUrl
          : null;

        if (imageUrl) {
          // Update Firebase Realtime Database with the image URL
          await database.ref(`users/${auth.currentUser.uid}`).update({
            profileImage: imageUrl,
          });
          setUserData({
            ...userData,
            profileImage: imageUrl,
          }); // Update the state with the uploaded image URL
        }
      }
    } catch (error) {
      console.error('Error in uploadProfilePicture:', error);
      Alert.alert('Upload Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Set isActive to false
      await database.ref(`users/${auth.currentUser.uid}`).update({
        isActive: false,
      });

      // Sign out from Firebase
      await auth.signOut();

      props.navigation.reset({
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const handleEditProfile = async () => {
    try {
      // Update Firebase with the new profile data
      await database.ref(`users/${auth.currentUser.uid}`).update({
        name: userData.name,
        email: userData.email,
        pseudo: userData.pseudo,
        phone: userData.phone,
      });

      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditModalVisible(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const toggleActive = async (value) => {
    try {
      await database.ref(`users/${auth.currentUser.uid}`).update({
        isActive: value
      });
      setIsActive(value);
    } catch (error) {
      console.error('Error updating active status:', error);
      Alert.alert('Error', 'Failed to update active status');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.profileContainer}>
        {userData.profileImage ? (
          <Image source={{ uri: userData.profileImage }} style={styles.profileImage} />
        ) : (
          <TouchableOpacity onPress={pickImage} style={styles.uploadButton}>
            <Text style={styles.uploadText}>Upload Profile Picture</Text>
          </TouchableOpacity>
        )}
        {uploading && <Text>Uploading...</Text>}

        <Text style={styles.profileText}>Name: {userData.name}</Text>
        <Text style={styles.profileText}>Email: {userData.email}</Text>
        <Text style={styles.profileText}>Phone: {userData.phone}</Text>
        <Text style={styles.profileText}>Pseudo: {userData.pseudo}</Text>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditModalVisible(true)}
        >
          <Text style={styles.editButtonText}>Modify Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Online Status</Text>
        <Switch
          value={isActive}
          onValueChange={toggleActive}
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={isActive ? "#f5dd4b" : "#f4f3f4"}
        />
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={userData.name}
            onChangeText={(text) => setUserData({ ...userData, name: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={userData.email}
            onChangeText={(text) => setUserData({ ...userData, email: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone"
            value={userData.phone}
            onChangeText={(text) => setUserData({ ...userData, phone: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Pseudo"
            value={userData.pseudo}
            onChangeText={(text) => setUserData({ ...userData, pseudo: text })}
          />
          <View style={{
            display: 'flex',
            flexDirection: 'row',
           alignContent: 'center',
          }}>
          <Button title="Save" onPress={handleEditProfile} />
          <Text>          </Text>
          <Button title="Cancel" onPress={() => setIsEditModalVisible(false)} />
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  uploadButton: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
    borderRadius: 60,
    marginBottom: 20,
  },
  uploadText: {
    color: '#6200EE',
    fontSize: 14,
  },
  profileText: {
    fontSize: 16,
    marginBottom: 10,
  },
  logoutButton: {
    position: 'absolute',
    top: 40,
    right: 10,
    padding: 10,
    backgroundColor: '#FF3B30',
    borderRadius: 5,
    zIndex: 1,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
  },
  editButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#6200EE',
    borderRadius: 5,
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    marginVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});