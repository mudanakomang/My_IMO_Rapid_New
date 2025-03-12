import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import tokenValidation from "../../components/validateToken";
import { Picker } from '@react-native-picker/picker';

const CreateTicket = ({ navigation }) => {
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("Low");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

    return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
    };
}, [navigation]);

  useEffect(() => {
    navigation.setOptions({
      title: "New Ticket",
      headerStyle: {
        backgroundColor: "#006400",
      },
    });
  }, [navigation]);

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert("Error", "Subject and description are required.");
      return;
    }

    const endpoint = "https://imorapidtransfer.com/api/v1/tickets/create";
    try {
      setLoading(true);
      const { token, user_id, token_expiration } = await tokenValidation(navigation);

      if (!user_id || !token || !token_expiration) {
        Alert.alert("Error", "Required user information is missing.");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        endpoint,
        { subject, priority, description },
        {
          headers: {
            token: token,
            token_expiration: token_expiration,
          },
          params: {
            user_id: user_id,
          },
        }
      );

      if (response.data && response.data.success) {
        Alert.alert("Success", "Ticket created successfully.");
        navigation.goBack();
      } else {
        Alert.alert("Error", "Failed to create the ticket.");
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      Alert.alert("Error", "An error occurred while creating the ticket.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.formContainer}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Subject <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="Enter subject"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.select}>
            <Picker
              selectedValue={priority}
              onValueChange={(itemValue) => setPriority(itemValue)}
            >
              <Picker.Item label="Low" value="Low" />
              <Picker.Item label="Normal" value="Normal" />
              <Picker.Item label="High" value="High" />
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Message <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter your message"
            multiline={true}
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3E3E3',
  },
  formContainer: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 5,
    fontSize: 16,
    fontWeight: "bold",
  },
  required: {
    color: "red",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    backgroundColor: "#fff",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  select: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 5,
    backgroundColor: "#fff",
  },
  submitButton: {
    backgroundColor: "#006400",
    paddingVertical: 10,  
    paddingHorizontal: 30,  
    borderRadius: 25,  
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default CreateTicket;
