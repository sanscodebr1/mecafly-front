import React from "react";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { enableScreens } from 'react-native-screens';

// Telas
import { HomeScreen } from "../screens/app/Home";
import { DronesScreen } from "../screens/app/Drones";
import { ProductDetailScreen } from "../screens/app/ProductDetail";
import { CartScreen } from "../screens/app/Cart";
import { CheckoutScreen } from "../screens/app/Checkout";
import { PersonalInfoScreen } from "../screens/app/PersonalInfo";
import { DeliveryAddressScreen } from "../screens/app/DeliveryAddress";
import { PaymentMethodScreen } from "../screens/app/PaymentMethod";
import { ProfissionaisScreen } from "../screens/app/Professional/Professionals";
import { MyProfilesScreen } from "../screens/app/MyProfiles";
import { MyAddressesScreen } from "../screens/app/MyAddresses";
import { NewAddressScreen } from "../screens/app/NewAddress";
import { ChangePasswordScreen } from "../screens/app/ChangePassword";
import { SellerAreaScreen } from "../screens/app/SellerArea";
import { MyProductsScreen } from "../screens/app/MyProducts";
import { AddProductScreen } from "../screens/app/AddProduct";
import { AddProductDetailsScreen } from "../screens/app/AddProductDetails";
import { AddProductImagesScreen } from "../screens/app/AddProductImages";
import { AddProductPriceScreen } from "../screens/app/AddProductPrice";
import { AddProductSummaryScreen } from "../screens/app/AddProductSummary";
import { AdPendingScreen } from "../screens/app/AdPending";
import { MySalesScreen } from "../screens/app/MySales";
import { SaleDetailScreen } from "../screens/app/SaleDetail";
import { ProfileScreen } from "../screens/app/Profile";
import { QuestionsScreen } from "../screens/app/Questions";
import { QuestionsAnswerScreen } from "../screens/app/QuestionAnswer";
import { ProfessionalDetailScreen } from "../screens/app/Professional/ProfessionalDetail";
import { ProfessionalScheduleScreen } from "../screens/app/Professional/Schedule";
import { ProfessionalSummaryScreen } from "../screens/app/Professional/Summary";
import { AddressScreen } from "../screens/app/Professional/Address";
import { PixPaymentScreen } from "../screens/app/PixPayment";
import { MyContractsScreen } from "../screens/app/MyContracts";
import { ProfessionalRegistrationScreen } from "../screens/app/Professional/ProfessionalRegistration";
import { ProfessionalProfileScreen } from "../screens/app/Professional/ProfessionalProfile";
import { RegistrationAnalysisScreen } from "../screens/app/Professional/RegistrationAnalysis";
import { ProfessionalAreaScreen } from "../screens/app/Professional/ProfessionalArea";
import { MyAppointmentsScreen } from "../screens/app/Professional/MyAppointments";
import { HistoryScreen } from "../screens/app/Professional/History";
import { SellerRegisterScreen } from "../screens/app/SellerRegister";
import { SellerRegisterCPFScreen } from "../screens/app/SellerRegisterCPF";
import { SellerRegisterCNPJScreen } from "../screens/app/SellerRegisterCNPJ";
import { SellerRegisterStoreScreen } from "../screens/app/SellerRegisterStore";
import { DeliveryMethodScreen } from "../screens/app/DeliveryMethod";
import { PaymentMethodProfessionalScreen } from "../screens/app/Professional/PaymentMethodProfessional";
import { MyProductsFilledScreen } from "../screens/app/MyProductsFilled";
import { EditProductScreen } from "../screens/app/editProduct";
import { EditAddressScreen } from "../screens/app/EditAddress";
import { DeactivateProductSuccessScreen } from "../screens/app/ProductDeactivateSuccess";
import { MyOrdersScreen } from "../screens/app/MyOrders";
import { OrderDetailScreen } from "../screens/app/OrderDetails";
import { DocumentsScreen } from "../screens/app/Documents";
import { LoginScreen } from "../screens/app/Login";
import ProfessionalDocuments from "../screens/app/Professional/ProfessionalDocuments";
import ProductQuestionsList from "../screens/app/ProductQuestions";
import { SellerQuestionsListScreen } from "../screens/app/SellerQuestionsListScreen";
import { AddProductShippingScreen } from "../screens/app/AddProductShipping";
import { PaymentGatewayRegistrationScreen } from "../screens/app/PaymentGatewayRegistration";
import { UserAddress } from '../services/userAddress';
import { MyPurchasesScreen } from "../screens/app/MyPurchases";
import { PurchaseDetailScreen } from "../screens/app/PurchaseDetails";

