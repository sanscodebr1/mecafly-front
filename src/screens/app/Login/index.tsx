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
import { getCurrentUserProfiles, upsertCustomerProfile } from '../../../services/userProfiles';
import { LinearGradient } from 'expo-linear-gradient';
import { MaskedInputField } from '../../../components/MaskedInputField';
import { unmask } from '../../../utils/masks';

export function LoginScreen() {
  const navigation = useNavigation();
  const { signInWithEmail, signUpWithEmail } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const toISODate = (br: string | null) => {
    console.log('=== toISODate DEBUG ===');
    console.log('Input recebido:', br);
    console.log('Tipo do input:', typeof br);
    
    if (!br || br.trim() === '') {
      console.log('Input vazio ou null');
      return null;
    }
    
    const trimmed = br.trim();
    console.log('Após trim:', trimmed);
    
    const parts = trimmed.split('/');
    console.log('Partes após split:', parts);
    
    if (parts.length !== 3) {
      console.log('Número de partes diferente de 3:', parts.length);
      return null;
    }

    const [dd, mm, yyyy] = parts;
    console.log('Partes separadas:', { dd, mm, yyyy });
    
    // Verificar se todas as partes existem e são números
    if (!dd || !mm || !yyyy) {
      console.log('Alguma parte está vazia');
      return null;
    }
    
    const day = parseInt(dd, 10);
    const month = parseInt(mm, 10);
    const year = parseInt(yyyy, 10);
    console.log('Após parseInt:', { day, month, year });
    
    // Verificar se a conversão foi bem-sucedida
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      console.log('Algum valor é NaN');
      return null;
    }

    // Validações básicas
    if (day < 1 || day > 31) {
      console.log('Dia inválido:', day);
      return null;
    }
    if (month < 1 || month > 12) {
      console.log('Mês inválido:', month);
      return null;
    }
    if (year < 1900 || year > new Date().getFullYear()) {
      console.log('Ano inválido:', year);
      return null;
    }

    // Retornar no formato ISO (YYYY-MM-DD)
    const result = `${year}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
    console.log('Resultado final:', result);
    return result;
  };

  const validateRegistrationFields = () => {
    if (!email || !password || !name || !cpf || !dateOfBirth || !phoneNumber) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return false;
    }

    // Validar CPF básico (11 dígitos)
    const cleanCpf = unmask(cpf);
    if (cleanCpf.length !== 11) {
      Alert.alert('Erro', 'CPF deve ter 11 dígitos.');
      return false;
    }

    // Validar telefone básico (10 ou 11 dígitos)
    const cleanPhone = unmask(phoneNumber);
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      Alert.alert('Erro', 'Telefone deve ter 10 ou 11 dígitos.');
      return false;
    }

    // Validar data de nascimento
    const isoDate = toISODate(dateOfBirth);

    return true;
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!isLogin && !validateRegistrationFields()) {
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
          const userProfiles = await getCurrentUserProfiles();
          if (userProfiles) {
            const userName = userProfiles.customer_profile?.name || 'Usuário';
            
            Alert.alert(
              'Login realizado com sucesso!',
              `Bem-vindo de volta, ${userName}!`,
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
          try {
            const customerProfileData = {
              user_id: result.user?.id || '', // Assumindo que o result retorna o user
              name: name.trim(),
              email: email.toLowerCase().trim(),
              document: unmask(cpf),
              dateOfBirth: toISODate(dateOfBirth),
              phone_number: unmask(phoneNumber),
              image_profile: null,
            };

            console.log('Dados do perfil a serem salvos:', customerProfileData);

            // Usar a função do service para criar/atualizar
            await upsertCustomerProfile(customerProfileData);

            Alert.alert(
              'Cadastro realizado com sucesso!',
              'Verifique seu email para confirmar a conta. Seu perfil foi criado!',
              [
                {
                  text: 'OK',
                  onPress: () => setIsLogin(true),
                },
              ]
            );
          } catch (profileError) {
            console.error('Erro ao criar customer profile:', profileError);
            // Mesmo se falhar a criação do perfil, o registro foi bem-sucedido
            Alert.alert(
              'Cadastro realizado!',
              'Conta criada com sucesso. Verifique seu email para confirmação.',
              [
                {
                  text: 'OK',
                  onPress: () => setIsLogin(true),
                },
              ]
            );
          }
        }
      }
    } catch (error) {
      console.error('Erro no submit:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    // Limpar campos quando trocar de modo
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setCpf('');
    setDateOfBirth('');
    setPhoneNumber('');
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
            {/* Campos adicionais apenas no registro */}
            {!isLogin && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Nome completo</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Digite seu nome completo"
                    placeholderTextColor="#999"
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <MaskedInputField
                    mask="cpf"
                    rawValue={cpf}
                    onChangeRaw={setCpf}
                    placeholder="000.000.000-00"
                    containerStyle={styles.maskedInputContainer}
                    labelStyle={styles.inputLabel}
                    label={'CPF'}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <MaskedInputField
                    mask="date"
                    rawValue={dateOfBirth}
                    onChangeRaw={setDateOfBirth}
                    placeholder="DD/MM/AAAA"
                    containerStyle={styles.maskedInputContainer}
                    labelStyle={styles.inputLabel}
                    label='Data de nascimento'
                  />
                </View>

                <View style={styles.inputContainer}>
                  <MaskedInputField
                    mask="phone"
                    rawValue={phoneNumber}
                    onChangeRaw={setPhoneNumber}
                    placeholder="(00) 00000-0000"
                    containerStyle={styles.maskedInputContainer}
                    labelStyle={styles.inputLabel}
                    label='Telefone'
                  />
                </View>
              </>
            )}

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
            <TouchableOpacity onPress={toggleMode}>
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
    paddingTop: hp('3%'),
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
    marginBottom: hp('4%'),
  },
  form: {
    marginBottom: hp('4%'),
  },
  inputContainer: {
    marginBottom: hp('2.5%'),
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
  maskedInputContainer: {
    marginBottom: 0,
  },
  maskedInputOverride: {
    // Força os mesmos estilos dos inputs normais
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