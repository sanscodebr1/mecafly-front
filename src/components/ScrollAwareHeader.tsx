import React from 'react';
import { Animated } from 'react-native';
import { Header } from './Header';

interface ScrollAwareHeaderProps {
  activeTab: 'produtos' | 'profissionais';
  onTabPress: (tab: 'produtos' | 'profissionais') => void;
  scrollY: Animated.Value;
}

export function ScrollAwareHeader({ activeTab, onTabPress, scrollY }: ScrollAwareHeaderProps) {
  return (
    <Header 
      activeTab={activeTab}
      onTabPress={onTabPress}
      scrollY={scrollY}
    />
  );
} 