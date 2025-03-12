import React, { useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet, Animated, Easing, Modal } from 'react-native';

const ActivityIndicator = ({ visible }) => {
    const [dots, setDots] = useState('');
    const scaleAnim = new Animated.Value(1);  
    
    useEffect(() => {
        navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

        return () => {
            navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
        };
    }, [navigation]);

    useEffect(() => {
        const interval = setInterval(() => {
            setDots((prev) => (prev.length < 3 ? prev + '.' : ''));
        }, 500);

        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.2,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        return () => clearInterval(interval);
    }, []);

    if (!visible) return null;

    return (
        <Modal transparent={true} animationType="fade" visible={visible}>
            <View style={styles.overlay}>
                {/* Updated the path here */}
                <Animated.Image
                    source={require('../../assets/icon.png')} 
                    style={[styles.logo, { transform: [{ scale: scaleAnim }] }]}
                />
                <Text style={styles.processingText}>Processing{dots}</Text>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 20,
    },
    processingText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default ActivityIndicator;
