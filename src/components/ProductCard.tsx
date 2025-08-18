import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { fonts } from '../constants/fonts';
import { isWeb } from '../utils/responsive';
import { fontsizes } from '../constants/fontSizes';

interface Product {
  id: string;
  name: string;
  price: string;
  installment: string;
  pic?: string;
}

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (change: number) => {
    setQuantity(Math.max(1, quantity + change));
  };

  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress}>
      <View style={styles.productImagePlaceholder}>
        <Image source={{uri:product.pic}} style={{width:'100%',height:'100%'}} />

      </View>
      <Text style={styles.productName}>{product.name}</Text>
      <Text style={styles.productPrice}>{product.price}</Text>
      <Text style={styles.productInstallment}>{product.installment}</Text>
      
      <View style={styles.quantityContainer}>
        <TouchableOpacity 
          style={styles.quantityButton}
          onPress={() => handleQuantityChange(-1)}
        >
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>
        
        <Text style={styles.quantityText}>
          {quantity}
        </Text>
        
        <TouchableOpacity 
          style={styles.quantityButton}
          onPress={() => handleQuantityChange(1)}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.buyButton}>
        <Text style={styles.buyButtonText}>Comprar</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  productCard: {
    width: isWeb ? '16%' : '48%',
    backgroundColor: '#fff',
    borderRadius: isWeb ? 8 : 12,
    padding: isWeb ? 8 : 12,
    marginBottom: isWeb ? 10 : 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  productImagePlaceholder: {
    height: isWeb ? 160 : 160,
    backgroundColor: '#D6DBDE',
    borderRadius: isWeb ? 6 : 8,
    marginBottom: isWeb ? 6 : 8,
  },
  productName: {
    fontSize: isWeb ? 12 : fontsizes.size14,
    fontFamily: fonts.regular400,
    color: '#000000',
    marginBottom: isWeb ? 3 : 4,
  },
  productPrice: {
    fontSize: isWeb ? 14 : fontsizes.size16,
    fontFamily: fonts.bold700,
    color: '#000000',
    marginBottom: isWeb ? 1 : 2,
  },
  productInstallment: {
    fontSize: isWeb ? 8 : fontsizes.size10,
    fontFamily: fonts.regular400,
    color: '#666',
    marginBottom: isWeb ? 6 : 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quantityButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  quantityButtonText: {
    fontSize: fontsizes.size10,
    fontFamily: fonts.bold700,
    color: '#000000',
    alignSelf: 'center',
  },
  quantityText: {
    fontSize: 12,
    fontFamily: fonts.medium500,
    color: '#000000',
    marginHorizontal: 8,
  },
  buyButton: {
    backgroundColor: '#22D883',
    borderRadius: 40,
    paddingVertical: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: fonts.regular400,
  },
}); 