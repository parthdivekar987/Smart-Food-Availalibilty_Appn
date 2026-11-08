import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ShoppingBag, Clock, QrCode } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';

interface AndroidBottomNavProps {
  onOpenCart?: () => void;
  onOpenFloorPlan?: () => void;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({ onOpenCart }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const totalCartItems = useCartStore((state) =>
    state.items.reduce((acc, i) => acc + i.quantity, 0)
  );

  const pathname = location.pathname;

  // Don't show inside admin or staff views
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/waiter') ||
    pathname.startsWith('/kitchen') ||
    pathname.startsWith('/login')
  ) {
    return null;
  }

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: QrCode,
      active: pathname === '/',
      action: () => {
        if (pathname === '/') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          navigate('/');
        }
      },
    },
    {
      id: 'menu',
      label: 'Menu & 3D',
      icon: UtensilsCrossed,
      active: pathname === '/menu',
      action: () => navigate('/menu'),
    },
    {
      id: 'tracking',
      label: 'Order Status',
      icon: Clock,
      active: pathname === '/tracking',
      action: () => navigate('/tracking'),
    },
    {
      id: 'cart',
      label: 'My Cart',
      icon: ShoppingBag,
      active: false,
      badge: totalCartItems,
      action: () => {
        if (onOpenCart) onOpenCart();
        else navigate('/menu');
      },
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0c12]/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_35px_rgba(0,0,0,0.8)] pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-all">
      <div className="max-w-md mx-auto px-3 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 active:scale-90 min-w-[64px] min-h-[48px] ${
                item.active
                  ? 'text-amber-400 font-extrabold'
                  : 'text-gray-400 hover:text-gray-200 font-medium'
              }`}
            >
              {/* Active Indicator Top Pill Glow */}
              {item.active && (
                <span className="absolute -top-1.5 w-9 h-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
              )}

              <div className="relative mb-0.5">
                <Icon size={21} strokeWidth={item.active ? 2.6 : 1.9} />
                {!!item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-black text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-black shadow">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default AndroidBottomNav;
