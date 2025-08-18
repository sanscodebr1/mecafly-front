import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../../../constants/fonts';
import { wp, hp, isWeb, getWebStyles } from '../../../utils/responsive';
import { SimpleHeader } from '../../../components/SimpleHeader';
import { BottomButton } from '../../../components/BottomButton';
import { InputField } from '../../../components/InputField';

export function ProfileScreen() {
  const navigation = useNavigation();
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleContinue = () => {
    // Save profile or go to next step
    navigation.goBack();
  };

  const handlePhotoUpload = () => {
    // Implement image picker logic here
    // setProfilePhoto(uri)
  };

  return (
    <SafeAreaView style={[styles.container, getWebStyles()]}>  
      {/* Header */}
      <View style={styles.header}>
        <SimpleHeader title="Meu Perfil" onBack={handleBackPress} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.contentContainer}>
          {/* Store Name */}
          <InputField
            label="Nome da loja"
            value={storeName}
            onChangeText={setStoreName}
            placeholder=""
            placeholderTextColor="#999"
            multiline={false}
          />

          {/* Description */}
          <InputField
            label="Descrição"
            value={description}
            onChangeText={setDescription}
            placeholder=""
            placeholderTextColor="#999"
            multiline={true}
            numberOfLines={6}
            textAlignVertical="top"
            containerStyle={{ marginTop: hp('3%') }}
            labelStyle={{marginTop: hp('-3%')}}
            inputStyle={[styles.textInput, styles.textArea]}
          />

          {/* Profile Photo */}
          <Text style={styles.photoLabel}>Foto do perfil:</Text>
          <TouchableOpacity style={styles.photoBox} onPress={handlePhotoUpload} activeOpacity={0.8}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.photoImage} />
            ) : (
              <Image
                source={require('../../../assets/icons/cloud.png')}
                style={styles.uploadIcon}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <BottomButton
          title="Prosseguir"
          onPress={handleContinue}
          style={styles.continueButton}
          textStyle={styles.continueButtonText}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('1%'),
    }),
  },
  backButton: {
    padding: wp('2%'),
    ...(isWeb && {
      padding: wp('1%'),
    }),
  },
  backIcon: {
    paddingBottom: hp('1.6%'),
    fontSize: wp('6%'),
    color: '#000000',
    fontWeight: 'bold',
    ...(isWeb && {
      fontSize: wp('4%'),
    }),
  },
  headerTitle: {
    fontSize: wp('5%'),
    fontFamily: fonts.bold700,
    color: '#000000',
    flex: 1,
    ...(isWeb && {
      fontSize: wp('4%'),
    }),
  },
  placeholder: {
    width: wp('6%'),
    ...(isWeb && {
      width: wp('4%'),
    }),
  },
  contentContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('1%'),
    }),
  },
  inputLabel: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#111',
    marginBottom: hp('1%'),
    ...(isWeb && {
      fontSize: wp('3.2%'),
    }),
  },
  textInput: {
    backgroundColor: '#D6DBDE',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.8%'),
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#000000',
    marginBottom: hp('1%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('2%'),
      fontSize: wp('3.2%'),
    }),
  },
  textArea: {
    height: hp('20%'),
    ...(isWeb && {
      height: hp('25%'),
    }),
  },
  photoLabel: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    color: '#111',
    textAlign: 'center',
    marginTop: hp('0%'),
    marginBottom: hp('1%'),
    ...(isWeb && {
      fontSize: wp('3.2%'),
      marginTop: hp('2%'),
    }),
  },
  photoBox: {
    width: wp('40%'),
    height: wp('40%'),
    backgroundColor: '#D6DBDE',
    borderRadius: wp('3%'),
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('2%'),
    ...(isWeb && {
      width: wp('22%'),
      height: wp('22%'),
    }),
  },
  uploadIcon: {
    height: hp('4%'),
    width: hp('4%'),
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: wp('3%'),
  },
  buttonContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    ...(isWeb && {
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('2%'),
    }),
  },
  continueButton: {
    backgroundColor: '#22D883',
    borderRadius: wp('6%'),
    paddingVertical: hp('1%'),
    alignItems: 'center',
    justifyContent: 'center',
    ...(isWeb && {
      paddingVertical: hp('2%'),
    }),
  },
  continueButtonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    fontFamily: fonts.regular400,
    ...(isWeb && {
      fontSize: wp('3.5%'),
    }),
  },
});
