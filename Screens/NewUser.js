import React, { useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ImageBackground,
  SafeAreaView,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import firebase from "../Config"; // Ensure your Firebase configuration is correct

const auth = firebase.auth();
const database = firebase.database(); // Firebase Realtime Database

export default function NewUser(props) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    pseudo: "",
    phone: "",
    profileImage: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureTextEntry2, setSecureTextEntry2] = useState(true);

  const handleSignup = () => {
    if (!formData.email || !formData.password || !formData.name || !formData.pseudo || !formData.phone) {
      Alert.alert("Missing Information", "Please fill out all fields.", [
        { text: "OK" },
      ]);
      return;
    }

    if (formData.password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.", [
        { text: "OK" },
      ]);
      return;
    }

    auth
      .createUserWithEmailAndPassword(formData.email, formData.password)
      .then((userCredential) => {
        const userId = userCredential.user.uid;

        // Save user data in Firebase Realtime Database
        database
          .ref(`users/${userId}`)
          .set({
            name: formData.name,
            email: formData.email,
            pseudo: formData.pseudo,
            phone: formData.phone,
            profileImage: formData.profileImage || "", // Default empty string if not provided
          })
          .then(() => {
            Alert.alert(
              "Account Created",
              "Your account has been created successfully.",
              [{ text: "OK" }]
            );
            props.navigation.navigate("Login");
          })
          .catch((error) => {
            console.error("Error saving user data:", error);
            Alert.alert("Error", "Could not save user data. Please try again.");
          });
      })
      .catch((error) => {
        console.error("Error signing up:", error);
        Alert.alert("Error", error.message, [{ text: "OK" }]);
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("../assets/bg.jpeg")}
        blurRadius={3}
        style={styles.image}
        resizeMode="cover"
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create an Account</Text>

          <View style={styles.inputContainer}>
            <MaterialIcons name="person" size={24} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#666"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="account-circle" size={24} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Pseudo"
              placeholderTextColor="#666"
              value={formData.pseudo}
              onChangeText={(text) => setFormData({ ...formData, pseudo: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={24} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="phone" size={24} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="#666"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={24} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#666"
              secureTextEntry={secureTextEntry}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
            />
            <TouchableOpacity
              onPress={() => setSecureTextEntry(!secureTextEntry)}
              style={styles.eyeIcon}
            >
              <MaterialIcons
                name={secureTextEntry ? "visibility-off" : "visibility"}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={24} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#666"
              secureTextEntry={secureTextEntry2}
              value={confirmPassword}
              onChangeText={(text) => setConfirmPassword(text)}
            />
            <TouchableOpacity
              onPress={() => setSecureTextEntry2(!secureTextEntry2)}
              style={styles.eyeIcon}
            >
              <MaterialIcons
                name={secureTextEntry2 ? "visibility-off" : "visibility"}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleSignup}>
            <Text style={styles.loginButtonText}>Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => props.navigation.goBack()}
          >
            <Text style={styles.loginButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
        justifyContent: "center",
    },
    image: {
        justifyContent: 'center',
        flex: 1,
        width: '100%',
        height: '100%',
    },
    formContainer: {
        marginHorizontal: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 30,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 10,
        marginBottom: 15,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 50,
        color: '#333',
        fontSize: 16,
    },
    eyeIcon: {
        padding: 10,
    },
    loginButton: {
        backgroundColor: '#007AFF',
        borderRadius: 10,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    loginButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    createAccountButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    createAccountText: {
        color: '#666',
        fontSize: 16,
    },
    createAccountTextBold: {
        color: '#007AFF',
        fontWeight: 'bold',
    },
});