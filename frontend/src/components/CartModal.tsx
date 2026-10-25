import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useSessionStore } from '../store/useSessionStore';
import { guestApi } from '../api/guestApi';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ShoppingBag, ChefHat, X, Minus, Plus, FileText, Sparkles, ArrowRight, Utensils } from 'lucide-react';
import { getPhotoUrl } from '../utils/photoUrl';

export default function CartModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { items, totalAmount, clearCart, updateQuantity, removeFromCart } = useCartStore();
  const sessionId = useSessionStore(state => state.sessionId);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const navigate = useNavigate();

  const handleOrder = async () => {
    if (!sessionId) {
      toast.error("Session not found! Please scan QR code again.");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty!");
      return;
    }
    try {
      setIsOrdering(true);
      await guestApi.placeOrder({
        tableSessionId: sessionId,
        items: items.map(item => ({
          ...item,
          note: orderNotes || undefined
        }))
      });
      setOrderSuccess(true);
      setTimeout(() => {
        clearCart();
        setOrderNotes('');
        setOrderSuccess(false);
        onClose();
        navigate('/tracking');
      }, 2200);
    } catch (error) {
      console.error(error);
      toast.error("Failed to place order. Please try again.");
      setIsOrdering(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto"
          >
            <div className="bg-white rounded-t-3xl shadow-2xl overflow-hidden max-h-[88vh] flex flex-col">

              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* Success Overlay */}
              <AnimatePresence>
                {orderSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center rounded-t-3xl"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      className="w-24 h-24 bg-gradient-to-br from-orange-500 to-amber-400 rounded-full flex items-center justify-center mb-4 shadow-2xl shadow-orange-300"
                    >
                      <ChefHat size={44} className="text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Order Placed! 🎉</h3>
                    <p className="text-gray-500 text-sm font-medium">Kitchen is preparing your food…</p>
                    <div className="mt-4 flex gap-1">
                      {[0.1, 0.2, 0.3].map(d => (
                        <motion.div
                          key={d}
                          animate={{ y: [0, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 0.9, delay: d }}
                          className="w-2 h-2 bg-orange-500 rounded-full"
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Header */}
              <div className="px-5 pb-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
                    <ShoppingBag size={18} className="text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900">Your Cart</h2>
                    <p className="text-[11px] text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''} selected</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors active:scale-90"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-100 mx-5 flex-shrink-0" />

              {/* Items List */}
              <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3 no-scrollbar">
                {items.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-4">
                      <ShoppingBag size={32} className="text-gray-300" />
                    </div>
                    <h3 className="font-bold text-gray-600 mb-1">Nothing here yet</h3>
                    <p className="text-sm text-gray-400">Browse the menu and add your favorite dishes</p>
                  </motion.div>
                ) : (
                  <AnimatePresence initial={false}>
                    {items.map((item) => {
                      const itemPhoto = getPhotoUrl(
                        item.photos?.find((p: any) => p.isPrimary)?.url ||
                        item.photos?.[0]?.url ||
                        (item as any).photoUrl ||
                        (item as any).image
                      );

                      return (
                        <motion.div
                          key={item.cartItemId}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                          className="bg-gray-50 hover:bg-gray-100/70 rounded-2xl p-3 border border-gray-100 transition-colors"
                        >
                          <div className="flex gap-3 items-center">
                            {/* Food Item Image Thumbnail */}
                            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden bg-gray-200 shrink-0 border border-black/5 shadow-inner relative group">
                              {itemPhoto ? (
                                <img
                                  src={itemPhoto}
                                  alt={item.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-orange-50 text-orange-400">
                                  <Utensils size={20} />
                                </div>
                              )}
                            </div>

                            {/* Details & Controls */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                              <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{item.name}</p>
                                  {Object.values(item.selectedModifiers || {}).flat().length > 0 && (
                                    <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1 italic">
                                      {Object.values(item.selectedModifiers || {}).flat().map((o: any) => o.name).join(', ')}
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() => removeFromCart(item.cartItemId)}
                                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-90 shrink-0"
                                  title="Remove item"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>

                              <div className="flex justify-between items-center mt-2.5">
                                <div className="flex items-center gap-1.5 bg-white rounded-xl border border-gray-200 p-0.5 shadow-sm">
                                  <button
                                    onClick={() => updateQuantity(item.cartItemId, -1)}
                                    className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center active:scale-90 transition-all"
                                  >
                                    <Minus size={12} className="text-gray-700" />
                                  </button>
                                  <span className="w-5 text-center text-xs font-bold text-gray-900">{item.quantity}</span>
                                  <button
                                    onClick={() => updateQuantity(item.cartItemId, 1)}
                                    className="w-6 h-6 rounded-lg bg-orange-500 hover:bg-orange-600 flex items-center justify-center active:scale-90 transition-all shadow-sm"
                                  >
                                    <Plus size={12} className="text-white" />
                                  </button>
                                </div>
                                <span className="font-black text-sm sm:text-base text-gray-900">
                                  {(item.totalPrice * item.quantity).toLocaleString('vi-VN')}đ
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>

              {/* Bottom Action Area */}
              {items.length > 0 && (
                <div className="px-5 pt-3 pb-6 border-t border-gray-100 bg-white flex-shrink-0 safe-bottom">
                  {/* Order Notes */}
                  <div className="mb-3">
                    <div className="flex items-center gap-1.5 mb-1.5 text-gray-500">
                      <FileText size={13} />
                      <label className="text-xs font-bold">Special Requests</label>
                    </div>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="No onions, extra spicy, less ice…"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none bg-gray-50 placeholder:text-gray-300"
                      rows={2}
                      maxLength={200}
                    />
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-gray-600">Total</span>
                    <div className="text-right">
                      <span className="text-2xl font-black text-gray-900">{totalAmount().toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>

                  {/* Order Button */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleOrder}
                    disabled={isOrdering}
                    className={`w-full py-4 rounded-2xl font-black text-white text-base transition-all flex items-center justify-center gap-2 shadow-lg ${
                      isOrdering
                        ? 'bg-gray-400 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-orange-600 to-red-500 shadow-orange-300 hover:from-orange-500 hover:to-red-400'
                    }`}
                  >
                    {isOrdering ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Placing Order…
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        Confirm Order
                        <ArrowRight size={18} />
                      </>
                    )}
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}