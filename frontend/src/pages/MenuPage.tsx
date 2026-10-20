import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChefHat, ShoppingBag, FilterX, TrendingUp, Compass, Box, X,
  LayoutGrid, List, Star, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

import { guestApi } from '../api/guestApi';
import { Category, MenuItem } from '../types';
import ItemModal from '../components/ItemModal';
import CartModal from '../components/CartModal';
import { useCartStore } from '../store/useCartStore';
import { useDebounce } from '../hooks/useDebounce';
import { Footer } from '../components/common/Footer';
import { Header } from '../components/common/Header';
import AndroidBottomNav from '../components/mobile/AndroidBottomNav';
import Restaurant3DFloorPlan from '../components/3d/Restaurant3DFloorPlan';

// Category emoji map
const CATEGORY_EMOJIS: Record<string, string> = {
  burger: '🍔', pizza: '🍕', sushi: '🍱', drink: '🍹', coffee: '☕',
  dessert: '🍰', salad: '🥗', pasta: '🍝', chicken: '🍗', seafood: '🦞',
  steak: '🥩', soup: '🍜', vegetarian: '🥦', appetizer: '🥟', default: '🍽️'
};

const getCategoryEmoji = (name: string) => {
  const lower = name.toLowerCase();
  for (const key of Object.keys(CATEGORY_EMOJIS)) {
    if (lower.includes(key)) return CATEGORY_EMOJIS[key];
  }
  return CATEGORY_EMOJIS.default;
};

// Skeleton Card
const SkeletonCard = ({ grid }: { grid: boolean }) => (
  grid ? (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      <div className="w-full h-36 bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-5 bg-gray-200 rounded w-1/2 mt-1" />
      </div>
    </div>
  ) : (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex gap-3 animate-pulse">
      <div className="w-24 h-24 bg-gray-200 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-5 bg-gray-200 rounded w-1/3 mt-2" />
      </div>
    </div>
  )
);

