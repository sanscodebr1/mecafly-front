import { Dimensions, Platform } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive utility functions that work on both mobile and web
export const wp = (percentage: number | string) => {
  const numPercentage = typeof percentage === 'string' ? parseFloat(percentage.replace('%', '')) : percentage;
  if (isWeb) {
    // On web, use smaller values for better desktop experience
    return (screenWidth * numPercentage * 0.3) / 100;
  }
  return (screenWidth * numPercentage) / 100;
};

export const hp = (percentage: number | string) => {
  const numPercentage = typeof percentage === 'string' ? parseFloat(percentage.replace('%', '')) : percentage;
  if (isWeb) {
    // On web, use smaller values for better desktop experience
    return (screenHeight * numPercentage * 0.6) / 100;
  }
  return (screenHeight * numPercentage) / 100;
};

// Platform-specific adjustments for web
export const isWeb = Platform.OS === 'web';

// Web-specific responsive utilities
export const webWp = (percentage: number | string) => {
  if (!isWeb) return wp(percentage);
  const numPercentage = typeof percentage === 'string' ? parseFloat(percentage.replace('%', '')) : percentage;
  // For web, use a more conservative width calculation with smaller scaling
  return Math.min((screenWidth * numPercentage * 0.5) / 100, 800); // Smaller max width for web
};

export const webHp = (percentage: number | string) => {
  if (!isWeb) return hp(percentage);
  const numPercentage = typeof percentage === 'string' ? parseFloat(percentage.replace('%', '')) : percentage;
  // For web, use a more conservative height calculation with smaller scaling
  return Math.min((screenHeight * numPercentage * 0.5) / 100, 600); // Smaller max height for web
};

// Responsive font sizes
export const responsiveFontSize = (size: number) => {
  if (isWeb) {
    // On web, use smaller font sizes for better desktop experience
    return size * 0.4;
  }
  return size;
};

// Responsive spacing
export const responsiveSpacing = (spacing: number) => {
  if (isWeb) {
    // On web, use smaller spacing for better desktop experience
    return spacing * 0.3;
  }
  return spacing;
};

// Web-specific layout helpers
export const getWebStyles = () => {
  if (!isWeb) return {};
  
  return {
    maxWidth: 1400, // Smaller max width
    marginHorizontal: 'auto' as any,
    paddingHorizontal: 20, // Smaller padding
  };
}; 