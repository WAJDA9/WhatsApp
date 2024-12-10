import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { createClient } from '@supabase/supabase-js';
import firebase from '../Config';

const auth = firebase.auth();
const database = firebase.database();

// Initialize Supabase client (replace with your Supabase credentials)
const supabase = createClient('https://uocydybukiajyblhwwec.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvY3lkeWJ1a2lhanlibGh3d2VjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzc3MTA5MywiZXhwIjoyMDQ5MzQ3MDkzfQ.MjsPMsuhmx3C0v9WZBp2NnRAvb2br-YmcAariLgacGA'); // Replace with your Supabase URL and public key

export default function Profile() {
  // const [profilePicture, setProfilePicture] = useState(null);
  // const [userName, setUserName] = useState('');
  // const [userEmail, setUserEmail] = useState('');
  // const [userPseudo, setUserPseudo] = useState('');
  // const [userPhone, setUserPhone] = useState('');
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    pseudo: "",
    phone: "",
    profileImage: "",
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Fetch user data from Firebase
    database.ref(`users/${auth.currentUser.uid}`).get().then((snapshot) => {
      // setUserName(snapshot.val().name);
      // setUserEmail(snapshot.val()["email"]);
      // setUserPseudo(snapshot.val().pseudo);
      // setUserPhone(snapshot.val().phone);

      setUserData({
        name: snapshot.val().name,
        email: snapshot.val().email,
        pseudo: snapshot.val().pseudo,
        phone: snapshot.val().phone,
        profileImage: snapshot.val().profileImage,
      })
      
      // if (snapshot.val()?.profileImage) {
      //   setUserData({
      //     ...userData,
      //     profileImage: snapshot.val().profileImage,

      //   })
       
      //   setProfilePicture(snapshot.val().profileImage);
      // }
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
      console.log(imageUri);

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
        console.log(supabase.storage.from('profile-pictures').getPublicUrl(fileName).data.publicUrl);

        const imageUrl = data?.path
          ? supabase.storage.from('profile-pictures').getPublicUrl(data.path).data.publicUrl
          : null;
        console.log(imageUrl);

        if (imageUrl) {
          // Update Firebase Realtime Database with the image URL
          await database.ref(`users/${auth.currentUser.uid}`).update({
            profileImage: imageUrl,
          });
          setUserData({
            ...userData,
            profileImage: imageUrl,
          }) // Update the state with the uploaded image URL
        }
      }
    } catch (error) {
      console.error('Error in uploadProfilePicture:', error);
      Alert.alert('Upload Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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

      </View>
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
});
