import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, Image, TextInput, ScrollView, TouchableOpacity, 
  ActivityIndicator, RefreshControl 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import tokenValidation from "../../components/validateToken";
import Feature1EditPhone from './Feature1EditPhone';
import Feature2EditAddress from './Feature2EditAddress';
import Feature3EditIdentity from './Feature3EditIdentity';
import Feature4EditPin from './Feature4EditPin';

const Userdetails = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('Profile');
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState({});
  const [editableFields, setEditableFields] = useState({
    address1: '',
    address2: '',
    country: '',
    city: '',  
    state: ''   
  });
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false); 

  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

    return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: { backgroundColor: '#006400', height: 60 } });
    };
}, [navigation]);

  useEffect(() => {
    navigation.setOptions({ title: "My Profile" }); 
    fetchDataForTab(selectedTab);
  }, [selectedTab]);

  const fetchDataForTab = async (tab) => {
    setLoading(true);
    try {
      const { user_id, token, token_expiration } = await tokenValidation();

      let url = '';
      switch (tab) {
        case 'Profile':
          url = 'https://imorapidtransfer.com/api/v1/user/details';
          break;
        default:
          return;
      }

      console.log(`Fetching data for ${tab} from URL: ${url}`);

      if (url) {
        const response = await axios.get(url, {
          headers: {
            token: token,
            token_expiration: token_expiration,
          },
          params: { user_id },
        });

        if (tab === 'Profile') {
          setUserDetails(response.data.user);
          setEditableFields({
            address1: response.data.user.address_1 || '',
            address2: response.data.user.address_2 || '',
            country: response.data.user.country || '',
            city: response.data.user.city || '',  
            state: response.data.user.state || ''   
          });
        }
      }
    } catch (error) {
      console.error(`Error fetching data for ${tab}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true); // Set saving to true when the save operation starts
    try {
      const { user_id, token, token_expiration } = await tokenValidation();

      const updatedDetails = {};

      Object.keys(editableFields).forEach((field) => {
        if (editableFields[field]) {
          updatedDetails[field] = editableFields[field];
        }
      });

      if (Object.keys(updatedDetails).length === 0) {
        alert('No changes to save!');
        setSaving(false); // Reset saving state if no changes are made
        return;
      }

      const response = await axios.post(
        'https://imorapidtransfer.com/api/v1/user/update/user/profile', 
        { ...updatedDetails, user_id },
        {
          headers: {
            token: token,
            token_expiration: token_expiration,
          },
        }
      );

      console.log('Save response:', response.data);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile.');
    } finally {
      setSaving(false); // Reset saving state after the save operation is complete
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDataForTab(selectedTab);
    setRefreshing(false);
  };

  const renderProfileTab = () => (
    <View>
      <Image
        source={{
          uri: userDetails.profile_picture || 'https://imorapidtransfer.com/public/user_dashboard/images/avatar.jpg',
        }}
        style={styles.profileImage}
      />
      <Text style={styles.label}>Full Name: {`${userDetails.first_name} ${userDetails.last_name}`}</Text>
      <Text style={styles.label}>Email: {userDetails.email}</Text>
      <Text style={styles.label}>Phone: {userDetails.formattedPhone}</Text>
  
      {/* Editable Fields */}
      <Text style={styles.label}>City</Text>
      <TextInput
        style={styles.input}
        value={editableFields.city}
        onChangeText={(text) => setEditableFields((prev) => ({ ...prev, city: text }))}
        placeholder="City"
      />
  
      <Text style={styles.label}>State</Text>
      <TextInput
        style={styles.input}
        value={editableFields.state}
        onChangeText={(text) => setEditableFields((prev) => ({ ...prev, state: text }))}
        placeholder="State"
      />
  
      <Text style={styles.label}>Address 1</Text>
      <TextInput
        style={styles.input}
        value={editableFields.address1}
        onChangeText={(text) => setEditableFields((prev) => ({ ...prev, address1: text }))}
        placeholder="Address 1"
      />
  
      <Text style={styles.label}>Address 2</Text>
      <TextInput
        style={styles.input}
        value={editableFields.address2}
        onChangeText={(text) => setEditableFields((prev) => ({ ...prev, address2: text }))}
        placeholder="Address 2"
      />
  
      <Text style={styles.label}>Country</Text>
      <TextInput
        style={[styles.input, { backgroundColor: '#f0f0f0' }]}
        value={editableFields.country}
        editable={false} 
        placeholder="Country"
      />
  
      <TouchableOpacity onPress={handleSave} style={styles.submitButton} disabled={saving}>
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Save</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderFeatureTab = () => {
    switch (selectedTab) {
      case 'Edit Phone':
        return <Feature1EditPhone userDetails={userDetails} />;
      case 'Edith Addess':
        return <Feature2EditAddress userDetails={userDetails} />;
      case 'Edith Identity':
        return <Feature3EditIdentity userDetails={userDetails} />;
      case 'Edit Pin':
        return <Feature4EditPin userDetails={userDetails} />;
      default:
        return null;
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
        {['Profile', 'Edit Phone', 'Edith Addess', 'Edith Identity', 'Edit Pin'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setSelectedTab(tab)}
            style={[
              styles.tabButton,
              selectedTab === tab && { backgroundColor: '#C6F801' },
            ]}
          >
            <Text style={styles.tabText}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {loading ? (
        <ActivityIndicator size="large" color="#006400" />
      ) : (
        selectedTab === 'Profile' ? renderProfileTab() : renderFeatureTab()
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 16,
  },
  container: {
    
    padding: 16,
    backgroundColor: '#E3E3E3',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    margin: 4,
    backgroundColor: '#f0f0f0',
  },
  tabText: {
    fontSize: 16,
    color: '#000',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#006400',
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: 'center',
    marginTop: 16,
    width: '50%',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default Userdetails;
