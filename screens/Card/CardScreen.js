import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, RefreshControl, Modal, ActivityIndicator, Switch } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import validateToken from '../../components/validateToken';

const CardScreen = () => {
    const navigation = useNavigation();
    const [cards, setCards] = useState([]);
    const [selectedCard, setSelectedCard] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isFrozen, setIsFrozen] = useState(false);

    useEffect(() => {
        navigation.setOptions({ title: 'My Cards' });
        fetchCards();
    }, []);

    useEffect(() => {
        navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

        return () => {
            navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
        };
    }, [navigation]);

    const fetchCards = async () => {
        setLoading(true);
        setRefreshing(true);
        try {
            const isValid = await validateToken();
            if (!isValid) {
                console.error('Invalid token. Please reauthenticate.');
                return;
            }

            const userData = await AsyncStorage.getItem('userData');
            const parsedUserData = JSON.parse(userData);
            const { token, user_id, token_expiration } = parsedUserData;

            const requestBody = JSON.stringify({ user_id });

            const requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    token: token,
                    token_expiration: token_expiration,
                },
                body: requestBody
            };

            const response = await fetch(
                'https://imorapidtransfer.com/api/v1/virtual/card/getCards',
                requestOptions
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server responded with ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            setCards(data.virtualCards || []);
        } catch (error) {
            console.error('Error fetching cards:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleCardPress = (card) => {
        setSelectedCard(card);
        navigation.navigate('PinVerify', {
            onSuccess: () => {
                setIsFrozen(card.status === 'Inactive' ? false : true);
                setShowModal(true);
            },
        });
    };

    const handleToggleChange = async (value) => {
        if (!selectedCard) return;

        setIsFrozen(value);

        try {
            const userData = await AsyncStorage.getItem('userData');
            const parsedUserData = JSON.parse(userData);
            const { token, token_expiration } = parsedUserData;

            const requestBody = JSON.stringify({
                cardId: selectedCard.encryptedCardId,
                isFrozen: value,
                type: 'changeStatus',
            });

            const response = await fetch(
                'https://imorapidtransfer.com/api/v1/vcards/card/create/oncard/withdraw/freeze/fund',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        token,
                        token_expiration,
                    },
                    body: requestBody,
                }
            );

            const data = await response.json();
            if (!data.success) {
                throw new Error('Failed to update card status');
            }
        } catch (error) {
            console.error('Error updating card status:', error);
        }
    };


    const renderCard = (card) => {
        const cardBackgroundColor = card.color || 'blue';

        return (
            <View style={[styles.card, { backgroundColor: cardBackgroundColor }]}>
                <View style={styles.cardTop}>
                    <Image source={{ uri: 'https://imorapidtransfer.com/public/frontend_new/assets/logos/logo-page.png' }} style={styles.logo} />
                </View>
                <Text style={styles.cardNumber}>
                    {String(card.firstfour)} **** **** {String(card.fourthfour)}
                </Text>
                <Text style={styles.cardBalance}>Bal: ${card.balance ? card.balance : '0.00'}</Text> 
                <View style={styles.cardBottom}>
                    <View style={styles.cardDetailsContainer}>
                        <Text style={styles.cardDetailsLeft}>
                            Exp: {card.expiration_month}/{card.expiration_year}
                        </Text>
                        <Text style={styles.cardDetailsRight}>CVV: ***</Text>
                    </View>
                    <View style={styles.cardHolderContainer}>
                        <Text style={styles.cardHolder}>{card.name_on_card || 'Cardholder Name'}</Text>
                        {card.card_brand === 'visa' ? (
                            <Image source={{ uri: 'https://imorapidtransfer.com/public/assets/images/logo/logos.png' }} style={styles.cardBrandLogo} />
                        ) : card.card_brand === 'Mastercard' ? (
                            <Image source={{ uri: 'https://imorapidtransfer.com/public/assets/images/logo/logo.png' }} style={styles.cardBrandLogo} />
                        ) : (
                            <Image source={{ uri: 'https://imorapidtransfer.com/public/frontend_new/assets/logos/logo-page.png' }} style={styles.cardBrandLogo} />
                        )}
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#006400" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchCards} />}
        >
            <TouchableOpacity
                style={styles.newButton}
                onPress={() => navigation.navigate('NewCardScreen')}
            >
                <Text style={styles.newButtonText}>+</Text>
            </TouchableOpacity>
    
            <View style={styles.cardSection}>
                {cards.length > 0 ? (
                 <Swiper
                 cards={cards}
                 renderCard={(card) => (
                     <TouchableOpacity
                         onPress={() => handleCardPress(card)}
                         key={card.encryptedCardId}
                     >
                         {renderCard(card)}
                     </TouchableOpacity>
                 )}
                 stackSize={2}
                 infinite
                 backgroundColor="#f5f5f5"
                 verticalSwipe={false}
                 cardIndex={0}
                 stackSeparation={30}
                 stackScale={10}
                 cardStyle={{ height: 200, width: 300 }}
                 onSwiped={(index) => {
                     const nextCard = cards[index + 1 < cards.length ? index + 1 : 0]; 
                     setSelectedCard(nextCard);   
                 }}
                 onSwipedAll={() => {
                     setSelectedCard(cards[0]); 
                 }}
             />
             
                
                ) : (
                    <Text style={styles.noCardText}>No cards available</Text>
                )}
            </View>
            <View style={styles.buttonSection}>
              
                <TouchableOpacity
  style={styles.staticButton}
  onPress={() => {
    if (selectedCard) {
      console.log('Navigating to FundScreen with:', {
        cardId: selectedCard?.encryptedCardId,
        balance: selectedCard?.balance,
        currency: selectedCard?.currency,
        fourthfour: selectedCard?.fourthfour,
      });
      navigation.navigate('FundScreen', {
        cardId: selectedCard?.encryptedCardId,
        balance: selectedCard?.balance,
        currency: selectedCard?.currency,
        fourthfour: selectedCard?.fourthfour,
      });
    }
  }}
>
  <Text style={styles.buttonText}>Fund</Text>
</TouchableOpacity>


                <TouchableOpacity
                    style={styles.staticButton}
                    onPress={() => {
                        if (selectedCard) {
                            console.log('Navigating to WithdrawScreen with:', {
                                cardId: selectedCard?.encryptedCardId, 
                                balance: selectedCard?.balance,
                                currency: selectedCard?.currency,
                                fourthfour: selectedCard?.fourthfour
                            });
                            navigation.navigate('WithdrawScreen', {
                                cardId: selectedCard?.encryptedCardId, 
                                balance: selectedCard?.balance,
                                currency: selectedCard?.currency,
                                fourthfour: selectedCard?.fourthfour
                            });
                        }
                    }}
                >
                    <Text style={styles.buttonText}>Withdraw</Text>
                </TouchableOpacity>
            </View>
    
            {selectedCard && (
                <Modal
                animationType="slide"
                transparent={true}
                visible={showModal}
                onRequestClose={() => setShowModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Card Details</Text>
                        <Text style={styles.modalText}>
                            Card Number: {selectedCard.firstfour} {selectedCard.secondfour} {selectedCard.thirdfour} {selectedCard.fourthfour}
                        </Text>
                        <View style={styles.separator} />
                        <Text style={styles.modalText}>Card Holder: {selectedCard.name_on_card}</Text>
                        <View style={styles.separator} />
                        <Text style={styles.modalText}>Balance: ${selectedCard.balance}</Text>
                        <View style={styles.separator} />
                        <Text style={styles.modalText}>Exp: {selectedCard.expiration_month}/{selectedCard.expiration_year}</Text>
                        <View style={styles.separator} />
                        <Text style={styles.modalText}>CVV: {selectedCard.cvv}</Text>
                        <View style={styles.separator} />
                        <Text style={styles.modalText}>Brand: {selectedCard.card_brand}</Text>
                        <View style={styles.separator} />
                        <Text style={styles.modalText}>City: {selectedCard.city}</Text>
                        <View style={styles.separator} />
                        <Text style={styles.modalText}>State: {selectedCard.state}</Text>
                        <View style={styles.separator} />
                        <Text style={styles.modalText}>Address: {selectedCard.address_1} {selectedCard.address_2}</Text>  
                        <View style={styles.separator} />
                        <Text style={styles.modalText}>Country: {selectedCard.country}</Text>
                            <View style={styles.separator} />
                            
                            <View style={styles.toggleContainer}>
                                <Text style={styles.modalText}>Freeze/Unfreeze Card</Text>
                                <Switch
                                    value={isFrozen}
                                    onValueChange={handleToggleChange}
                                />
                            </View>
    
                            <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowModal(false)}>
                                <Text style={styles.closeModalButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}
        </ScrollView>
    );
    
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '90%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalText: {
        fontSize: 16,
        marginBottom: 5,
    },
    separator: {
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        marginVertical: 5,
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 10,
    },
    closeModalButton: {
        marginTop: 20,
        padding: 10,
        backgroundColor: 'red',
        borderRadius: 25,
        alignSelf: 'center',
        width: '50%',
    },
    closeModalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    container: {
        flex: 1,
        paddingLeft: 3,
        paddingRight: 35,
        backgroundColor: '#E3E3E3',
    },
    newButton: {
        height: 50,
        alignSelf: 'flex-end',
        marginTop: 10,
        backgroundColor: '#006400',
        paddingHorizontal: 20,   
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    newButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    cardSection: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -50,
    },
    noCardText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'gray',
        textAlign: 'center',
        marginTop: 20,
    },
 
    buttonSection: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 320,
        marginBottom: 10,
    },
    staticButton: {
        backgroundColor: '#006400',
        padding: 15,
        paddingLeft: 20,
        paddingRight: 20,
        borderRadius: 25,
        width: '40%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    emptySpace: {
        height: '45%',
    },
    card: {
        borderRadius: 15,
        padding: 15,
        elevation: 5,
        shadowColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
        height: 220,
        width: '100%',
        marginBottom: 15,
    },
    cardTop: {
        position: 'absolute',
        top: 10,
        left: 10,
        width: 40,
        height: 40,
    },
    logo: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    cardNumber: {
        fontSize: 22,  
        color: '#FFFFFF',
        fontWeight: 'bold',
        textAlign: 'center',
        paddingBottom: 10,   
        width: '290%',   
        alignSelf: 'center', 
    },
    cardBalance: {
        fontSize: 18,
        color: '#FFFFFF',
        fontWeight: 'bold',
        textAlign: 'center',
        paddingBottom: 10,  
    },
    cardBottom: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    cardDetailsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 10,  
    },

    cardDetailsLeft: {
        fontSize: 16,
        color: '#FFFFFF',
        paddingRight: 10,  
    },
    cardDetailsRight: {
        fontSize: 16,
        color: '#FFFFFF',
        textAlign: 'right',
        paddingLeft: 10,   
    },


    cardHolderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 15,  
    },
    cardHolder: {
        fontSize: 18,
        color: '#FFFFFF',
        marginVertical: 5,
        paddingBottom: 5,   
    },
    cardBrandLogo: {
        width: 40,
        height: 40,
        resizeMode: 'contain',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E3E3E3',
    },
});

 
export default CardScreen;
