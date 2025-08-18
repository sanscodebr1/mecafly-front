import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Routes } from './src/routes';
import { useAppFonts } from './src/constants/fonts';
import { View, Text, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    console.log('ErrorBoundary caught an error:', error);
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.log('Error details:', error);
    console.log('Error info:', errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            Something went wrong!
          </Text>
          <Text style={{ fontSize: 14, textAlign: 'center', marginBottom: 10 }}>
            {this.state.error?.toString()}
          </Text>
          <Text style={{ fontSize: 12, textAlign: 'center' }}>
            Check the console for more details
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  console.log('App starting...');

  try {
    const fontsLoaded = useAppFonts();
    console.log('Fonts loaded:', fontsLoaded);

    if (!fontsLoaded) {
      console.log('Waiting for fonts to load...');
      return null;
    }

    console.log('App rendering successfully');
    return (
      <SafeAreaProvider>
        <ErrorBoundary>
          <StatusBar style="light" />
          <Routes />
        </ErrorBoundary>
      </SafeAreaProvider>
    );
  } catch (error) {
    console.log('App crashed with error:', error);
    Alert.alert('App Error', error.toString());
    return null;
  }
}