export default function MenuPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);

  const [searchText, setSearchText] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('cat') || 'all');
  const [isChefFilter, setIsChefFilter] = useState(searchParams.get('chef') === 'true');
  const [sortBy, setSortBy] = useState<'default' | 'popular'>((searchParams.get('sort') as 'default' | 'popular') || 'default');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const [page, setPage] = useState(initialPage > 0 ? initialPage : 1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const debouncedSearch = useDebounce(searchText, 500);

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const totalCartItems = useCartStore(state => state.items.reduce((acc, i) => acc + i.quantity, 0));

  useEffect(() => {
    guestApi.getCategories().then(res => {
      const response = res as any;
      setCategories(response.data || []);
    });
  }, []);

  useEffect(() => {
    const params: any = {};
    if (debouncedSearch) params.q = debouncedSearch;
    if (selectedCategory !== 'all') params.cat = selectedCategory;
    if (isChefFilter) params.chef = 'true';
    if (sortBy !== 'default') params.sort = sortBy;
    if (page > 1) params.page = page.toString();
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, selectedCategory, isChefFilter, sortBy, page, setSearchParams]);

  const prevFiltersRef = useRef({ debouncedSearch, selectedCategory, isChefFilter, sortBy });
  useEffect(() => {
    const prevFilters = prevFiltersRef.current;
    const filtersChanged =
      prevFilters.debouncedSearch !== debouncedSearch ||
      prevFilters.selectedCategory !== selectedCategory ||
      prevFilters.isChefFilter !== isChefFilter ||
      prevFilters.sortBy !== sortBy;

    if (filtersChanged) {
      setItems([]);
      setPage(1);
      setHasMore(true);
      prevFiltersRef.current = { debouncedSearch, selectedCategory, isChefFilter, sortBy };
    }
  }, [debouncedSearch, selectedCategory, isChefFilter, sortBy]);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const res = await guestApi.getMenuItems({
          page, limit: 10,
          search: debouncedSearch,
          categoryId: selectedCategory === 'all' ? undefined : selectedCategory,
          isChefRecommended: isChefFilter,
          sortBy
        });
        const responseData = res as any;
        const newItems = responseData.data || [];
        setItems(prev => {
          if (page === 1) return newItems;
          const existingIds = new Set(prev.map(item => item.id));
          return [...prev, ...newItems.filter((item: MenuItem) => !existingIds.has(item.id))];
        });
        const pagination = responseData.pagination;
        if (pagination) {
          setTotalPages(pagination.totalPages);
          setHasMore(page < pagination.totalPages);
        } else {
          setHasMore(false);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [page, debouncedSearch, selectedCategory, isChefFilter, sortBy]);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) setPage(prev => prev + 1);
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-28 flex flex-col">
      <Header />

      {/* Sticky Top Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-sm sticky top-[57px] z-20 border-b border-gray-100">
        <div className="p-4 pb-2 space-y-3">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              Smart<span className="text-orange-600">Food</span>
            </h1>
            <div className="flex gap-1.5">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-xl p-0.5 mr-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
                >
                  <LayoutGrid size={16} />
                </button>
              </div>

              {/* Floor Plan */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowFloorPlan(true)}
                className="p-2 rounded-xl border bg-orange-50 border-orange-200 text-orange-600 shadow-sm"
                title="3D Restaurant Floor Plan"
              >
                <Compass size={18} />
              </motion.button>

              {/* Chef filter */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsChefFilter(!isChefFilter)}
                className={`p-2 rounded-xl border transition-all ${isChefFilter ? 'bg-orange-100 border-orange-500 text-orange-600 shadow-inner' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
              >
                <ChefHat size={18} strokeWidth={isChefFilter ? 2.5 : 2} />
              </motion.button>

              {/* Sort by popularity */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setSortBy(prev => prev === 'default' ? 'popular' : 'default')}
                className={`p-2 rounded-xl border transition-all ${sortBy === 'popular' ? 'bg-blue-100 border-blue-500 text-blue-600 shadow-inner' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                title="Sort by popularity"
              >
                <TrendingUp size={18} strokeWidth={sortBy === 'popular' ? 2.5 : 2} />
              </motion.button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="What are you craving today?"
              className="w-full bg-gray-100 pl-10 pr-9 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all border border-transparent focus:border-orange-300 focus:bg-white"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {searchText && (
              <button onClick={() => setSearchText('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <FilterX size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Category Scroll */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory('all')}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold transition-all shadow-sm flex items-center gap-1.5 ${
              selectedCategory === 'all' ? 'bg-gray-900 text-white shadow-gray-300' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            <span>✨</span> All
          </motion.button>
          {categories.map(cat => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(cat.id)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-orange-600 text-white shadow-orange-200'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              <span>{getCategoryEmoji(cat.name)}</span>
              {cat.name}
            </motion.button>
          ))}
        </div>
      </header>

      {/* Active Filters Banner */}
      <AnimatePresence>
        {(isChefFilter || sortBy === 'popular') && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-2 bg-orange-50 border-b border-orange-100 flex items-center gap-2 text-xs text-orange-700">
              <Zap size={12} className="text-orange-500" />
              {isChefFilter && <span className="font-bold">Chef's Picks</span>}
              {isChefFilter && sortBy === 'popular' && <span>·</span>}
              {sortBy === 'popular' && <span className="font-bold">Most Popular</span>}
              <button onClick={() => { setIsChefFilter(false); setSortBy('default'); }} className="ml-auto text-orange-500">
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu List */}
      <div className={`p-4 flex-1 ${viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}`}>
        {items.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`text-center py-20 text-gray-400 flex flex-col items-center ${viewMode === 'grid' ? 'col-span-2' : ''}`}
          >
            <ShoppingBag size={48} className="mb-3 opacity-20" />
            <p className="font-bold">No items found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </motion.div>
        )}

        <AnimatePresence mode='popLayout'>
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            const isUnavailable = item.status === 'SOLD_OUT' || item.status === 'UNAVAILABLE';
            const primaryPhoto = item.photos?.find((p: any) => p.isPrimary)?.url || item.photos?.[0]?.url;

            if (viewMode === 'grid') {
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  key={item.id}
                  ref={isLast ? lastItemRef : undefined}
                  onClick={() => !isUnavailable && setSelectedItem(item)}
                  className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${
                    isUnavailable ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-[0.97] hover:shadow-md'
                  }`}
                >
                  <div className="w-full h-36 bg-gray-200 relative overflow-hidden">
                    {primaryPhoto ? (
                      <img src={primaryPhoto} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        {getCategoryEmoji(item.category?.name || '')}
                      </div>
                    )}
                    {item.isChefRecommended && !isUnavailable && (
                      <div className="absolute top-2 left-2 bg-red-600/90 backdrop-blur-sm text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg">
                        Chef's ⭐
                      </div>
                    )}
                    {!isUnavailable && (
                      <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-amber-300 text-[8px] font-black px-1.5 py-0.5 rounded-lg flex items-center gap-0.5">
                        <Box size={8} /> 3D
                      </div>
                    )}
                    {item.status === 'SOLD_OUT' && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">Sold Out</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className={`font-bold text-sm line-clamp-2 flex-1 leading-tight ${isUnavailable ? 'text-gray-400' : 'text-gray-900'}`}>
                      {item.name}
                    </h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`font-extrabold text-base ${isUnavailable ? 'text-gray-400' : 'text-orange-600'}`}>
                        {item.price.toLocaleString()}đ
                      </span>
                      {!isUnavailable && (
                        <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg leading-none">+</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            }

            // List view
            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25 }}
                key={item.id}
                ref={isLast ? lastItemRef : undefined}
                onClick={() => !isUnavailable && setSelectedItem(item)}
                className={`bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-3 ${
                  isUnavailable ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98] hover:shadow-md'
                }`}
              >
                {/* Image */}
                <div className="w-24 h-24 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden relative">
                  {primaryPhoto ? (
                    <img src={primaryPhoto} className="w-full h-full object-cover" alt={item.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl bg-orange-50">
                      {getCategoryEmoji(item.category?.name || '')}
                    </div>
                  )}
                  {item.isChefRecommended && !isUnavailable && (
                    <div className="absolute top-0 left-0 bg-red-600/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded-br-lg">
                      ⭐
                    </div>
                  )}
                  {!isUnavailable && (
                    <div className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-sm text-amber-300 text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Box size={9} /><span>3D</span>
                    </div>
                  )}
                  {item.status === 'SOLD_OUT' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg">Sold Out</span>
                    </div>
                  )}
                  {item.status === 'UNAVAILABLE' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="bg-yellow-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg">N/A</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h3 className={`font-bold line-clamp-1 text-base ${isUnavailable ? 'text-gray-400' : 'text-gray-900'}`}>
                        {item.name}
                      </h3>
                      {item.status === 'AVAILABLE' && (
                        <span className="text-[9px] uppercase font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                          Available
                        </span>
                      )}
                    </div>
                    <p className={`text-xs line-clamp-2 mt-0.5 leading-relaxed ${isUnavailable ? 'text-gray-400' : 'text-gray-500'}`}>
                      {item.description}
                    </p>

                    {/* Size Options */}
                    {(() => {
                      const sizeGroup = item.modifierGroups?.find(g => g.name.toLowerCase().includes('size'));
                      if (sizeGroup && sizeGroup.options && sizeGroup.options.length > 0) {
                        return (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {sizeGroup.options.map(opt => (
                              <span key={opt.id} className="text-[9px] uppercase font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                {opt.name}
                              </span>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  <div className="flex justify-between items-center mt-1.5">
                    <span className={`font-extrabold text-lg ${isUnavailable ? 'text-gray-400' : 'text-orange-600'}`}>
                      {item.price.toLocaleString()}đ
                    </span>
                    {!isUnavailable && (
                      <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center hover:bg-orange-100 transition-colors border border-orange-200">
                        <span className="text-xl font-bold leading-none">+</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Infinite Scroll Trigger */}
        {hasMore && <div ref={lastItemRef} className="h-1" />}

        {/* Loading Skeletons */}
        {loading && (
          <>
            {[1, 2, 3].map(i => (
              <SkeletonCard key={i} grid={viewMode === 'grid'} />
            ))}
          </>
        )}
      </div>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {totalCartItems > 0 && (
          <div className="fixed bottom-20 left-4 right-4 z-30 max-w-md mx-auto">
            <motion.button
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-gray-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl shadow-black/20 flex justify-between items-center border border-gray-800"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingBag className="text-orange-500" size={22} />
                  <motion.span
                    key={totalCartItems}
                    initial={{ scale: 1.5 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black border-2 border-gray-900"
                  >
                    {totalCartItems}
                  </motion.span>
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="font-black text-sm">View Cart</span>
                  <span className="text-[10px] text-gray-400">{totalCartItems} item{totalCartItems !== 1 ? 's' : ''} selected</span>
                </div>
              </div>
              <span className="font-bold text-orange-400 text-sm flex items-center gap-1">
                Details →
              </span>
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* 3D Floor Plan Modal */}
      <AnimatePresence>
        {showFloorPlan && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-[#0f1117] rounded-3xl overflow-hidden shadow-2xl border border-gray-800 relative flex flex-col max-h-[90vh]"
            >
              <div className="p-4 bg-gray-900/80 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="text-orange-500" size={20} />
                  <h3 className="text-white font-black text-base">3D Restaurant Floor Plan</h3>
                </div>
                <button
                  onClick={() => setShowFloorPlan(false)}
                  className="p-1.5 rounded-full bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-2 sm:p-4 overflow-y-auto">
                <Restaurant3DFloorPlan
                  tables={[]}
                  onSelectTable={(table) => {
                    toast.success(`Selected ${table.name}`);
                    setShowFloorPlan(false);
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modals */}
      {selectedItem && (
        <ItemModal
          item={selectedItem}
          initial3D={true}
          relatedItems={items.filter(i => i.categoryId === selectedItem.categoryId && i.id !== selectedItem.id).slice(0, 4)}
          onSelectRelated={setSelectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <Footer />
      <AndroidBottomNav onOpenCart={() => setIsCartOpen(true)} onOpenFloorPlan={() => setShowFloorPlan(true)} />
    </div>
  );
}
