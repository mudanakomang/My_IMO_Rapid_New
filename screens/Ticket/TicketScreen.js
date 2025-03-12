import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Dimensions,
  ScrollView,
  View,
  Text,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import tokenValidation from "../../components/validateToken";
import { CreateTicket } from "./CreateTicket";  
import { TicketDetails} from "./TicketDetails";  

const { width } = Dimensions.get("screen");

const Ticket = ({ navigation }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    navigation.setOptions({
      title: 'Ticket',
      headerStyle: {
        backgroundColor: '#006400',
      },
    });
  
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
  
    return () => {
      navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
    };
  }, [navigation]);
  
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const { token, user_id, token_expiration } = await tokenValidation(navigation);
  
        if (!user_id || !token || !token_expiration) {
          Alert.alert("Error", "Required user information is missing.");
          setLoading(false);
          return;
        }
  
        const response = await axios.get(
          "https://imorapidtransfer.com/api/v1/tickets",
          {
            headers: {
              token: token,
              token_expiration: token_expiration,
            },
            params: {
              user_id: user_id,
              page: currentPage,
            },
          }
        );
  
        if (response.data && response.data.data) {
          setTickets(response.data.data);
          setTotalPages(response.data.last_page);
        } else {
          Alert.alert("Error", "No tickets found.");
        }
      } catch (error) {
        console.error("Error fetching tickets:", error);
        if (error.response && error.response.status === 401) {
          Alert.alert("Session Expired", "Your session has expired. Please log in again.");
        } else {
          Alert.alert("Error", "Failed to load tickets.");
        }
      } finally {
        setLoading(false);
      }
    };
  
    fetchTickets();
  }, [navigation, currentPage]);
  

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleTicketClick = (ticket) => {
    console.log("Navigating to TicketDetails with data:", ticket);
    navigation.navigate("TicketDetails", { ticket });
  
  };

  const getStatus = (statusId) => {
    switch (statusId) {
      case 1:
        return { status: "Open", color: "#00a65a" };
      case 2:
        return { status: "In Progress", color: "#3c8dbc" };
      case 3:
        return { status: "Hold", color: "#f39c12" };
      case 4:
        return { status: "Closed", color: "#dd4b39" };
      default:
        return { status: "Unknown", color: "#000" };
    }
  };

  const handleAddTicket = () => {
    navigation.navigate("CreateTicket");  
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
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.addTicketButton} onPress={handleAddTicket}>
          <Text style={styles.addTicketText}>Add Ticket</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollView}>
        {tickets.length > 0 ? (
          tickets.map((ticket) => {
            const ticketStatusId = parseInt(ticket.ticket_status_id, 10);
            const { status, color } = getStatus(ticketStatusId);
            return (
              <TouchableOpacity
                key={ticket.id}
                style={styles.ticketContainer}
                onPress={() => handleTicketClick(ticket)}
              >
                <Text style={styles.ticketSubject}>Subject: {ticket.subject}</Text>
                <Text style={styles.ticketMessage}>Ticket ID: {ticket.code}</Text>
                <Text style={styles.ticketCode}>Priority: {ticket.priority}</Text>
                <Text style={styles.ticketStatus}>
                  Status: <Text style={{ color: color }}>{status}</Text>
                </Text>
                <Text style={styles.ticketDate}>
                  Created At: {new Date(ticket.created_at).toLocaleString()}
                </Text>
              </TouchableOpacity>
            );
          })
        ) : (
          <Text>No tickets available.</Text>
        )}
      </ScrollView>

      <View style={styles.pagination}>
        <TouchableOpacity
          onPress={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <Text style={[styles.pageButton, { opacity: currentPage <= 1 ? 0.5 : 1 }]}>
            Previous
          </Text>
        </TouchableOpacity>

        <Text style={styles.pageInfo}>
          Page {currentPage} of {totalPages}
        </Text>

        <TouchableOpacity
          onPress={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <Text style={[styles.pageButton, { opacity: currentPage >= totalPages ? 0.5 : 1 }]}>
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3E3E3',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerContainer: {
    marginBottom: 20,
  },
  addTicketButton: {
    width: width * 0.3,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: "#006400",
    borderRadius: 25,
    alignItems: "center",
  },
  addTicketText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  scrollView: {
    paddingBottom: 20,
  },
  ticketContainer: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  ticketSubject: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  ticketMessage: {
    fontSize: 14,
    marginVertical: 5,
    color: "#000",
  },
  ticketCode: {
    fontSize: 14,
    marginVertical: 5,
    color: "#000",
  },
  ticketStatus: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#aaa",
  },
  ticketDate: {
    fontSize: 12,
    color: "#aaa",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  pageInfo: {
    fontSize: 14,
    color: "#aaa",
  },
  pageButton: {
    fontSize: 16,
    color: "#007bff",
  },
});

export default Ticket;
