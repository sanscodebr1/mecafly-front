// 1. Atualizar ProductCreationContext.tsx para armazenar o brand.id

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ProductCreationData {
  selectedCategory?: { id: number; name: string };
  productDetails?: {
    titulo: string;
    descricao: string;
    marca: string;
    marcaId: number; // Adicionar campo para armazenar o ID da marca
    stock: number;
  };
  uploadedImages?: { id: string; uri: string }[];
  price?: string;
}

interface ProductCreationContextType {
  productData: ProductCreationData;
  setSelectedCategory: (category: { id: number; name: string }) => void;
  setProductDetails: (details: { 
    titulo: string; 
    descricao: string; 
    marca: string;
    marcaId: number; // Incluir marcaId
    stock: number;
  }) => void;
  setUploadedImages: (images: { id: string; uri: string }[]) => void;
  setPrice: (price: string) => void;
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
        clearProductData,
      }}
    >
      {children}
    </ProductCreationContext.Provider>
  );
};

export const useProductCreation = () => {
  const context = useContext(ProductCreationContext);
  if (context === undefined) {
    throw new Error('useProductCreation must be used within a ProductCreationProvider');
  }
  return context;
};