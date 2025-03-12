import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationActions } from '@react-navigation/native';

const validateToken = async (navigation) => {
    try {
        const userData = await AsyncStorage.getItem('userData');
        if (!userData) {
            console.error("User data not found in storage");
            throw new Error("User data not found");
        }
        const parsedData = JSON.parse(userData);
        const { token, user_id, token_expiration } = parsedData;

        if (!token) {
            console.error("Token is missing in userData:", parsedData);
            throw new Error("Token is missing");
        }

        const currentTime = new Date().getTime();
        const tokenExpirationTime = new Date(token_expiration).getTime();
        if (currentTime >= tokenExpirationTime) {
            console.error("Token expired. Removing from storage.");
            await AsyncStorage.removeItem('userData');
            navigation.navigate('Auth');
            throw new Error("Token expired");
        }

        console.log("Token is valid:", token);
        return { token, user_id, token_expiration };  
    } catch (error) {
        console.error("Error validating token:", error.message);
        throw error;
    }
};


export default validateToken;
