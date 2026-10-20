import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Compass, ShoppingBag, Clock, QrCode } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';

interface AndroidBottomNavProps {
  onOpenCart?: () => void;
  onOpenFloorPlan?: () => void;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({ onOpenCart, onOpenFloorPlan }) => {
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
      action: () => navigate('/'),
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-200/80 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] safe-bottom">
      <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-90 ${
                item.active
                  ? 'text-orange-600 font-extrabold'
                  : 'text-gray-400 hover:text-gray-600 font-medium'
              }`}
            >
              {/* Active Pill Glow */}
              {item.active && (
                <span className="absolute -top-1 w-8 h-1 bg-orange-500 rounded-full shadow-sm shadow-orange-300" />
              )}

              <div className="relative mb-0.5">
                <Icon size={22} strokeWidth={item.active ? 2.5 : 2} />
                {!!item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-orange-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow">
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
