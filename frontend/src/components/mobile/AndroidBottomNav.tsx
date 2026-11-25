import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed, ShoppingBag, Clock, Home, Armchair, ChevronRight, QrCode, Receipt,
  User, LogIn, LogOut, ChefHat, MapPin, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '../../store/useCartStore';
import { useSessionStore } from '../../store/useSessionStore';
import { useAuthStore } from '../../store/useAuthStore';
import { guestApi } from '../../api/guestApi';
import { getApiErrorMessage } from '../../api/axiosClient';
import { formatCurrency } from '../../utils/formatCurrency';

interface GuestSideNavProps {
  onOpenCart?: () => void;
  onOpenFloorPlan?: () => void;
}

/**
 * Full-height guest navigation panel on the left edge.
 * Collapsed to a slim handle; slides open on hover (mouse) or tap (touch).
 * Sections: current table, main menu, quick shortcuts, cart summary.
 */
export const GuestSideNav: React.FC<GuestSideNavProps> = ({ onOpenCart, onOpenFloorPlan }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [requestingBill, setRequestingBill] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const cartItems = useCartStore((s) => s.items);
  const cartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const cartTotal = cartItems.reduce((acc, i) => acc + i.totalPrice * i.quantity, 0);
  const { sessionId, tableName, activeOrderId, billRequested, setBillRequested } = useSessionStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const pathname = location.pathname;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  if (['/admin', '/waiter', '/kitchen', '/login'].some((p) => pathname.startsWith(p))) return null;

  const close = () => setOpen(false);
  const run = (fn: () => void) => () => {
    fn();
    close();
  };

  const requestBill = async () => {
    if (!activeOrderId) return;
    setRequestingBill(true);
    try {
      await guestApi.requestBill(activeOrderId);
      setBillRequested(true);
      toast.success('Your server has been notified and will bring the bill.');
      close();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not request the bill. Please try again.'));
    } finally {
      setRequestingBill(false);
    }
  };

  const mainItems = [
    { id: 'home', label: 'Home', icon: Home, active: pathname === '/', action: () => navigate('/') },
    { id: 'menu', label: 'Menu', icon: UtensilsCrossed, active: pathname === '/menu', action: () => navigate('/menu') },
    {
      id: 'tracking', label: billRequested ? 'Live bill' : 'Order status', icon: Clock,
      active: pathname === '/tracking', action: () => navigate('/tracking'), tag: billRequested ? 'BILL' : undefined,
    },
    {
      id: 'cart', label: 'My cart', icon: ShoppingBag, active: false, count: cartCount,
      action: () => (onOpenCart ? onOpenCart() : navigate('/menu')),
    },
  ];

  const shortcuts = [
    sessionId
      ? { id: 'hall', label: 'Dining hall', hint: '3D tables', icon: Armchair, onClick: onOpenFloorPlan ? run(onOpenFloorPlan) : run(() => navigate('/')) }
      : { id: 'seat', label: 'Get seated', hint: 'Scan or walk in', icon: QrCode, onClick: run(() => navigate('/')) },
    { id: 'specials', label: "Chef's picks", hint: 'Recommended', icon: ChefHat, onClick: run(() => navigate('/menu?chef=true')) },
    {
      id: 'bill', label: billRequested ? 'Bill requested' : 'Request bill', hint: activeOrderId ? 'Notify server' : 'Order first',
      icon: Receipt, onClick: requestBill, disabled: !activeOrderId || billRequested || requestingBill,
    },
    { id: 'track', label: 'Track order', hint: 'Live status', icon: Clock, onClick: run(() => navigate('/tracking')), disabled: !activeOrderId },
    isAuthenticated
      ? { id: 'profile', label: 'My account', hint: 'Orders & profile', icon: User, onClick: run(() => navigate('/profile')) }
      : { id: 'login', label: 'Sign in', hint: 'Save your orders', icon: LogIn, onClick: run(() => navigate('/login')) },
    ...(isAuthenticated
      ? [{ id: 'logout', label: 'Sign out', hint: user?.fullName?.split(' ')[0] || 'Account', icon: LogOut, onClick: run(() => { logout(); toast.success('Signed out'); }) }]
      : [{ id: 'menu2', label: 'Full menu', hint: 'All dishes', icon: UtensilsCrossed, onClick: run(() => navigate('/menu')) }]),
  ];

  return (
    <div
      ref={panelRef}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="fixed inset-y-0 left-0 z-40 pointer-events-none"
    >
      {/* Collapsed handle */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        aria-expanded={open}
        className={`absolute left-0 top-1/2 -translate-y-1/2 h-24 w-4 hover:w-5 rounded-r-xl bg-[#0b0d13]/90 border border-l-0 border-white/15 shadow-lg flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
          open ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
        }`}
      >
        <span className="w-0.5 h-4 rounded bg-amber-400/80" />
        <ChevronRight size={12} className="text-amber-400" />
        <span className="w-0.5 h-4 rounded bg-amber-400/80" />
        {cartCount > 0 && (
          <span className="absolute -top-2 left-1 bg-orange-500 text-black text-[9px] font-black min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center border border-black">
            {cartCount}
          </span>
        )}
      </button>

      {/* Full-height panel */}
      <aside
        aria-label="Guest navigation"
        aria-hidden={!open}
        className={`h-full w-[288px] max-w-[85vw] bg-[#0b0d13]/97 backdrop-blur-2xl border-r border-white/10 shadow-[16px_0_50px_rgba(0,0,0,0.55)] flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
          <button onClick={run(() => navigate('/'))} className="flex items-center gap-2.5" tabIndex={open ? 0 : -1}>
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white font-black text-sm flex items-center justify-center">SR</span>
            <span className="text-left">
              <span className="block text-white font-bold text-[15px] leading-tight">Smart Restaurant</span>
              <span className="block text-[11px] text-gray-500">Dine-in ordering</span>
            </span>
          </button>
          <button onClick={close} aria-label="Close navigation" tabIndex={open ? 0 : -1} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {/* Table card */}
          <div className="rounded-2xl p-3.5 bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10">
            <div className="flex items-center gap-3">
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${sessionId ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-gray-400'}`}>
                <MapPin size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Your table</p>
                <p className="text-sm font-bold text-white truncate">{sessionId ? tableName || 'Seated' : 'Not seated yet'}</p>
              </div>
              {sessionId && <span className="ml-auto text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Active</span>}
            </div>
            {!sessionId && (
              <button
                onClick={run(() => navigate('/'))}
                tabIndex={open ? 0 : -1}
                className="mt-3 w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition"
              >
                Scan QR or get seated
              </button>
            )}
          </div>

          {/* Main navigation */}
          <nav>
            <p className="px-2 mb-1.5 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Navigate</p>
            <ul className="space-y-0.5">
              {mainItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={run(item.action)}
                      tabIndex={open ? 0 : -1}
                      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                        item.active ? 'bg-amber-500/15 text-amber-300 font-bold' : 'text-gray-300 hover:bg-white/5 hover:text-white font-medium'
                      }`}
                    >
                      {item.active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-amber-400" />}
                      <Icon size={19} strokeWidth={item.active ? 2.4 : 1.9} />
                      <span>{item.label}</span>
                      {!!item.count && item.count > 0 && (
                        <span className="ml-auto bg-orange-500 text-black text-[10px] font-black min-w-5 h-5 px-1 rounded-full flex items-center justify-center">{item.count}</span>
                      )}
                      {item.tag && <span className="ml-auto bg-amber-500 text-black text-[9px] font-black px-1.5 rounded-full">{item.tag}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Shortcuts */}
          <div>
            <p className="px-2 mb-2 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Shortcuts</p>
            <div className="grid grid-cols-2 gap-2">
              {shortcuts.map((sc) => {
                const Icon = sc.icon;
                return (
                  <button
                    key={sc.id}
                    onClick={sc.onClick}
                    disabled={(sc as any).disabled}
                    tabIndex={open ? 0 : -1}
                    className="group text-left p-3 rounded-2xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.08] hover:border-amber-500/30 disabled:opacity-40 disabled:pointer-events-none transition"
                  >
                    <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 flex items-center justify-center mb-2">
                      <Icon size={16} />
                    </span>
                    <span className="block text-[13px] font-semibold text-white leading-tight">{sc.label}</span>
                    <span className="block text-[11px] text-gray-500 mt-0.5">{sc.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cart summary */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={run(() => (onOpenCart ? onOpenCart() : navigate('/menu')))}
            tabIndex={open ? 0 : -1}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 hover:brightness-110 text-left transition"
          >
            <span className="w-9 h-9 rounded-xl bg-black/15 flex items-center justify-center text-white">
              <ShoppingBag size={18} />
            </span>
            <span className="flex-1">
              <span className="block text-[11px] text-white/80 font-semibold">{cartCount > 0 ? `${cartCount} item${cartCount > 1 ? 's' : ''} in cart` : 'Your cart is empty'}</span>
              <span className="block text-sm font-bold text-white">{cartCount > 0 ? formatCurrency(cartTotal) : 'Browse the menu'}</span>
            </span>
            <ChevronRight size={18} className="text-white/80" />
          </button>
        </div>
      </aside>
    </div>
  );
};

/** @deprecated kept for existing imports; renders the guest side panel */
export const AndroidBottomNav = GuestSideNav;
export default GuestSideNav;
