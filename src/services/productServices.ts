// services/productServices.ts
import { supabase } from '../lib/supabaseClient';
import { uploadFileToSupabase } from './fileUpload';
import { uploadUserProfileImage } from './storage';

export interface ProductData {
  name: string;
  description: string;
  price: number;
  category: number;
  brand?: number;
  images: string[];
  stock: number;
  storeId: number;
  height?: number;
  width?: number;
  length?: number;
  weight?: number;
  declaredValue?: number;
  pickupAvailable?: boolean; // Nova propriedade
}

export interface ProductCategory {
  id: number;
  name: string;
  created_at: string;
}

export interface ProductBrand {
  id: number;
  name: string;
  created_at: string;
}

export interface ProductImage {
  id: string;
  url: string;
  type: string;
}

export interface ProductDetail {
  product_id: string;
  product_created_at: string;
  product_name: string;
  product_description: string;
  price: number;
  stock: number;
  category: string;
  store_id: string;
  status: 'pending' | 'active' | 'inactive' | 'rejected';
  reason?: string;
  reviwedIn?: string;
  category_name: string;
  store_name: string;
  store_phone: string;
  store_picture: string;
  company_name: string;
  brand_id?: string;
  brand_name?: string;
  product_images: ProductImage[];
  total_images: number;
  main_image_url: string;
  // Campos de frete
  height?: number;
  width?: number;
  length?: number;
  weight?: number;
  declared_value?: number;
  allow_pickup?: boolean; // Nova propriedade
}

export interface Product {
  id: string;
  name: string;
  price: string;
  installment: string;
  pic: string;
  description?: string;
  brand?: string;
  stock?: number;
  pickupAvailable?: boolean; // Nova propriedade
}

