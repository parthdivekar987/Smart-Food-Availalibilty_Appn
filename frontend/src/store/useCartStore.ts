// Thêm sửa xóa giỏ hàng with persistent storage
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, MenuItem, ModifierOption } from '../types';

interface CartState {
  items: CartItem[];
  addToCart: (item: MenuItem, quantity: number, modifiers: { [groupId: string]: ModifierOption[] }) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  totalAmount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (item, quantity, modifiers) => {
        // Calculate price for dish (Base + Modifiers)
        let modifierTotal = 0;
        Object.values(modifiers).forEach(options => {
          options.forEach(opt => modifierTotal += opt.priceDelta);
        });
        const finalPrice = (item.price + modifierTotal);

        const getModifierKey = (m: any) =>
          Object.values(m).flat().map((o: any) => o.id).sort().join('-');
        const currentModifierKey = getModifierKey(modifiers);

        const existingIndex = get().items.findIndex(existing =>
          existing.id === item.id && getModifierKey(existing.selectedModifiers) === currentModifierKey
        );

        if (existingIndex > -1) {
          set((state) => {
            const newItems = [...state.items];
            newItems[existingIndex].quantity += quantity;
            return { items: newItems };
          });
        } else {
          const newItem: CartItem = {
            ...item,
            cartItemId: Math.random().toString(36).substring(2, 9),
            quantity,
            selectedModifiers: modifiers,
            totalPrice: finalPrice
          };
          set((state) => ({ items: [...state.items, newItem] }));
        }
      },

      removeFromCart: (id) => set((state) => ({
        items: state.items.filter((i) => i.cartItemId !== id)
      })),

      updateQuantity: (id, delta) => set((state) => ({
        items: state.items
          .map((item) =>
            item.cartItemId === id
              ? { ...item, quantity: Math.max(1, item.quantity + delta) }
              : item
          )
      })),

      clearCart: () => set({ items: [] }),

      totalAmount: () => {
        return get().items.reduce((total, item) => total + (item.totalPrice * item.quantity), 0);
      }
    }),
    {
      name: 'restaurant-cart-storage',
    }
  )
);