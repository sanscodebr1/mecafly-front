// services/cartServices.ts
import { supabase } from '../lib/supabaseClient';

export interface CartItem {
  id: string;
  name: string;
  brand: string;
  price: string;
  quantity: number;
  subtotal: string;
  image: string;
  stock: number;
  isAvailable: boolean;
  productId: string;
  storeId: string;
  storeName: string;
}

export interface CartSummary {
  items: CartItem[];
  totalItems: number;
  totalValue: number;
  totalValueFormatted: string;
}

// Função para formatar preço
const formatPrice = (price: number) => {
  return `R$ ${(price / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
};

// Buscar todos os itens do carrinho do usuário
export async function getUserCart(): Promise<CartSummary> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      return { items: [], totalItems: 0, totalValue: 0, totalValueFormatted: 'R$ 0,00' };
    }

    const { data, error } = await supabase
      .from('vw_cart_detail')
      .select('*')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar carrinho:', error);
      return { items: [], totalItems: 0, totalValue: 0, totalValueFormatted: 'R$ 0,00' };
    }

    if (!data || data.length === 0) {
      return { items: [], totalItems: 0, totalValue: 0, totalValueFormatted: 'R$ 0,00' };
    }

    // Mapear os dados para a interface CartItem
    const items: CartItem[] = data.map(item => ({
      id: item.cart_id.toString(),
      name: item.product_name,
      brand: item.brand_name || 'Sem marca',
      price: formatPrice(item.price),
      quantity: item.quantity,
      subtotal: formatPrice(item.subtotal),
      image: item.main_image_url || 'https://via.placeholder.com/300x300?text=Sem+Imagem',
      stock: item.stock,
      isAvailable: item.is_available,
      productId: item.product_id.toString(),
      storeId: item.store_id?.toString() || '',
      storeName: item.store_name || item.company_name || 'Loja'
    }));

    // Calcular totais
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = data.reduce((sum, item) => sum + item.subtotal, 0);

    return {
      items,
      totalItems,
      totalValue,
      totalValueFormatted: formatPrice(totalValue)
    };
  } catch (error) {
    console.error('Erro ao buscar carrinho:', error);
    return { items: [], totalItems: 0, totalValue: 0, totalValueFormatted: 'R$ 0,00' };
  }
}

// Adicionar item ao carrinho
export async function addToCart(productId: string, quantity: number = 1): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      return false;
    }

    // Verificar se o produto já está no carrinho
    const { data: existingItem } = await supabase
      .from('cart')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', parseInt(productId))
      .single();

    if (existingItem) {
      // Se já existe, atualizar a quantidade
      const { error } = await supabase
        .from('cart')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id);

      if (error) {
        console.error('Erro ao atualizar quantidade no carrinho:', error);
        return false;
      }
    } else {
      // Se não existe, criar novo item
      const { error } = await supabase
        .from('cart')
        .insert({
          user_id: user.id,
          product_id: parseInt(productId),
          quantity
        });

      if (error) {
        console.error('Erro ao adicionar ao carrinho:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Erro ao adicionar ao carrinho:', error);
    return false;
  }
}

// Atualizar quantidade de um item no carrinho
export async function updateCartItemQuantity(cartItemId: string, quantity: number): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      return false;
    }

    if (quantity <= 0) {
      // Se quantidade for 0 ou menor, remover o item
      return await removeFromCart(cartItemId);
    }

    const { error } = await supabase
      .from('cart')
      .update({ quantity })
      .eq('id', parseInt(cartItemId))
      .eq('user_id', user.id); // Garantir que só pode editar próprios itens

    if (error) {
      console.error('Erro ao atualizar quantidade:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao atualizar quantidade:', error);
    return false;
  }
}

// Remover item do carrinho
export async function removeFromCart(cartItemId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      return false;
    }

    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('id', parseInt(cartItemId))
      .eq('user_id', user.id); // Garantir que só pode deletar próprios itens

    if (error) {
      console.error('Erro ao remover do carrinho:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao remover do carrinho:', error);
    return false;
  }
}

// Limpar todo o carrinho do usuário
export async function clearCart(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      return false;
    }

    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao limpar carrinho:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao limpar carrinho:', error);
    return false;
  }
}

// Verificar se um produto está no carrinho
export async function isProductInCart(productId: string): Promise<{ inCart: boolean; quantity: number }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { inCart: false, quantity: 0 };
    }

    const { data, error } = await supabase
      .from('cart')
      .select('quantity')
      .eq('user_id', user.id)
      .eq('product_id', parseInt(productId))
      .single();

    if (error) {
      return { inCart: false, quantity: 0 };
    }

    return { inCart: true, quantity: data?.quantity || 0 };
  } catch (error) {
    console.error('Erro ao verificar produto no carrinho:', error);
    return { inCart: false, quantity: 0 };
  }
}

// Contar total de itens no carrinho (para badge)
export async function getCartItemCount(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return 0;
    }

    const { data, error } = await supabase
      .from('cart')
      .select('quantity')
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao contar itens do carrinho:', error);
      return 0;
    }

    return data?.reduce((total, item) => total + item.quantity, 0) || 0;
  } catch (error) {
    console.error('Erro ao contar itens do carrinho:', error);
    return 0;
  }
}

// Validar carrinho antes do checkout
export async function validateCart(): Promise<{ valid: boolean; issues: string[] }> {
  try {
    const cart = await getUserCart();
    const issues: string[] = [];

    if (cart.items.length === 0) {
      issues.push('Carrinho está vazio');
      return { valid: false, issues };
    }

    cart.items.forEach(item => {
      if (!item.isAvailable) {
        issues.push(`${item.name} não está mais disponível`);
      }
      if (item.quantity > item.stock) {
        issues.push(`${item.name} - quantidade solicitada (${item.quantity}) maior que estoque (${item.stock})`);
      }
    });

    return { valid: issues.length === 0, issues };
  } catch (error) {
    console.error('Erro ao validar carrinho:', error);
    return { valid: false, issues: ['Erro ao validar carrinho'] };
  }
}

// Função para sincronizar carrinho (útil para quando o app reabre)
export async function syncCart(): Promise<CartSummary> {
  return await getUserCart();
}