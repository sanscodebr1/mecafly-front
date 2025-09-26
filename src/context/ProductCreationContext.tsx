import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ProductCreationData {
  selectedCategory?: { id: number; name: string };
  productDetails?: {
    titulo: string;
    descricao: string;
    marca: string;
    marcaId: number;
    stock: number;
  };
  uploadedImages?: { id: string; uri: string }[];
  price?: string;
  shippingConfig?: {
    height: string;
    width: string;
    length: string;
    weight: string;
    declaredValue: string;
    pickupAvailable: boolean; 
  };
}

interface ProductCreationContextType {
  productData: ProductCreationData;
  setSelectedCategory: (category: { id: number; name: string }) => void;
  setProductDetails: (details: {
    titulo: string;
    descricao: string;
    marca: string;
    marcaId: number;
    stock: number;
  }) => void;
  setUploadedImages: (images: { id: string; uri: string }[]) => void;
  setPrice: (price: string) => void;
  setShippingConfig: (config: {
    height: string;
    width: string;
    length: string;
    weight: string;
    declaredValue: string;
    pickupAvailable: boolean; // Nova propriedade
  }) => void;
  clearProductData: () => void;
}

const ProductCreationContext = createContext<ProductCreationContextType | undefined>(undefined);

export const ProductCreationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [productData, setProductData] = useState<ProductCreationData>({});

  const setSelectedCategory = (category: { id: number; name: string }) => {
    setProductData(prev => ({ ...prev, selectedCategory: category }));
  };

  const setProductDetails = (details: {
    titulo: string;
    descricao: string;
    marca: string;
    marcaId: number;
    stock: number;
  }) => {
    setProductData(prev => ({ ...prev, productDetails: details }));
  };

  const setUploadedImages = (images: { id: string; uri: string }[]) => {
    setProductData(prev => ({ ...prev, uploadedImages: images }));
  };

  const setPrice = (price: string) => {
    setProductData(prev => ({ ...prev, price }));
  };

  const setShippingConfig = (config: {
    height: string;
    width: string;
    length: string;
    weight: string;
    declaredValue: string;
    pickupAvailable: boolean; // Nova propriedade
  }) => {
    setProductData(prev => ({ ...prev, shippingConfig: config }));
  };

  const clearProductData = () => {
    setProductData({});
  };

  return (
    <ProductCreationContext.Provider
      value={{
        productData,
        setSelectedCategory,
        setProductDetails,
        setUploadedImages,
        setPrice,
        setShippingConfig,
        clearProductData,
      }}
    >
      {children}
    </ProductCreationContext.Provider>
  );
};

export const useProductCreation = (): ProductCreationContextType => {
  const context = useContext(ProductCreationContext);
  if (!context) {
    throw new Error('useProductCreation must be used within a ProductCreationProvider');
  }
  return context;
};