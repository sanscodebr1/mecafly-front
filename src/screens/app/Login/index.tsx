import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, isWeb } from '../../../utils/responsive';
import { fonts } from '../../../constants/fonts';
import { fontsizes } from '../../../constants/fontSizes';
import { Colors } from '../../../constants/colors';
import { useAuth } from '../../../context/AuthContext';
import { getCurrentUserProfile } from '../../../services/userProfiles';
import { LinearGradient } from 'expo-linear-gradient';

export function LoginScreen() {
  const navigation = useNavigation();
  const { signInWithEmail, signUpWithEmail } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      let result;
      if (isLogin) {
        result = await signInWithEmail(email, password);
      } else {
        result = await signUpWithEmail(email, password);
      }

      if (result.error) {
        Alert.alert('Erro', result.error);
      } else {
        if (isLogin) {
          // Verificar o tipo de usuário após login
          console.log('Login bem-sucedido, verificando perfil...');
          const userProfile = await getCurrentUserProfile();
          if (userProfile) {
            Alert.alert(
              'Login realizado com sucesso!',
              `Bem-vindo de volta, ${userProfile.name || 'Usuário'}!`,
              [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]
            );
          } else {
            Alert.alert(
              'Login realizado com sucesso!',
              'Complete seu perfil para continuar.',
              [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]
            );
          }
        } else {
          Alert.alert(
            'Cadastro realizado com sucesso!',
            'Verifique seu email para confirmar a conta.',
            [
              {
                text: 'OK',
                onPress: () => setIsLogin(true),
              },
            ]
          );
        }
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          <Image 
            source={require('../../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>
            {isLogin ? 'Entrar na sua conta' : 'Criar nova conta'}
          </Text>
          
          <Text style={styles.subtitle}>
            {isLogin 
              ? 'Faça login para acessar sua conta' 
              : 'Preencha os dados para criar sua conta'
            }
          </Text>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Digite seu email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Senha</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Digite sua senha"
                placeholderTextColor="#999"
                secureTextEntry
              />
            </View>

            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirmar Senha</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirme sua senha"
                  placeholderTextColor="#999"
                  secureTextEntry
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <LinearGradient
                colors={[Colors.primaryRed, '#d32f2f']}
                style={styles.submitButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.submitButtonText}>
                  {loading 
                    ? 'Carregando...' 
                    : (isLogin ? 'Entrar' : 'Cadastrar')
                  }
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Toggle Login/Register */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
            </Text>
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.toggleButton}>
                {isLogin ? 'Cadastre-se' : 'Faça login'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Additional Options */}
          <View style={styles.additionalOptions}>
            
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
    paddingTop: hp('4%'),
    paddingBottom: hp('2%'),
  },
  backButton: {
    padding: wp('2%'),
    marginRight: wp('3%'),
  },
  backButtonText: {
    fontSize: wp('6%'),
    color: '#000',
    fontFamily: fonts.medium500,
  },
  logo: {
    width: wp('25%'),
    height: wp('18%'),
  },
  content: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingTop: hp('5%'),
  },
  title: {
    fontSize: fontsizes.size24,
    fontFamily: fonts.bold700,
    color: '#000',
    textAlign: 'center',
    marginBottom: hp('1%'),
  },
  subtitle: {
    fontSize: fontsizes.size16,
    fontFamily: fonts.regular400,
    color: '#666',
    textAlign: 'center',
    marginBottom: hp('5%'),
  },
  form: {
    marginBottom: hp('5%'),
  },
  inputContainer: {
    marginBottom: hp('3%'),
  },
  inputLabel: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.medium500,
    color: '#000',
    marginBottom: hp('1%'),
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('2%'),
    fontSize: fontsizes.size16,
    fontFamily: fonts.regular400,
    color: '#000',
    backgroundColor: '#f9f9f9',
  },
  submitButton: {
    marginTop: hp('2%'),
    borderRadius: wp('2%'),
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    paddingVertical: hp('2.5%'),
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: fontsizes.size16,
    fontFamily: fonts.semiBold600,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('5%'),
  },
  toggleText: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.regular400,
    color: '#666',
  },
  toggleButton: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.semiBold600,
    color: Colors.primaryRed,
    marginLeft: wp('1%'),
  },
  additionalOptions: {
    gap: hp('2%'),
  },
  optionButton: {
    borderWidth: 1,
    borderColor: Colors.primaryRed,
    borderRadius: wp('2%'),
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('3%'),
    alignItems: 'center',
  },
  optionButtonText: {
    fontSize: fontsizes.size14,
    fontFamily: fonts.medium500,
    color: Colors.primaryRed,
  },
});
