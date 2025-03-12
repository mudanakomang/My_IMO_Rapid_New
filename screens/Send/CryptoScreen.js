import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../constants/colors';

const CryptoScreen = props => {
    return (
        <LinearGradient colors={['#F4F4F4', '#F4F4F4']} style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Crypto Screen</Text>
                <Text style={styles.description}>This is a temporary placeholder for the crypto functionality.</Text>
                <TouchableOpacity style={styles.button} onPress={() => props.navigation.goBack()}>
                    <Text style={styles.buttonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    description: {
        fontSize: 16,
        marginBottom: 40,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    button: {
        backgroundColor: colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
    }
});

export default CryptoScreen;
