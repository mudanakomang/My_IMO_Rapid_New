import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';

const imageAssets = {
    auth1: require('../../assets/images/auth/auth1.png'),
    auth2: require('../../assets/images/auth/auth2.png'),
    auth3: require('../../assets/images/auth/auth3.png'),
    auth4: require('../../assets/images/auth/auth4.png'),
    auth5: require('../../assets/images/auth/auth5.png'),
    auth6: require('../../assets/images/auth/auth6.png'),
    auth7: require('../../assets/images/auth/auth7.png'),
    auth8: require('../../assets/images/auth/auth8.png'),
    auth9: require('../../assets/images/auth/auth9.png'),
    auth10: require('../../assets/images/auth/auth10.png'),
    auth11: require('../../assets/images/auth/auth11.png'),
    auth12: require('../../assets/images/auth/auth12.png'),
    auth13: require('../../assets/images/auth/auth13.png'),
    auth14: require('../../assets/images/auth/auth14.png'),
    auth15: require('../../assets/images/auth/auth15.png'),
    auth16: require('../../assets/images/auth/auth16.png'),
    auth17: require('../../assets/images/auth/auth17.png'),
    auth18: require('../../assets/images/auth/auth18.png'),
    auth19: require('../../assets/images/auth/auth19.png'),
    no_image: require('../../assets/images/auth/no_image.png'),
};

const PhotoVerificationScreen = () => {
    const cameraRef = useRef(null);
    const [hasPermission, setHasPermission] = useState(null);
    const [expectedPose, setExpectedPose] = useState(null);
    const [capturedPhoto, setCapturedPhoto] = useState(null);
    const [facing, setFacing] = useState('back');  
    const navigation = useNavigation();
    useEffect(() => {
        navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

        return () => {
            navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
        };
    }, [navigation]);
    
      useEffect(() => {
         navigation.setOptions({
           title: 'Verification',
         });
       }, [navigation]);
    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const selectRandomImage = () => {
        const imageKeys = Object.keys(imageAssets);
        const randomKey = imageKeys[Math.floor(Math.random() * imageKeys.length)];
        setExpectedPose(imageAssets[randomKey]);
    };

    const takePhoto = async () => {
        if (!cameraRef.current) return;

        try {
            const photo = await cameraRef.current.takePictureAsync();
            setCapturedPhoto(photo.uri || null);
        } catch (error) {
            Alert.alert('Error', 'Failed to capture photo');
        }
    };

    if (hasPermission === null) {
        return <Text>Requesting camera permission...</Text>;
    }

    if (hasPermission === false) {
        return <Text>No access to camera</Text>;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Photo Verification</Text>

            <View style={styles.mainSnap}>
                <View style={styles.imageSection}>
                    <Text>Expected Pose</Text>
                    {expectedPose && <Image source={expectedPose} style={styles.image} />}
                </View>

                <View style={styles.imageSection}>
                    <Text>Your Pose</Text>
                    {capturedPhoto ? (
                        <Image source={{ uri: capturedPhoto }} style={styles.image} />
                    ) : (
                        <Text>No Photo</Text>
                    )}
                </View>
            </View>

            <View style={styles.camera}>
                <Camera
                    style={{ flex: 1 }}
                    type={facing === 'front' ? Camera.Constants.Type.front : Camera.Constants.Type.back}
                    ref={cameraRef}
                />
            </View>

            <TouchableOpacity onPress={takePhoto} style={styles.captureButton}>
                <Text style={{ color: 'white', fontSize: 16 }}>Pose and Snap</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
    },
    mainSnap: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
    },
    imageSection: {
        flex: 1,
        alignItems: 'center',
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: 5,
        marginTop: 10,
    },
    camera: {
        flex: 1,
        width: '100%',
        height: 300,
    },
    captureButton: {
        backgroundColor: 'blue',
        padding: 15,
        borderRadius: 10,
        marginTop: 10,
    },
});

export default PhotoVerificationScreen;