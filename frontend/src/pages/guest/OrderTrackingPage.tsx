import React, { useEffect, useState } from 'react';
import { useSessionStore } from '../../store/useSessionStore';
import { useSocketStore } from '../../store/useSocketStore';
import { guestApi } from '../../api/guestApi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import MoMoPaymentModal from '../../components/payment/MoMoPaymentModal';
import StripePaymentModal from '../../components/payment/StripePaymentModal';
import {
  ChefHat, CheckCircle2, Clock, Utensils, BadgeCheck, ArrowLeft,
  UtensilsCrossed, CreditCard, Banknote, Bell, Info, RefreshCw, Sparkles, Timer
} from 'lucide-react';
import AndroidBottomNav from '../../components/mobile/AndroidBottomNav';
import { getPhotoUrl } from '../../utils/photoUrl';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  menuItem: { name: string; price: number; photos?: { url: string }[] };
  modifiers: any[];
  status: string;
}

interface Order {
  id: string;
  status: 'RECEIVED' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED';
  totalAmount: number;
  items: OrderItem[];
  billRequested: boolean;
  tableSession?: { table?: { name?: string } };
  estimatedPrepMinutes?: number;
  estimatedReadyAt?: string;
  createdAt?: string;
}

const STATUS_STEPS = [
  {
    key: 'RECEIVED',
    label: 'Order Received',
    subtitle: 'Your order has been sent to the kitchen',
    icon: BadgeCheck,
    color: 'from-blue-500 to-indigo-600',
    glow: 'shadow-blue-300',
    ring: 'ring-blue-200',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
  },
  {
    key: 'PREPARING',
    label: 'Preparing Now',
    subtitle: 'Our chefs are crafting your meal',
    icon: ChefHat,
    color: 'from-orange-500 to-amber-500',
    glow: 'shadow-orange-300',
    ring: 'ring-orange-200',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
  },
  {
    key: 'READY',
    label: 'Ready to Serve',
    subtitle: 'Your food is ready! Waiter is on the way',
    icon: Utensils,
    color: 'from-emerald-500 to-green-600',
    glow: 'shadow-emerald-300',
    ring: 'ring-emerald-200',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
  },
];

const getStatusIndex = (status: string) => {
  if (status === 'RECEIVED') return 0;
  if (status === 'PREPARING') return 1;
  if (['READY', 'SERVED', 'COMPLETED'].includes(status)) return 2;
  return 0;
};