// Função para formatar preço
const formatPrice = (price: number) => {
  return `R$ ${(price / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
};

const formatInstallment = (price: number) => {
  const installmentValue = (price / 100) / 12;
  return `ou 12x de R$ ${installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} com juros`;
};

// FUNÇÕES ATUALIZADAS PARA PRODUTOS ATIVOS/APROVADOS

// Busca apenas produtos com status 'approved' (equivalente a active)
export const getApprovedProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('vw_product_detail')
      .select('*')
      .eq('status', 'active')
      .gt('stock', 0) // Garantir que tem estoque
      .order('product_created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar produtos aprovados:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('Nenhum produto aprovado encontrado');
      return [];
    }

    return data.map(product => ({
      id: product.product_id,
      name: product.product_name,
      price: formatPrice(product.price),
      installment: formatInstallment(product.price),
      pic: product.main_image_url || 'https://via.placeholder.com/300x300?text=Sem+Imagem',
      description: product.product_description,
      brand: product.brand_name,
      stock: product.stock,
      allow_pickup: product.allow_pickup || false
    }));
  } catch (error) {
    console.error('Erro na busca de produtos:', error);
    return [];
  }
};

// Busca produtos aprovados por categoria
export const getApprovedProductsByCategory = async (categoryId: string): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('vw_product_detail')
      .select('*')
      .eq('status', 'active')
      .eq('category', categoryId)
      .gt('stock', 0)
      .order('product_created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar produtos por categoria:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log(`Nenhum produto aprovado encontrado para categoria ${categoryId}`);
      return [];
    }

    return data.map(product => ({
      id: product.product_id,
      name: product.product_name,
      price: formatPrice(product.price),
      installment: formatInstallment(product.price),
      pic: product.main_image_url || 'https://via.placeholder.com/300x300?text=Sem+Imagem',
      description: product.product_description,
      brand: product.brand_name,
      stock: product.stock,
      allow_pickup: product.allow_pickup || false
    }));
  } catch (error) {
    console.error('Erro na busca de produtos por categoria:', error);
    return [];
  }
};

// Busca detalhes completos de um produto específico (apenas se aprovado)
export const getProductDetail = async (productId: string): Promise<ProductDetail | null> => {
  try {
    const { data, error } = await supabase
      .from('vw_product_detail')
      .select('*')
      .eq('product_id', productId)
      .eq('status', 'active')
      .gt('stock', 0)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`Produto ${productId} não encontrado ou não está aprovado`);
        return null;
      }
      console.error('Erro ao buscar detalhes do produto:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro na busca de detalhes do produto:', error);
    return null;
  }
};

// Busca produtos em destaque (apenas aprovados)
export const getFeaturedProducts = async (limit: number = 10): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('vw_product_detail')
      .select('*')
      .eq('status', 'active')
      .gt('stock', 0)
      .order('product_created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar produtos em destaque:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('Nenhum produto em destaque encontrado');
      return [];
    }

    return data.map(product => ({
      id: product.product_id,
      name: product.product_name,
      price: formatPrice(product.price),
      installment: formatInstallment(product.price),
      pic: product.main_image_url || 'https://via.placeholder.com/300x300?text=Sem+Imagem',
      description: product.product_description,
      brand: product.brand_name,
      stock: product.stock,
      allow_pickup: product.allow_pickup || false
    }));
  } catch (error) {
    console.error('Erro na busca de produtos em destaque:', error);
    return [];
  }
};

// Busca produtos aprovados com filtro de texto
export const searchApprovedProducts = async (searchTerm: string): Promise<Product[]> => {
  try {
    if (!searchTerm.trim()) {
      return getApprovedProducts();
    }

    const { data, error } = await supabase
      .from('vw_product_detail')
      .select('*')
      .eq('status', 'active')
      .gt('stock', 0)
      .or(`product_name.ilike.%${searchTerm}%,product_description.ilike.%${searchTerm}%,brand_name.ilike.%${searchTerm}%`)
      .order('product_created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar produtos:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log(`Nenhum produto encontrado para o termo: ${searchTerm}`);
      return [];
    }

    return data.map(product => ({
      id: product.product_id,
      name: product.product_name,
      price: formatPrice(product.price),
      installment: formatInstallment(product.price),
      pic: product.main_image_url || 'https://via.placeholder.com/300x300?text=Sem+Imagem',
      description: product.product_description,
      brand: product.brand_name,
      stock: product.stock,
      allow_pickup: product.allow_pickup || false
    }));
  } catch (error) {
    console.error('Erro na busca de produtos:', error);
    return [];
  }
};

// Nova função para buscar produtos por múltiplas categorias (útil para filtros)
export const getProductsByCategories = async (categoryIds: string[]): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('vw_product_detail')
      .select('*')
      .eq('status', 'active')
      .gt('stock', 0)
      .in('category', categoryIds)
      .order('product_created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar produtos por categorias:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log(`Nenhum produto encontrado para as categorias: ${categoryIds.join(', ')}`);
      return [];
    }

    return data.map(product => ({
      id: product.product_id,
      name: product.product_name,
      price: formatPrice(product.price),
      installment: formatInstallment(product.price),
      pic: product.main_image_url || 'https://via.placeholder.com/300x300?text=Sem+Imagem',
      description: product.product_description,
      brand: product.brand_name,
      stock: product.stock,
      allow_pickup: product.allow_pickup || false
    }));
  } catch (error) {
    console.error('Erro na busca de produtos por categorias:', error);
    return [];
  }
};

// Função para verificar se um produto está ativo/disponível
export const isProductAvailable = async (productId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('vw_product_detail')
      .select('status, stock')
      .eq('product_id', productId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.status === 'approved' && data.stock > 0;
  } catch (error) {
    console.error('Erro ao verificar disponibilidade do produto:', error);
    return false;
  }
};

// Função para buscar categorias de produtos com contagem de produtos ativos
export const getCategoriesWithProductCount = async (): Promise<(ProductCategory & { productCount: number })[]> => {
  try {
    // Buscar todas as categorias
    const { data: categories, error: categoriesError } = await supabase
      .from('product_category')
      .select('*')
      .order('name');

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      throw categoriesError;
    }

    // Para cada categoria, contar produtos aprovados
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const { count, error: countError } = await supabase
          .from('vw_product_detail')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved')
          .eq('category', category.id.toString())
          .gt('stock', 0);

        if (countError) {
          console.error(`Erro ao contar produtos da categoria ${category.name}:`, countError);
        }

        return {
          ...category,
          productCount: count || 0
        };
      })
    );

    return categoriesWithCount;
  } catch (error) {
    console.error('Erro ao buscar categorias com contagem:', error);
    return [];
  }
};

// Get all categories
export const getProductCategories = async (): Promise<ProductCategory[]> => {
  const { data, error } = await supabase
    .from('product_category')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }

  return data || [];
};

// Get all brands
export const getProductBrands = async (): Promise<ProductBrand[]> => {
  const { data, error } = await supabase
    .from('product_brand')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching brands:', error);
    throw error;
  }

  return data || [];
};

// Create or get brand by name
export const createOrGetBrand = async (brandName: string): Promise<number> => {
  // First, try to find existing brand
  const { data: existingBrand } = await supabase
    .from('product_brand')
    .select('id')
    .eq('name', brandName)
    .single();

  if (existingBrand) {
    return existingBrand.id;
  }

  // Create new brand if not exists
  const { data: newBrand, error } = await supabase
    .from('product_brand')
    .insert({ name: brandName })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating brand:', error);
    throw error;
  }

  return newBrand.id;
};

// Upload product images
export const uploadProductImages = async (
  userId: string,
  imageUris: string[]
): Promise<string[]> => {
  const uploadPromises = imageUris.map(async (uri, index) => {
    try {
      return await uploadFileToSupabase(
        uri,
        'products',
        `product_images_${userId}/`
      );
    } catch (error) {
      console.error(`Error uploading image ${index}:`, error);
      return null;
    }
  });

  const uploadedUrls = await Promise.all(uploadPromises);
  return uploadedUrls.filter((url): url is string => url !== null);
};

// Create product - Atualizada para incluir allow_pickup
export const createProduct = async (productData: ProductData): Promise<number> => {
  const { data: product, error } = await supabase
    .from('product')
    .insert({
      name: productData.name,
      description: productData.description,
      price: Math.round(productData.price * 100), // Store price in cents
      category: productData.category,
      brand_id: productData.brand,
      store_id: productData.storeId,
      status: 'pending', // Sempre pending para aprovação do admin
      stock: productData.stock,
      // Campos de frete
      height: productData.height,
      width: productData.width,
      length: productData.length,
      weight: productData.weight,
      declared_value: productData.declaredValue ? Math.round(productData.declaredValue * 100) : null, // Store in cents
      allow_pickup: productData.pickupAvailable || false, // Nova propriedade com default false
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating product:', error);
    throw error;
  }

  return product.id;
};

// Create product images
export const createProductImages = async (
  productId: number,
  imageUrls: string[]
): Promise<void> => {
  if (imageUrls.length === 0) return;

  const imageData = imageUrls.map((url, index) => ({
    product_id: productId,
    url,
    type: index === 0 ? 'main' : 'secondary',
  }));

  const { error } = await supabase
    .from('product_image')
    .insert(imageData);

  if (error) {
    console.error('Error creating product images:', error);
    throw error;
  }
};

// Get current user's store profile
export const getCurrentUserStoreProfile = async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: storeProfile, error } = await supabase
    .from('store_profile')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching store profile:', error);
    throw error;
  }

  return storeProfile;
};

// Complete product creation flow - Atualizada para incluir allow_pickup
export const createCompleteProduct = async (
  name: string,
  description: string,
  brand: number,
  categoryId: number,
  price: number,
  imageUris: string[],
  stock: number,
  shippingConfig?: {
    height: number;
    width: number;
    length: number;
    weight: number;
    declaredValue: number;
    pickupAvailable: boolean; // Nova propriedade
  }
): Promise<number> => {
  try {
    // Get user's store profile
    const storeProfile = await getCurrentUserStoreProfile();
    
    // Get current user for image uploads
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Upload images
    const imageUrls = await uploadProductImages(user.id, imageUris);

    // Create product
    const productData: ProductData = {
      name,
      description,
      price,
      category: categoryId,
      brand: brand,
      images: imageUrls,
      storeId: storeProfile.id,
      stock: stock,
      // Adicionar dados de frete se fornecidos
      ...(shippingConfig && {
        height: shippingConfig.height,
        width: shippingConfig.width,
        length: shippingConfig.length,
        weight: shippingConfig.weight,
        declaredValue: shippingConfig.declaredValue,
        pickupAvailable: shippingConfig.pickupAvailable, // Nova propriedade
      }),
    };

    const productId = await createProduct(productData);

    // Create product images
    await createProductImages(productId, imageUrls);

    return productId;
  } catch (error) {
    console.error('Error in complete product creation:', error);
    throw error;
  }
};

// Context interface for product creation flow - Atualizada com pickupAvailable
export interface ProductCreationContext {
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
    pickupAvailable: boolean; // Nova propriedade
  };
}