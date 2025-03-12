import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  useWindowDimensions,
  TouchableOpacity,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator, // Import ActivityIndicator
} from "react-native";
import { FlatGrid } from "react-native-super-grid";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Card } from "react-native-shadow-cards";
import { COLORS } from "./Styles";
import axios from "axios";
import tokenValidation from '../../components/validateToken';

export default function ReferScreen({ navigation }) {
  const { height } = useWindowDimensions();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(false);  

  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

    return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
    };
}, [navigation]);

  useEffect(() => {
    navigation.setOptions({ title: 'Refer' });
    const fetchReferralData = async () => {
      setLoading(true); 
      try {
        const { token, user_id, token_expiration } = await tokenValidation(navigation);

        console.log("Token refer validation returned:", {
          token,
          user_id,
          token_expiration,
        });

        const response = await axios.get(`https://imorapidtransfer.com/api/v1/refer`, {
          headers: {
            token: token,
            token_expiration: token_expiration,
          },
          params: {
            user_id: user_id,
          },
        });

        setReferralData(response.data); // Set referral data on success
      } catch (error) {
        console.error("Error fetching referral data:", error);

        if (error.message === "Token expired") {
           navigation.navigate("Auth");
        }
      } finally {
        setLoading(false); // Set loading to false once the request is complete
      }
    };

    fetchReferralData();
  }, [navigation]);

  const inviteMessage = referralData ? encodeURIComponent(referralData.inviteMessage) : "";

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${inviteMessage}`,
    viber: `viber://forward?text=${inviteMessage}`,
    signal: `sgnl://send?text=${inviteMessage}`,
  };

  const openShareModal = () => setIsModalVisible(true);
  const closeShareModal = () => setIsModalVisible(false);

  const handleShare = (platform) => {
    Linking.openURL(shareLinks[platform]);
    closeShareModal();
  };

  return (
    <>
      <View style={{ flex: 1, backgroundColor: "#E3E3E3" }}>
        <FlatGrid
          ListHeaderComponent={() => (
            <View style={[styles.header, { height: height * 0.25 }]}>
              <Image
                resizeMode={"contain"}
                style={styles.logo}
                source={require("../../assets/icon.png")}
              />
              <TouchableOpacity
                style={styles.inviteButton}
                onPress={openShareModal}
              >
                <Text style={styles.inviteText}>Invite Friends</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.flatgridContainer}
          data={[]}
          spacing={8}
        />
        
        {/* Display loading spinner when data is being fetched */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.referralInfoContainer}>
            {referralData && (
              <View style={styles.card}>
                <Text style={styles.cardText}>
                  Referral Code: {referralData.referrerCode}
                </Text>
                <Text style={styles.cardText}>
                  Reward for this month: {referralData.firstContext}
                </Text>
                {referralData.firstContext && (
                  <Text style={styles.cardText}>
                    Highest Position: {referralData.firstContext}
                  </Text>
                )}
                {referralData.secondContext && (
                  <Text style={styles.cardText}>
                    Second Position: {referralData.secondContext}
                  </Text>
                )}
                {referralData.lastContext && (
                  <Text style={styles.cardText}>
                    Third Position: {referralData.lastContext}
                  </Text>
                )}
                {referralData.annualContext && (
                  <Text style={styles.cardText}>
                    Current Year Reward: {referralData.annualContext}
                  </Text>
                )}
                <View style={styles.barContainer}>
                  <Text style={styles.barText}>
                    Total Referrals: {referralData.totalReferrals}
                  </Text>
                  <View
                    style={[
                      styles.bar,
                      { width: `${(referralData.totalReferrals / 100) * 100}%` },
                    ]}
                  />
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={closeShareModal}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select a platform to share:</Text>
            <Pressable
              style={styles.modalButton}
              onPress={() => handleShare("whatsapp")}
            >
              <Text style={styles.modalButtonText}>Share on WhatsApp</Text>
            </Pressable>
            <Pressable
              style={styles.modalButton}
              onPress={() => handleShare("viber")}
            >
              <Text style={styles.modalButtonText}>Share on Viber</Text>
            </Pressable>
            <Pressable
              style={styles.modalButton}
              onPress={() => handleShare("signal")}
            >
              <Text style={styles.modalButtonText}>Share on Signal</Text>
            </Pressable>
            <Pressable style={styles.closeButton} onPress={closeShareModal}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    backgroundColor: "#E3E3E3",
  },
  inviteButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginTop: 20,
  },
  inviteText: {
    color: "white",
    fontSize: 16,
  },
  card: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  cardText: {
    fontSize: 16,
    color: "black",
    marginBottom: 5,
  },
  referralInfoContainer: {
    padding: 20,
  },
  barContainer: {
    marginTop: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
  },
  barText: {
    padding: 10,
    fontSize: 16,
    color: "#333",
  },
  bar: {
    height: 8,
    backgroundColor: "#4caf50",
    borderRadius: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: 300,
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  modalButton: {
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },
  modalButtonText: {
    color: "white",
    textAlign: "center",
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 10,
    backgroundColor: "gray",
    borderRadius: 5,
  },
  closeButtonText: {
    color: "white",
    textAlign: "center",
  },
});
