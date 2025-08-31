import { useAuth } from '../context/AuthContext';
import { UserTypeEnum } from '../services/userProfiles';

export const useUserType = () => {
  const { user } = useAuth();

  const isCustomer = user?.profile?.user_type === 'customer';
  const isSeller = user?.profile?.user_type === 'seller';
  const isProfessional = user?.profile?.user_type === 'professional';
  const isLoggedIn = !!user;
  const userType = user?.profile?.user_type as UserTypeEnum | undefined;

  return {
    isCustomer,
    isSeller,
    isProfessional,
    isLoggedIn,
    userType,
    user,
  };
};
