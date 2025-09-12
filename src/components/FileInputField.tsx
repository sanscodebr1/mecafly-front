import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { wp, hp } from '../utils/responsive';
import { fonts } from '../constants/fonts';

type Props = {
  label: string;
  value: string;
  onChange: (uri: string) => void;
};

export function FileInputField({ label, value, onChange }: Props) {
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permissão negada');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      onChange(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.uploadBox} onPress={handlePickImage}>
        {value ? (
          <Image source={{ uri: value }} style={styles.preview} />
        ) : (
          <Text style={styles.placeholder}>Selecionar arquivo</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: hp('3%') },
  label: {
    fontSize: wp('4%'),
    fontFamily: fonts.bold700,
    marginBottom: hp('1%'),
    color: '#000',
  },
  uploadBox: {
    backgroundColor: '#D6DBDE',
    borderRadius: wp('2%'),
    height: hp('20%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    fontSize: wp('4%'),
    fontFamily: fonts.regular400,
    color: '#555',
  },
  preview: {
    width: '100%',
    height: '100%',
    borderRadius: wp('2%'),
    resizeMode: 'cover',
  },
});
