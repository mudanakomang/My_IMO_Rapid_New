import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Linking,
  Button,
} from "react-native";
import axios from "axios";
import tokenValidation from "../../components/validateToken";
import { decode } from "html-entities";
import * as DocumentPicker from 'expo-document-picker';  

const TicketDetails = ({ route, navigation }) => {
  const { ticket } = route.params;
  const [replies, setReplies] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [fileToUpload, setFileToUpload] = useState(null);  

  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
  
    return () => {
      navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
    };
  }, [navigation]);
  
  useEffect(() => {
    const ticketCode = ticket.id;
    console.log("Received ticket ID:", ticketCode);
    navigation.setOptions({
      title: `Ticket: ${ticketCode}`,
      headerStyle: {
        backgroundColor: "#006400",
      },
    });
  
    const fetchReplies = async () => {
      try {
        const { token, user_id, token_expiration } = await tokenValidation(navigation);
  
        if (!user_id || !token || !token_expiration) {
          Alert.alert("Error", "Required user information is missing.");
          setLoading(false);
          return;
        }
  
        const endpoint = `https://imorapidtransfer.com/api/v1/tickets/${ticketCode}/replies`;
        console.log("GET endpoint for fetching replies:", endpoint);
  
        const response = await axios.get(endpoint, {
          headers: {
            token: token,
            token_expiration: token_expiration,
          },
          params: {
            user_id: user_id,
          },
        });
  
        console.log("Raw API Response:", response.data);
  
        if (response.data && response.data.data) {
          const sortedReplies = response.data.data.sort((a, b) =>
            new Date(a.created_at) - new Date(b.created_at)
          );
  
          const formattedReplies = sortedReplies.map((reply) => ({
            ...reply,
            sender: reply.user_type === "admin" ? "admin" : "user",
            message: decode(reply.message),
            created_at: new Date(reply.created_at).toISOString(),
          }));
  
          console.log("Formatted Replies:", formattedReplies);
          setReplies(formattedReplies);
        } else {
          Alert.alert("Error", "No replies found for this ticket.");
        }
      } catch (error) {
        console.error("Error fetching replies:", error);
        Alert.alert("Error", "Failed to load replies.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchReplies();
  }, [ticket, navigation]);   
  
  //   fetchReplies();
  // }, [ticket]);

  const handleSendReply = async () => {
    if (!newMessage.trim()) {
      Alert.alert("Error", "Message cannot be empty.");
      return;
    }

    const endpoint = `https://imorapidtransfer.com/api/v1/tickets/${ticket.code}/reply`;
    console.log("POST endpoint for sending reply:", endpoint);

    try {
      setLoading(true);
      const { token, user_id, token_expiration } = await tokenValidation(navigation);

      if (!user_id || !token || !token_expiration) {
        Alert.alert("Error", "Required user information is missing.");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("message", newMessage);
      if (fileToUpload) {
        formData.append("file", {
          uri: fileToUpload.uri,
          name: fileToUpload.name,
          type: fileToUpload.type,
        });
      }

      const response = await axios.post(endpoint, formData, {
        headers: {
          token: token,
          token_expiration: token_expiration,
          "Content-Type": "multipart/form-data",
        },
        params: {
          user_id: user_id,
        },
      });

      if (response.data && response.data.success) {
        setReplies((prevReplies) => [
          ...prevReplies,
          { message: newMessage, sender: "user", created_at: new Date().toISOString() },
        ]);
        setNewMessage("");
        setFileToUpload(null);  
      } else {
        Alert.alert("Error", "Failed to send reply.");
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      Alert.alert("Error", "Failed to send reply.");
    } finally {
      setLoading(false);
    }
  };

  const formatReply = (reply) => {
    const hasFileAttachment = reply.message.includes("http");  
    return (
      <View
        key={reply.id}
        style={[
          styles.messageContainer,
          reply.sender === "admin" ? styles.adminMessage : styles.userMessage,
        ]}
      >
        <Text style={styles.messageText}>{decode(reply.message)}</Text>
        
         
        {hasFileAttachment && (
          <TouchableOpacity onPress={() => Linking.openURL(reply.message)}>
            <Text style={styles.downloadText}>Download File</Text>
          </TouchableOpacity>
        )}
        
        <Text style={styles.messageTime}>
          {new Date(reply.created_at).toLocaleString()}
        </Text>
      </View>
    );
  };

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",  
      });
      if (result.type === "success") {
        setFileToUpload(result);  
        console.log("Selected file:", result);
      }
    } catch (error) {
      console.error("Error picking file:", error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.chatContainer}>
        {replies.length > 0 ? (
          replies.map(formatReply)
        ) : (
          <Text style={{ textAlign: "center", marginVertical: 20 }}>
            No replies yet.
          </Text>
        )}
      </ScrollView>

      {ticket.file_approval === "1" && (
        <View style={styles.fileUploadContainer}>
          <Button title="Upload File" onPress={handleFileUpload} />
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Type your reply..."
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendReply}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3E3E3',
  },
  chatContainer: {
    flex: 1,
    padding: 15,
  },
  messageContainer: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    maxWidth: "70%",
  },
  adminMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#d1e7dd",  
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#f8d7da",  
  },
  messageText: {
    fontSize: 14,
    color: "#333",  
  },
  messageTime: {
    fontSize: 10,
    marginTop: 5,
    color: "#888",
  },
  fileUploadContainer: {
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  downloadText: {
    color: "#007bff",
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  textInput: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 25,
    backgroundColor: "#f4f4f4",
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#006400",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  pendingReply: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
});

export default TicketDetails;
