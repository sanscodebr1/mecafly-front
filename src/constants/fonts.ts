import { Poppins_300Light, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from '@expo-google-fonts/poppins';
import { useFonts } from 'expo-font';

// Exportar as fontes para uso em componentes
export const fonts = {
  light300: 'Poppins_300Light',
  regular400: 'Poppins_400Regular',
  // medium500: 'Poppins_500Medium ',
  medium500: 'Poppins_500Medium',
  semiBold600: 'Poppins_600SemiBold',
  bold700: 'Poppins_700Bold',
  extraBold800: 'Poppins_800ExtraBold'
};

// Hook personalizado para carregar as fontes
export const useAppFonts = () => {
  const [fontsLoaded] = useFonts({
    [fonts.light300]: Poppins_300Light,
    [fonts.regular400]: Poppins_400Regular,
    [fonts.medium500]: Poppins_500Medium,
    [fonts.semiBold600]: Poppins_600SemiBold,
    [fonts.bold700]: Poppins_700Bold,
    [fonts.extraBold800]: Poppins_800ExtraBold
  });

  return fontsLoaded;
};

