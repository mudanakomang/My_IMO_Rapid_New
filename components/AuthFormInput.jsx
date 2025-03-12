import React from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

const AuthFormInput = ({
    placeholder = '',
    value = '',
    onChangeText = () => {},
    editable = true,
    secureTextEntry = false,
    rightIcon = null,
    onIconPress = () => {}
}) => {
    return (
        <View style={styles.container}>
            <TextInput 
                style={styles.textInput}
                placeholder={placeholder}
                placeholderTextColor="white" // Set placeholder color to white
                value={value}
                onChangeText={onChangeText}
                editable={editable}
                secureTextEntry={secureTextEntry}  
            />
            {rightIcon && (
                <TouchableOpacity 
                    style={styles.iconContainer}
                    onPress={onIconPress}
                >
                    {rightIcon}
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 13,
        position: 'relative',
    },
    textInput: {
        backgroundColor: '#2C2C37',
        paddingVertical: 14,
        paddingHorizontal: 10,
        borderRadius: 10,
        color: 'white',
        fontSize: 15,
    },
    iconContainer: {
        position: 'absolute',
        right: 10,
        top: '50%',
        transform: [{ translateY: -10 }],
    },
});

export default AuthFormInput;
