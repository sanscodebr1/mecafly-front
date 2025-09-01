import { useAuth } from '../context/AuthContext';
import { UserTypeEnum } from '../services/userProfiles';

export const useUserType = () => {
  const { user } = useAuth();

  // --- USER_PROFILES ---
  const profilesRaw = (user as any)?.profile?.user_profiles;
  const profiles = Array.isArray(profilesRaw) ? profilesRaw : [];

  const hasType = (type: string) =>
    profiles.some(
      (p) => p?.user_type && String(p.user_type).trim().toLowerCase() === type
    );

  const isCustomer = hasType('customer');
  const isProfessional = hasType('professional');

  // --- STORE_PROFILES ---
  const storesRaw = (user as any)?.profile?.store_profiles;
  const stores = Array.isArray(storesRaw) ? storesRaw : [];

  const isSeller = stores.length > 0; // se tiver pelo menos 1 loja → é seller

  const isLoggedIn = !!user;

  const userType = (profiles[0]?.user_type
    ? String(profiles[0].user_type).trim().toLowerCase()
    : undefined) as UserTypeEnum | undefined;

  return {
    isCustomer,
    isSeller,
    isProfessional,
    isLoggedIn,
    userType,
    user,
    stores, // opcional: já retorna as lojas para uso
  };
};
