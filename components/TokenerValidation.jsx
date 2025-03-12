import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationActions } from '@react-navigation/native';

const TokenerValidation = async (navigation) => {
    try {
        const userData = await AsyncStorage.getItem('userData');
        if (!userData) {
            console.error("User data not found in storage");
            throw new Error("User data not found");
        }

        const parsedData = JSON.parse(userData);
        const { user_id, csrf_token, auth_token } = parsedData;

        if (!user_id || !csrf_token || !auth_token) {
            console.error("Missing user_id, csrf_token or auth_token in userData:", parsedData);
            throw new Error("Required tokens are missing");
        }

        console.log("User data is valid:", { user_id, csrf_token, auth_token });

        return { user_id, csrf_token, auth_token };

    } catch (error) {
        console.error("Error validating user data:", error.message);
        throw error;
    }
};

export default TokenerValidation;
