// Cart state (add / update / remove) with persistent storage
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, MenuItem, ModifierOption } from '../types';

export interface CartAddedEvent {
  cartItemId: string;
  item: MenuItem;
  quantity: number;
  unitPrice: number;
  /** Quantity of this line after the add */
  lineQuantity: number;
}

/** Subscribers notified after every successful add (pop-up notification, live staff activity) */
const cartAddedListeners = new Set<(e: CartAddedEvent) => void>();
export const onCartItemAdded = (fn: (e: CartAddedEvent) => void) => {
  cartAddedListeners.add(fn);
  return () => {
    cartAddedListeners.delete(fn);
  };
};

const MAX_LINE_QUANTITY = 50;

interface CartState {
  items: CartItem[];
  addToCart: (item: MenuItem, quantity: number, modifiers: { [groupId: string]: ModifierOption[] }) => void;
  /** Reverse a previous add (used by the "Undo" action in the pop-up) */
  undoAdd: (cartItemId: string, quantity: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  totalAmount: () => number;
}

const modifierKey = (m: Record<string, ModifierOption[]> | undefined) =>
  Object.values(m || {}).flat().map((o: any) => o.id).sort().join('-');

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (item, quantity, modifiers) => {
        const qty = Math.max(1, Math.min(MAX_LINE_QUANTITY, Math.floor(Number(quantity) || 1)));
        const modifierTotal = Object.values(modifiers || {}).flat().reduce((sum, opt) => sum + (opt.priceDelta || 0), 0);
        const unitPrice = item.price + modifierTotal;
        const key = modifierKey(modifiers);

        const existing = get().items.find((e) => e.id === item.id && modifierKey(e.selectedModifiers) === key);
        let cartItemId: string;
        let lineQuantity: number;

        if (existing) {
          cartItemId = existing.cartItemId;
          lineQuantity = Math.min(MAX_LINE_QUANTITY, existing.quantity + qty);
          // Immutable update so every subscriber re-renders
          set((state) => ({
            items: state.items.map((i) => (i.cartItemId === cartItemId ? { ...i, quantity: lineQuantity } : i)),
          }));
        } else {
          cartItemId = Math.random().toString(36).substring(2, 11);
          lineQuantity = qty;
          const newItem: CartItem = {
            ...item,
            cartItemId,
            quantity: qty,
            selectedModifiers: modifiers,
            totalPrice: unitPrice,
          };
          set((state) => ({ items: [...state.items, newItem] }));
        }

        const event: CartAddedEvent = { cartItemId, item, quantity: qty, unitPrice, lineQuantity };
        cartAddedListeners.forEach((fn) => {
          try {
            fn(event);
          } catch (err) {
            console.error('cart listener failed', err);
          }
        });
      },

      undoAdd: (cartItemId, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.cartItemId === cartItemId ? { ...i, quantity: i.quantity - quantity } : i))
            .filter((i) => i.quantity > 0),
        })),

      removeFromCart: (id) => set((state) => ({
        items: state.items.filter((i) => i.cartItemId !== id),
      })),

      updateQuantity: (id, delta) => set((state) => ({
        items: state.items.map((item) =>
          item.cartItemId === id
            ? { ...item, quantity: Math.max(1, Math.min(MAX_LINE_QUANTITY, item.quantity + delta)) }
            : item
        ),
      })),

      clearCart: () => set({ items: [] }),

      totalAmount: () => get().items.reduce((total, item) => total + item.totalPrice * item.quantity, 0),
    }),
    {
      name: 'restaurant-cart-storage',
    }
  )
);
