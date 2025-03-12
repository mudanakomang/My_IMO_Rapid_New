import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';  
import axios from 'axios';
import validateToken from '../../components/validateToken';

const RateUsScreen = ({ route, navigation }) => {
    const { transactionId } = route.params;

    const [rating, setRating] = useState(0);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const submitRating = async () => {
        if (rating === 0) {
            Alert.alert("Error", "Please select a star rating.");
            return;
        }

        setLoading(true);
        try {
            const { user_id, token, token_expiration } = await validateToken();

            const response = await axios.post('https://imorapidtransfer.com/api/v1/rate-transaction', {
                method: 'POST',
                headers: {
                    token,
                    token_expiration,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id }),
                transaction_id: transactionId,
                rating,
                message,
            });

            if (response.data.status === 'success') {
                Alert.alert("Thank You!", "Your feedback has been submitted.");
                navigation.replace('HomeScreen');  
            } else {
                Alert.alert("Error", response.data.message);
            }
        } catch (error) {
            console.error("Error submitting rating:", error);
            Alert.alert("Error", "Failed to submit rating. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        
        navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

        return () => {
             
            navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
        };
    }, [navigation]);

    useEffect(() => {
        navigation.setOptions({
            title: 'Rate Us',
            headerStyle: {
                paddingTop: 20,   
                backgroundColor: '#006400',
            },
            headerTintColor: 'white',  
            headerTitleStyle: {
                fontSize: 18,
                fontWeight: 'bold',
            },
        });
    }, [navigation]);

    return (
        <View style={{ flex: 1, padding: 50 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Your feedback matters to us </Text>

            {/* Star Rating */}
            <View style={{ flexDirection: 'row', marginBottom: 20, padding: 50, justifyContent: 'center' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setRating(star)}>
                        <FontAwesome
                            name={star <= rating ? "star" : "star-o"}
                            size={40}
                            color={star <= rating ? "#FFD700" : "#ccc"}
                            style={{ marginRight: 5 }}
                        />
                    </TouchableOpacity>
                ))}
            </View>

            {/* Message Input */}
            <TextInput
                style={{
                    height: 100,
                    borderWidth: 1,
                    borderColor: '#ccc',
                    borderRadius: 5,
                    padding: 10,
                    textAlignVertical: 'top',
                    marginBottom: 20
                }}
                placeholder="Leave a message (optional)"
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={200}   
            />

             
            <TouchableOpacity
                onPress={submitRating}
                style={{
                    backgroundColor: '#006400',
                    paddingVertical: 12,
                    borderRadius: 25,
                    alignSelf: 'center',
                    marginTop: 16,
                    width: '50%',
                    justifyContent: 'center',  
                    alignItems: 'center',   
                }}
                disabled={loading}
            >
                <Text style={{ color: 'white', fontSize: 16, textAlign: 'center' }}>
                    {loading ? "Submitting..." : "Submit Rating"}
                </Text>
            </TouchableOpacity>

        </View>
    );
};

export default RateUsScreen;
