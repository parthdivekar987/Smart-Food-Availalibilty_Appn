import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ShoppingBag, Undo2, ConciergeBell, ShieldCheck, QrCode, ChefHat } from 'lucide-react';
import { onCartItemAdded, useCartStore, CartAddedEvent } from '../../store/useCartStore';
import { useSessionStore } from '../../store/useSessionStore';
import { useSocketStore } from '../../store/useSocketStore';
import { guestApi } from '../../api/guestApi';
import { getPhotoUrl } from '../../utils/photoUrl';
import { formatCurrency } from '../../utils/formatCurrency';
import { APP_EVENTS, emitAppEvent } from '../../utils/appEvents';

const STAFF_PATHS = ['/admin', '/waiter', '/kitchen'];
const STATUS_POLL_MS = 60_000;

interface CheckoutInfo {
  tableName?: string | null;
  amountPaid?: number | null;
  method?: string | null;
  reason: 'PAID' | 'CLOSED' | 'CLOSED_BY_STAFF' | 'NOT_FOUND';
}

/* ───────────────────────────── Toast UIs ───────────────────────────── */

const CartAddedToast: React.FC<{ t: { id: string; visible: boolean }; e: CartAddedEvent; onUndo: () => void; onView: () => void }> = ({ t, e, onUndo, onView }) => {
  const photo = e.item.photos?.find((p) => p.isPrimary)?.url || e.item.photos?.[0]?.url;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-[340px] max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-[0_18px_50px_-12px_rgba(0,0,0,0.35)] border border-gray-100 overflow-hidden transition-all duration-300 ${
        t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-orange-50 flex-shrink-0">
          {photo ? (
            <img src={getPhotoUrl(photo)} alt="" className="w-full h-full object-cover" />
          ) : (
            <ShoppingBag className="w-6 h-6 text-orange-400 absolute inset-0 m-auto" />
          )}
          <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-white">
            <Check size={12} strokeWidth={3} />
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">Added to cart</p>
          <p className="text-sm font-bold text-gray-900 truncate">
            {e.quantity} × {e.item.name}
          </p>
          <p className="text-xs text-gray-500">
            {formatCurrency(e.unitPrice * e.quantity)}
            {e.lineQuantity > e.quantity && <span className="text-gray-400"> · {e.lineQuantity} in cart</span>}
          </p>
        </div>
      </div>
      <div className="flex border-t border-gray-100">
        <button onClick={onUndo} className="flex-1 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1.5">
          <Undo2 size={14} /> Undo
        </button>
        <button onClick={onView} className="flex-1 py-2.5 text-xs font-bold text-orange-600 hover:bg-orange-50 border-l border-gray-100 flex items-center justify-center gap-1.5">
          <ShoppingBag size={14} /> View cart
        </button>
      </div>
    </div>
  );
};

const StaffAddedToast: React.FC<{ t: { id: string; visible: boolean }; data: any; onView: () => void; onClose: () => void }> = ({ t, data, onView, onClose }) => (
  <div
    role="alert"
    className={`w-[350px] max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-[0_18px_50px_-12px_rgba(0,0,0,0.35)] border border-amber-200 overflow-hidden transition-all duration-300 ${
      t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
    }`}
  >
    <div className="flex gap-3 p-3.5">
      <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
        <ConciergeBell size={20} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900">Your server added to your order</p>
        <p className="text-xs text-gray-500 mt-0.5">by {data.addedBy?.name || 'Staff'}</p>
        <ul className="mt-2 space-y-0.5">
          {(data.items || []).slice(0, 4).map((i: any, idx: number) => (
            <li key={idx} className="text-xs text-gray-700 flex justify-between gap-2">
              <span className="truncate">{i.quantity} × {i.name}</span>
              <span className="text-gray-500 flex-shrink-0">{formatCurrency(i.price * i.quantity)}</span>
            </li>
          ))}
          {(data.items || []).length > 4 && <li className="text-xs text-gray-400">+{data.items.length - 4} more</li>}
        </ul>
        <p className="text-xs font-semibold text-gray-900 mt-2">Order total: {formatCurrency(data.totalAmount)}</p>
      </div>
    </div>
    <div className="flex border-t border-gray-100">
      <button onClick={onClose} className="flex-1 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">Dismiss</button>
      <button onClick={onView} className="flex-1 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-50 border-l border-gray-100">View order</button>
    </div>
  </div>
);

/* ───────────────────────────── Checkout screen ───────────────────────────── */