const OrderTrackingPage = () => {
  const { sessionId, activeOrderId, lastOrder, setActiveOrder, updateActiveOrderStatus } = useSessionStore();
  const socket = useSocketStore(state => state.socket);
  const joinRoom = useSocketStore(state => state.joinRoom);
  const [order, setOrder] = useState<Order | null>(lastOrder || null);
  const [loading, setLoading] = useState(!lastOrder);
  const [requestingBill, setRequestingBill] = useState(false);
  const [showMoMoModal, setShowMoMoModal] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrder = async () => {
    try {
      if (sessionId) {
        const res: any = await guestApi.getOrderDetails(sessionId);
        if (res && res.id) {
          setOrder(res);
          setActiveOrder(res);
          return;
        }
      }
      if (activeOrderId) {
        const res: any = await guestApi.getOrderDetails(activeOrderId);
        if (res && res.id) {
          setOrder(res);
          setActiveOrder(res);
          return;
        }
      }
      if (lastOrder) {
        setOrder(lastOrder);
      }
    } catch (err) {
      console.warn("Backend order fetch fallback to cached active order:", err);
      if (lastOrder) {
        setOrder(lastOrder);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrder();
    setTimeout(() => setRefreshing(false), 500);
  };

  useEffect(() => {
    if (socket?.connected && sessionId) {
      joinRoom({ role: 'CUSTOMER', tableSessionId: sessionId });
    }
  }, [socket, sessionId, joinRoom, socket?.connected]);

  useEffect(() => {
    if (!socket) return;
    const onReady = () => {
      toast.success('🍽️ Your order is ready!', { duration: 5000 });
      setOrder(prev => prev ? { ...prev, status: 'READY', estimatedPrepMinutes: 0 } : prev);
      updateActiveOrderStatus('READY', 0);
      fetchOrder();
    };

    const onServed = () => {
      toast.success('✅ Your order has been served!', { duration: 5000 });
      setOrder(prev => prev ? { ...prev, status: 'SERVED', estimatedPrepMinutes: 0 } : prev);
      updateActiveOrderStatus('SERVED', 0);
      fetchOrder();
    };

    const onStatus = (data: any) => {
      const newStatus = data?.status || data;
      setOrder(prev => prev ? { ...prev, status: newStatus } : prev);
      updateActiveOrderStatus(newStatus);
      fetchOrder();
    };

    const onEstimateUpdate = (data: any) => {
      if (data?.estimatedPrepMinutes !== undefined) {
        toast.success(`⏱️ Kitchen updated prep time: ~${data.estimatedPrepMinutes} mins remaining!`, { icon: '⏳' });
        setOrder(prev => prev ? {
          ...prev,
          estimatedPrepMinutes: data.estimatedPrepMinutes,
          estimatedReadyAt: data.estimatedReadyAt
        } : prev);
        updateActiveOrderStatus(order?.status || 'PREPARING', data.estimatedPrepMinutes, data.estimatedReadyAt);
      }
    };

    socket.on('order_ready', onReady);
    socket.on('order_served', onServed);
    socket.on('order_status_change', onStatus);
    socket.on('order_estimate_updated', onEstimateUpdate);

    return () => {
      socket.off('order_ready', onReady);
      socket.off('order_served', onServed);
      socket.off('order_status_change', onStatus);
      socket.off('order_estimate_updated', onEstimateUpdate);
    };
  }, [socket, order?.status]);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 20000);
    return () => clearInterval(interval);
  }, [sessionId, activeOrderId]);

  const handleRequestBill = async () => {
    if (!order) return;
    try {
      setRequestingBill(true);
      await guestApi.requestBill(order.id);
      await fetchOrder();
      toast.success('Bill requested! Waiter will arrive shortly.');
    } catch (err) {
      toast.error('Failed to request bill.');
    } finally {
      setRequestingBill(false);
    }
  };

  // Loading state
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-orange-100 rounded-3xl flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full" />
        </div>
        <p className="text-gray-500 font-medium text-sm animate-pulse">Loading your order…</p>
      </div>
    </div>
  );

  if (!sessionId) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center mb-4">
        <UtensilsCrossed size={32} className="text-orange-500" />
      </div>
      <h2 className="text-xl font-black text-gray-900 mb-2">No Session Found</h2>
      <p className="text-gray-500 text-sm mb-6">Please scan your table QR code to start a session.</p>
      <Link to="/" className="px-6 py-3 bg-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-200">
        Scan QR Code
      </Link>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-4">
        <ChefHat size={32} className="text-gray-400" />
      </div>
      <h2 className="text-xl font-black text-gray-900 mb-2">No Active Order</h2>
      <p className="text-gray-500 text-sm mb-6">Browse the menu and place your first order!</p>
      <Link to="/menu" className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-2xl font-bold shadow-lg shadow-orange-200">
        Browse Menu
      </Link>
      <AndroidBottomNav />
    </div>
  );

  const currentStepIndex = getStatusIndex(order.status);
  const currentStep = STATUS_STEPS[currentStepIndex];
  const CurrentIcon = currentStep.icon;

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-28">
      {/* Header */}
      <div className="bg-white sticky top-0 z-20 px-4 py-3 border-b border-gray-100 shadow-sm flex items-center justify-between">
        <Link to="/menu" className="p-2 -ml-2 text-gray-500 hover:text-gray-800 flex items-center gap-1.5 font-medium text-sm">
          <ArrowLeft size={18} />
          Menu
        </Link>
        <div className="text-center">
          <h1 className="text-base font-black text-gray-900">Order Status</h1>
          {order.tableSession?.table?.name && (
            <p className="text-[11px] text-gray-400">{order.tableSession.table.name}</p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 -mr-2 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Status Hero Card */}
      <div className="p-4">
        <motion.div
          key={order.status}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-gradient-to-br ${currentStep.color} rounded-3xl p-6 text-white shadow-2xl ${currentStep.glow} relative overflow-hidden`}
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/3" />

          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Current Status</p>
              <h2 className="text-2xl font-black leading-tight mb-1">{currentStep.label}</h2>
              <p className="text-white/80 text-sm leading-relaxed">{currentStep.subtitle}</p>
            </div>
            <motion.div
              animate={{ rotate: order.status === 'PREPARING' ? [0, -10, 10, -10, 0] : 0 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center ml-3 flex-shrink-0 border border-white/30"
            >
              <CurrentIcon size={30} className="text-white" />
            </motion.div>
          </div>

          {/* Order ID */}
          <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
            <span className="text-white/60 text-xs font-medium">Order #{order.id.slice(0, 8).toUpperCase()}</span>
            {order.status === 'PREPARING' && (
              <span className="flex items-center gap-1.5 text-white text-xs font-bold">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Live
              </span>
            )}
          </div>
        </motion.div>
      </div>

      {/* Dynamic Estimated Preparation Time Card (Live sync with Redis & Kitchen/Waiter) */}
      <div className="px-4 mb-4">
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/15 to-amber-500/10 border border-orange-500/30 rounded-2xl p-4 shadow-sm backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Clock size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                  Live Kitchen Estimate
                  <Sparkles size={13} className="text-amber-500" />
                </h4>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 border border-emerald-500/30 animate-pulse">
                  Redis Live
                </span>
              </div>
              <p className="text-xs text-orange-800 font-bold mt-0.5">
                {order.status === 'READY' || order.status === 'SERVED' || order.status === 'COMPLETED' ? (
                  <span className="text-emerald-700 font-black">Food is Ready! Waiter is serving your table</span>
                ) : (
                  <span>~{order.estimatedPrepMinutes || 18} mins remaining · Managed in real-time</span>
                )}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-2xl font-black text-orange-600 block leading-tight">
              {order.status === 'READY' || order.status === 'SERVED' || order.status === 'COMPLETED' ? '0m' : `${order.estimatedPrepMinutes || 18}m`}
            </span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Est. Time</span>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4">Order Journey</h3>
          <div className="relative">
            {/* Vertical progress line */}
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-200" />
            <div
              className="absolute left-5 top-5 w-0.5 bg-gradient-to-b from-orange-500 to-emerald-500 transition-all duration-700"
              style={{ height: `${Math.min((currentStepIndex / (STATUS_STEPS.length - 1)) * 100, 100)}%` }}
            />

            <div className="space-y-5">
              {STATUS_STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = currentStepIndex > index;
                const isCurrent = currentStepIndex === index;
                const isPending = currentStepIndex < index;

                return (
                  <div key={step.key} className="flex items-start gap-4 relative">
                    <motion.div
                      animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 z-10 transition-all duration-300 ${
                        isCompleted
                          ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-200'
                          : isCurrent
                          ? `bg-gradient-to-br ${step.color} shadow-lg ${step.glow}`
                          : 'bg-gray-100'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={18} className="text-white" />
                      ) : (
                        <StepIcon size={18} className={isPending ? 'text-gray-400' : 'text-white'} />
                      )}
                    </motion.div>

                    <div className="flex-1 pt-1">
                      <p className={`font-bold text-sm ${isPending ? 'text-gray-400' : 'text-gray-900'}`}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs text-gray-500 mt-0.5 leading-relaxed"
                        >
                          {step.subtitle}
                        </motion.p>
                      )}
                    </div>

                    {isCurrent && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${step.bg} ${step.text} flex-shrink-0`}>
                        NOW
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Order Items with Photos & Quantities */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UtensilsCrossed size={16} className="text-orange-500" />
              <h3 className="font-black text-gray-900 text-sm">Ordered Dishes</h3>
            </div>
            <span className="text-xs font-bold text-gray-400">{order.items?.length || 0} items</span>
          </div>
          <div className="p-4 space-y-3.5">
            {order.items.map((item) => {
              const modifierString = item.modifiers?.map((m: any) => m.modifierOption?.name || m.name).filter(Boolean).join(', ') || '';
              const isCancelled = item.status === 'CANCELLED';
              const photoUrl = getPhotoUrl(item.menuItem?.photos?.[0]?.url);

              return (
                <div key={item.id} className={`flex items-center gap-3 ${isCancelled ? 'opacity-50' : ''}`}>
                  {/* Food Photo Thumbnail or Quantity badge */}
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-orange-100 flex-shrink-0 border border-gray-100 shadow-sm">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={item.menuItem.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-orange-600 font-black text-xs">
                        {item.menuItem.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 bg-orange-600 text-white font-black text-[9px] px-1 rounded-tl-md">
                      ×{item.quantity}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm text-gray-900 ${isCancelled ? 'line-through' : ''}`}>
                      {item.menuItem.name}
                    </p>
                    {modifierString && (
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate">{modifierString}</p>
                    )}
                    {isCancelled && <span className="text-[10px] text-red-500 font-bold">Cancelled</span>}
                  </div>
                  <span className={`font-bold text-sm flex-shrink-0 ${isCancelled ? 'text-gray-400' : 'text-gray-900'}`}>
                    {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              );
            })}
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
            <span className="font-bold text-gray-600 text-sm">Total Amount</span>
            <span className="text-xl font-black text-gray-900">{order.totalAmount.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="px-4 mb-4">
        <div className="bg-blue-50 rounded-2xl p-3 flex items-start gap-3 border border-blue-100">
          <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-blue-700 text-xs leading-relaxed">
            Need help? Ring the bell button to call your waiter, or use the actions below.
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto px-4 z-30">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-2xl p-4 flex gap-3">
          <Link
            to="/menu"
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl flex items-center justify-center text-sm transition-colors active:scale-95"
          >
            + Add More
          </Link>

          {order.status === 'COMPLETED' ? (
            <div className="flex-[2] py-3 bg-emerald-100 text-emerald-700 font-bold rounded-xl flex items-center justify-center gap-2 border border-emerald-200">
              <CheckCircle2 size={16} />
              Payment Done
            </div>
          ) : order.billRequested ? (
            <div className="flex-[2] flex gap-2">
              <button
                onClick={() => setShowMoMoModal(true)}
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 text-xs shadow-lg shadow-pink-200 active:scale-95 transition-all"
              >
                <CreditCard size={14} /> MoMo
              </button>
              <button
                onClick={() => toast.success("Please pay cash to the waiter")}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 text-xs shadow-lg shadow-green-200 active:scale-95 transition-all"
              >
                <Banknote size={14} /> Cash
              </button>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleRequestBill}
              disabled={requestingBill}
              className={`flex-[2] py-3 font-bold rounded-xl flex items-center justify-center gap-2 text-white shadow-lg transition-all ${
                requestingBill ? 'bg-gray-400' : 'bg-gradient-to-r from-emerald-500 to-green-600 shadow-green-200'
              }`}
            >
              {requestingBill ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Requesting…</>
              ) : (
                <><Bell size={16} /> Request Bill</>
              )}
            </motion.button>
          )}
        </div>
      </div>

      {/* Modals */}
      {showMoMoModal && order && (
        <MoMoPaymentModal
          orderId={order.id}
          amount={order.totalAmount}
          onClose={() => setShowMoMoModal(false)}
          onSuccess={() => { setShowMoMoModal(false); fetchOrder(); toast.success('Payment successful!'); }}
        />
      )}
      {showStripeModal && order && (
        <StripePaymentModal
          orderId={order.id}
          amount={order.totalAmount}
          onClose={() => setShowStripeModal(false)}
          onSuccess={() => { setShowStripeModal(false); fetchOrder(); }}
        />
      )}

      <AndroidBottomNav />
    </div>
  );
};

export default OrderTrackingPage;