// Enable native screens
enableScreens();

export type RootStackParamList = {
  Home: undefined;
  Drones: undefined;
  ProductDetail: undefined;
  Cart: undefined;
  Checkout: undefined;
  PersonalInfo: undefined;
  DeliveryAddress: undefined;
  DeliveryMethod: { selectedAddress: UserAddress };
  PaymentMethod: undefined;
  PaymentMethodProfessional: undefined;
  Profissionais: undefined;
  MyProfiles: undefined;
  MyAddresses: undefined;
  NewAddress: undefined;
  ChangePassword: undefined;
  SellerArea: undefined;
  MyProducts: undefined;
  AddProduct: undefined;
  AddProductDetails: undefined;
  AddProductImages: undefined;
  AddProductPrice: undefined;
  AddProductSummary: undefined;
  AdPending: undefined;
  MySales: undefined;
  SaleDetails: undefined;
  Profile: undefined;
  Questions: undefined;
  QuestionAnswer: undefined;
  ProfessionalDetail: undefined;
  ProfessionalSchedule: undefined;
  ProfessionalSummary: undefined;
  Address: undefined;
  PixPayment: undefined;
  MyContracts: undefined;
  ProfessionalRegistration: undefined;
  ProfessionalProfile: undefined;
  RegistrationAnalysis: undefined;
  ProfessionalArea: undefined;
  MyAppointments: undefined;
  History: undefined;
  SellerRegister: undefined;
  SellerRegisterCPF: undefined;
  SellerRegisterCNPJ: undefined;
  SellerRegisterStore: undefined;
  MyProductsFilled: undefined;
  EditProduct: undefined;
  EditAddressScreen: undefined;
  EditAddress: undefined; // alias
  DeactivateProductSuccess: undefined;
  MyOrders: undefined;
  OrderDetails: undefined;
  Documents: undefined;
  Login: undefined;
  AddProductShippingScreen: undefined;
  AddProductShipping: undefined; // alias
  PaymentGatewayRegistration: undefined;
  ProfessionalDocuments: undefined;
  ProductQuestions: undefined;
  SellerQuestionsListScreen: undefined;
  MyPurchasesScreen: undefined;
  PurchaseDetailScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function Routes() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName='Home'
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#fff' }
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen}/>
        <Stack.Screen name="Drones" component={DronesScreen}/>
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen}/>
        <Stack.Screen name="Cart" component={CartScreen}/>
        <Stack.Screen name="Checkout" component={CheckoutScreen}/>
        <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen}/>
        <Stack.Screen name="DeliveryAddress" component={DeliveryAddressScreen}/>
        <Stack.Screen name="PaymentMethod" component={PaymentMethodScreen}/>
        <Stack.Screen name="PaymentMethodProfessional" component={PaymentMethodProfessionalScreen}/>
        <Stack.Screen name="Profissionais" component={ProfissionaisScreen}/>
        <Stack.Screen name="MyProfiles" component={MyProfilesScreen}/>
        <Stack.Screen name="MyAddresses" component={MyAddressesScreen}/>
        <Stack.Screen name="NewAddress" component={NewAddressScreen}/>
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen}/>
        <Stack.Screen name="SellerArea" component={SellerAreaScreen}/>
        <Stack.Screen name="MyProducts" component={MyProductsScreen}/>
        <Stack.Screen name="MyProductsFilled" component={MyProductsFilledScreen}/>
        <Stack.Screen name="AddProduct" component={AddProductScreen}/>
        <Stack.Screen name="AddProductDetails" component={AddProductDetailsScreen}/>
        <Stack.Screen name="AddProductImages" component={AddProductImagesScreen}/>
        <Stack.Screen name="AddProductPrice" component={AddProductPriceScreen}/>
        <Stack.Screen name="AddProductSummary" component={AddProductSummaryScreen}/>
        <Stack.Screen name="AdPending" component={AdPendingScreen}/>
        <Stack.Screen name="MySales" component={MySalesScreen}/>
        <Stack.Screen name="SaleDetails" component={SaleDetailScreen}/>
        <Stack.Screen name="Profile" component={ProfileScreen}/>
        <Stack.Screen name="Questions" component={QuestionsScreen}/>
        <Stack.Screen name="QuestionAnswer" component={QuestionsAnswerScreen}/>
        <Stack.Screen name="ProfessionalDetail" component={ProfessionalDetailScreen}/>
        <Stack.Screen name="ProfessionalSchedule" component={ProfessionalScheduleScreen}/>
        <Stack.Screen name="ProfessionalSummary" component={ProfessionalSummaryScreen}/>
        <Stack.Screen name="Address" component={AddressScreen}/>
        <Stack.Screen name="PixPayment" component={PixPaymentScreen}/>
        <Stack.Screen name="MyContracts" component={MyContractsScreen}/>
        <Stack.Screen name="ProfessionalRegistration" component={ProfessionalRegistrationScreen}/>
        <Stack.Screen name="ProfessionalProfile" component={ProfessionalProfileScreen}/>
        <Stack.Screen name="RegistrationAnalysis" component={RegistrationAnalysisScreen}/>
        <Stack.Screen name="ProfessionalArea" component={ProfessionalAreaScreen}/>
        <Stack.Screen name="MyAppointments" component={MyAppointmentsScreen}/>
        <Stack.Screen name="History" component={HistoryScreen}/>
        <Stack.Screen name="SellerRegister" component={SellerRegisterScreen}/>
        <Stack.Screen name="SellerRegisterCPF" component={SellerRegisterCPFScreen}/>
        <Stack.Screen name="SellerRegisterCNPJ" component={SellerRegisterCNPJScreen}/>
        <Stack.Screen name="SellerRegisterStore" component={SellerRegisterStoreScreen}/>
        <Stack.Screen name="DeliveryMethod" component={DeliveryMethodScreen}/>
        <Stack.Screen name="EditProduct" component={EditProductScreen}/>
        <Stack.Screen name="EditAddressScreen" component={EditAddressScreen}/>
        <Stack.Screen name="EditAddress" component={EditAddressScreen}/> 
        <Stack.Screen name="DeactivateProductSuccess" component={DeactivateProductSuccessScreen} options={{ title: 'Desativar Produto' }}/>
        <Stack.Screen name="MyOrders" component={MyOrdersScreen}/>
        <Stack.Screen name="OrderDetails" component={OrderDetailScreen}/>
        <Stack.Screen name="Documents" component={DocumentsScreen}/>
        <Stack.Screen name="Login" component={LoginScreen}/>
        <Stack.Screen name="ProductQuestions" component={ProductQuestionsList}/>
        <Stack.Screen name="ProfessionalDocuments" component={ProfessionalDocuments}/>
        <Stack.Screen name="SellerQuestionsListScreen" component={SellerQuestionsListScreen}/>
        <Stack.Screen name="AddProductShippingScreen" component={AddProductShippingScreen}/>
        <Stack.Screen name="AddProductShipping" component={AddProductShippingScreen}/>
        <Stack.Screen name="PaymentGatewayRegistration" component={PaymentGatewayRegistrationScreen}/>
        <Stack.Screen name="MyPurchases" component={MyPurchasesScreen}/>
        <Stack.Screen name="PurchaseDetails" component={PurchaseDetailScreen}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