const CheckoutOverlay: React.FC<{ info: CheckoutInfo; onDone: () => void }> = ({ info, onDone }) => {
  const [seconds, setSeconds] = useState(20);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (seconds <= 0) onDone();
  }, [seconds, onDone]);

  const paid = info.reason === 'PAID';
  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-title"
    >
      <motion.div
        initial={{ scale: 0.94, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden text-center"
      >
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-6 pt-8 pb-6 text-white">
          <span className="mx-auto w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <Check size={34} strokeWidth={3} />
          </span>
          <h2 id="checkout-title" className="mt-4 text-xl font-bold">
            {paid ? 'Payment received — thank you!' : 'Your table session has ended'}
          </h2>
          {paid && info.amountPaid != null && (
            <p className="mt-1 text-white/90 text-sm">
              {formatCurrency(info.amountPaid)}
              {info.method ? ` · ${info.method.toLowerCase()}` : ''}
            </p>
          )}
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 text-left bg-gray-50 rounded-2xl p-3.5">
            <ShieldCheck size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 leading-relaxed">
              For your security you have been signed out of {info.tableName || 'your table'}. Your cart and order details were cleared from this device.
            </p>
          </div>
          <button
            onClick={onDone}
            className="w-full py-3 rounded-xl bg-gray-900 hover:bg-black text-white text-sm font-semibold flex items-center justify-center gap-2"
          >
            <QrCode size={16} /> Start a new order
          </button>
          <p className="text-[11px] text-gray-400">Returning to the start screen in {Math.max(0, seconds)}s</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ───────────────────────────── Bridge ───────────────────────────── */

/**
 * Always-mounted guest real-time controller:
 *  - pop-up on every cart add (with Undo / View cart) + live cart activity to staff
 *  - joins the table-session room (re-joined automatically on reconnect)
 *  - notifies when staff add items, when food is ready/served, when the bill is requested
 *  - on checkout (payment) signs the device out of the table, clears local data and shows a thank-you screen
 *  - re-validates the session on reconnect / tab focus / every minute so a missed event never leaves a stale session
 */
export const GuestRealtimeBridge: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const sessionId = useSessionStore((s) => s.sessionId);
  const socket = useSocketStore((s) => s.socket);
  const joinRoom = useSocketStore((s) => s.joinRoom);
  const forgetSession = useSocketStore((s) => s.forgetSession);
  const [checkout, setCheckout] = useState<CheckoutInfo | null>(null);
  const checkedOutRef = useRef<string | null>(null);
  const isStaffScreen = STAFF_PATHS.some((p) => pathname.startsWith(p));
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  const openCart = useCallback(() => {
    if (pathRef.current === '/menu') emitAppEvent(APP_EVENTS.OPEN_CART);
    else navigate('/menu?cart=open');
  }, [navigate]);

  /** Sign this device out of the table session (idempotent) */
  const endSession = useCallback(
    (info: CheckoutInfo) => {
      const current = useSessionStore.getState().sessionId;
      if (!current || checkedOutRef.current === current) return;
      checkedOutRef.current = current;
      const tableName = info.tableName || useSessionStore.getState().tableName;
      forgetSession(current);
      useCartStore.getState().clearCart();
      useSessionStore.getState().resetSession();
      toast.dismiss();
      if (info.reason === 'NOT_FOUND') {
        toast('Your previous table session is no longer valid. Please scan your table QR code.', { icon: 'ℹ️' });
        return;
      }
      setCheckout({ ...info, tableName });
    },
    [forgetSession]
  );

  const finishCheckout = useCallback(() => {
    setCheckout(null);
    navigate('/');
  }, [navigate]);

  /** Server truth: is the stored session still open? */
  const verifySession = useCallback(async () => {
    const current = useSessionStore.getState().sessionId;
    if (!current) return;
    try {
      const status = await guestApi.getSessionStatus(current);
      if (status.status !== 'OPEN') endSession({ reason: 'CLOSED', tableName: status.tableName });
    } catch (err: any) {
      if (err?.response?.status === 404) endSession({ reason: 'NOT_FOUND' });
      // network errors: keep the session, we'll re-check later
    }
  }, [endSession]);

  // 1. Cart pop-up + live cart activity for staff
  useEffect(
    () =>
      onCartItemAdded((e) => {
        if (STAFF_PATHS.some((p) => pathRef.current.startsWith(p))) return;
        toast.custom(
          (t) => (
            <CartAddedToast
              t={t}
              e={e}
              onUndo={() => {
                useCartStore.getState().undoAdd(e.cartItemId, e.quantity);
                toast.dismiss(t.id);
                toast(`Removed ${e.quantity} × ${e.item.name}`, { icon: '↩️', duration: 2000 });
              }}
              onView={() => {
                toast.dismiss(t.id);
                openCart();
              }}
            />
          ),
          { id: `cart-${e.cartItemId}`, duration: 3500, position: 'top-center' }
        );

        const { sessionId: sid } = useSessionStore.getState();
        const sock = useSocketStore.getState().socket;
        if (sid && sock?.connected) {
          sock.emit('cart_activity', { tableSessionId: sid, menuItemId: e.item.id, quantity: e.quantity });
        }
      }),
    [openCart]
  );

  // 2. Join the session room and validate the session on start
  useEffect(() => {
    if (!sessionId || isStaffScreen) return;
    checkedOutRef.current = null;
    joinRoom({ role: 'CUSTOMER', tableSessionId: sessionId });
    verifySession();
  }, [sessionId, isStaffScreen, joinRoom, verifySession]);

  // 3. Re-validate on reconnect, when the tab becomes visible, and periodically
  useEffect(() => {
    if (!sessionId || isStaffScreen) return;
    const onVisible = () => document.visibilityState === 'visible' && verifySession();
    document.addEventListener('visibilitychange', onVisible);
    socket?.on('connect', verifySession);
    const poll = setInterval(verifySession, STATUS_POLL_MS);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      socket?.off('connect', verifySession);
      clearInterval(poll);
    };
  }, [sessionId, isStaffScreen, socket, verifySession]);

  // 4. Real-time events for this table
  useEffect(() => {
    if (!socket || !sessionId || isStaffScreen) return;

    const refreshOrder = async () => {
      try {
        const order: any = await guestApi.getOrderDetails(sessionId);
        if (order?.id) useSessionStore.getState().setActiveOrder(order);
      } catch {
        /* order view will refresh on its own */
      }
      emitAppEvent(APP_EVENTS.ORDER_UPDATED);
    };

    const onItemsAdded = (data: any) => {
      if (data?.tableSessionId !== sessionId) return;
      toast.custom(
        (t) => (
          <StaffAddedToast
            t={t}
            data={data}
            onClose={() => toast.dismiss(t.id)}
            onView={() => {
              toast.dismiss(t.id);
              navigate('/tracking');
            }}
          />
        ),
        { id: `staff-add-${data.timestamp}`, duration: 9000, position: 'top-center' }
      );
      refreshOrder();
    };

    const onReady = (data: any) => {
      if (data?.tableSessionId && data.tableSessionId !== sessionId) return;
      if (pathRef.current !== '/tracking') {
        toast.success('Your order is ready and on its way to your table!', { icon: <ChefHat size={18} className="text-emerald-600" />, duration: 6000 });
      }
      refreshOrder();
    };

    const onServed = (data: any) => {
      if (data?.tableSessionId && data.tableSessionId !== sessionId) return;
      if (pathRef.current !== '/tracking') toast.success('Your order has been served. Enjoy your meal!', { duration: 5000 });
      refreshOrder();
    };

    const onBillRequested = (order: any) => {
      if (order?.tableSessionId === sessionId) useSessionStore.getState().setBillRequested(true);
    };

    const onSessionClosed = (data: any) => {
      if (data?.tableSessionId !== sessionId) return;
      endSession({
        reason: data.reason === 'PAID' ? 'PAID' : data.reason === 'NOT_FOUND' ? 'NOT_FOUND' : 'CLOSED',
        tableName: data.tableName,
        amountPaid: data.amountPaid,
        method: data.method,
      });
    };

    socket.on('order_items_added', onItemsAdded);
    socket.on('order_ready', onReady);
    socket.on('order_served', onServed);
    socket.on('bill_requested', onBillRequested);
    socket.on('session_closed', onSessionClosed);
    return () => {
      socket.off('order_items_added', onItemsAdded);
      socket.off('order_ready', onReady);
      socket.off('order_served', onServed);
      socket.off('bill_requested', onBillRequested);
      socket.off('session_closed', onSessionClosed);
    };
  }, [socket, sessionId, isStaffScreen, endSession, navigate]);

  return <AnimatePresence>{checkout && <CheckoutOverlay info={checkout} onDone={finishCheckout} />}</AnimatePresence>;
};

export default GuestRealtimeBridge;
