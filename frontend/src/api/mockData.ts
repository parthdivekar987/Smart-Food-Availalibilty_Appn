import { Category, MenuItem, Table } from '../types';
import { User, Role } from '../types/user.types';

// ─── MOCK TABLES (Numbered, with occupancy status) ───────────────────
export const MOCK_TABLES: Table[] = [
  { id: 'tbl-1', name: 'Table 01', capacity: 2, isActive: true, isOccupied: false, restaurantId: 'r1' },
  { id: 'tbl-2', name: 'Table 02', capacity: 4, isActive: true, isOccupied: true,  restaurantId: 'r1' },
  { id: 'tbl-3', name: 'Table 03', capacity: 2, isActive: true, isOccupied: false, restaurantId: 'r1' },
  { id: 'tbl-4', name: 'Table 04', capacity: 4, isActive: true, isOccupied: true,  restaurantId: 'r1' },
  { id: 'tbl-5', name: 'Table 05', capacity: 6, isActive: true, isOccupied: false, restaurantId: 'r1' },
  { id: 'tbl-6', name: 'Table 06', capacity: 4, isActive: false, isOccupied: false, restaurantId: 'r1' },
  { id: 'tbl-7', name: 'Table 07', capacity: 4, isActive: true, isOccupied: false, restaurantId: 'r1' },
  { id: 'tbl-8', name: 'Table 08', capacity: 8, isActive: true, isOccupied: true,  restaurantId: 'r1' },
];

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Chef Specials', menuItems: [] },
  { id: 'cat-2', name: 'Gourmet Burgers', menuItems: [] },
  { id: 'cat-3', name: 'Artisan Pizza', menuItems: [] },
  { id: 'cat-4', name: 'Sushi & Asian', menuItems: [] },
  { id: 'cat-5', name: 'Signature Drinks', menuItems: [] },
  { id: 'cat-6', name: 'Decadent Desserts', menuItems: [] },
];

export const MOCK_ITEMS: MenuItem[] = [
  {
    id: 'item-vada-pav',
    categoryId: 'cat-1',
    name: 'Mumbai Special Vada Paav',
    price: 50,
    description: 'Crispy golden spiced potato vada tucked in buttered soft pav bun with roasted garlic red chutney and salted green chillies.',
    prepTime: 10,
    status: 'AVAILABLE',
    isChefRecommended: true,
    photos: [
      {
        id: 'p-vada-pav',
        menuItemId: 'item-vada-pav',
        url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
        isPrimary: true,
      },
    ],
    modifierGroups: [
      {
        id: 'mg-vp',
        name: 'Chutney & Extras',
        required: false,
        selection_type: 'single',
        options: [
          { id: 'opt-vp-1', name: 'Extra Dry Garlic Thecha Chutney', priceDelta: 10 },
          { id: 'opt-vp-2', name: 'Melted Amul Cheese Slice', priceDelta: 20 },
        ],
      },
    ],
  },
  {
    id: 'item-1',
    categoryId: 'cat-1',
    name: 'Wagyu Ribeye Truffle Steak',
    price: 349000,
    description: 'Prime A5 Wagyu ribeye seared with black truffle butter, roasted baby asparagus, and rosemary demi-glace.',
    prepTime: 18,
    status: 'AVAILABLE',
    isChefRecommended: true,
    photos: [
      {
        id: 'p1',
        menuItemId: 'item-1',
        url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        isPrimary: true,
      },
    ],
    modifierGroups: [
      {
        id: 'mg-1',
        name: 'Doneness',
        required: true,
        selection_type: 'single',
        options: [
          { id: 'opt-1', name: 'Medium Rare (Recommended)', priceDelta: 0 },
          { id: 'opt-2', name: 'Medium', priceDelta: 0 },
          { id: 'opt-3', name: 'Well Done', priceDelta: 0 },
        ],
      },
    ],
  },
  {
    id: 'item-2',
    categoryId: 'cat-2',
    name: 'Double Smokehouse Bacon Burger',
    price: 165000,
    description: 'Twin Angus beef patties, molten sharp cheddar, maple wood-smoked bacon, and caramelized onion relish on brioche.',
    prepTime: 12,
    status: 'AVAILABLE',
    isChefRecommended: true,
    photos: [
      {
        id: 'p2',
        menuItemId: 'item-2',
        url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
        isPrimary: true,
      },
    ],
    modifierGroups: [
      {
        id: 'mg-3',
        name: 'Fries Option',
        required: false,
        selection_type: 'single',
        options: [
          { id: 'opt-7', name: 'Truffle Parmesan Fries', priceDelta: 35000 },
          { id: 'opt-8', name: 'Classic Crispy Fries', priceDelta: 20000 },
        ],
      },
    ],
  },
  {
    id: 'item-3',
    categoryId: 'cat-3',
    name: 'Black Truffle Burrata Pizza',
    price: 220000,
    description: 'Wood-fired sourdough crust, fior di latte, creamy Italian burrata, shaved summer truffles, and wild arugula.',
    prepTime: 15,
    status: 'AVAILABLE',
    isChefRecommended: false,
    photos: [
      {
        id: 'p3',
        menuItemId: 'item-3',
        url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
        isPrimary: true,
      },
    ],
    modifierGroups: [],
  },
  {
    id: 'item-4',
    categoryId: 'cat-4',
    name: 'Dragon Roll Flame-Torched Salmon',
    price: 185000,
    description: 'Fresh Norwegian salmon, cucumber, crispy tempura crunch wrapped in thinly sliced Hass avocado with unagi glaze.',
    prepTime: 10,
    status: 'AVAILABLE',
    isChefRecommended: true,
    photos: [
      {
        id: 'p4',
        menuItemId: 'item-4',
        url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
        isPrimary: true,
      },
    ],
    modifierGroups: [],
  },
  {
    id: 'item-5',
    categoryId: 'cat-5',
    name: 'Citrus Sunset Passion Mocktail',
    price: 65000,
    description: 'Fresh squeezed passionfruit puree, ruby blood orange, mint leaves, crushed ice and bubbly club soda.',
    prepTime: 5,
    status: 'AVAILABLE',
    isChefRecommended: false,
    photos: [
      {
        id: 'p5',
        menuItemId: 'item-5',
        url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
        isPrimary: true,
      },
    ],
    modifierGroups: [],
  },
  {
    id: 'item-6',
    categoryId: 'cat-6',
    name: 'Molten Belgian Chocolate Lava Cake',
    price: 95000,
    description: 'Warm dark chocolate cake with a rich liquid ganache center, paired with Madagascar vanilla bean gelato.',
    prepTime: 12,
    status: 'AVAILABLE',
    isChefRecommended: true,
    photos: [
      {
        id: 'p6',
        menuItemId: 'item-6',
        url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
        isPrimary: true,
      },
    ],
    modifierGroups: [],
  },
];

// Realistic Restaurant Tables with 3D Floor Coordinates
export const MOCK_TABLES: Table[] = [
  { id: 'tbl-1', name: 'Table 01 (VIP Booth)', capacity: 4, isActive: true, restaurantId: 'r1' },
  { id: 'tbl-2', name: 'Table 02 (Window)', capacity: 2, isActive: true, restaurantId: 'r1' },
  { id: 'tbl-3', name: 'Table 03 (Window)', capacity: 2, isActive: false, restaurantId: 'r1' },
  { id: 'tbl-4', name: 'Table 04 (Main Hall)', capacity: 4, isActive: true, restaurantId: 'r1' },
  { id: 'tbl-5', name: 'Table 05 (Family Dining)', capacity: 6, isActive: true, restaurantId: 'r1' },
  { id: 'tbl-6', name: 'Table 06 (Terrace Patio)', capacity: 4, isActive: false, restaurantId: 'r1' },
  { id: 'tbl-7', name: 'Table 07 (Terrace Patio)', capacity: 4, isActive: true, restaurantId: 'r1' },
  { id: 'tbl-8', name: 'Table 08 (Banquet Suite)', capacity: 8, isActive: true, restaurantId: 'r1' },
];

// Realistic Customers
export const MOCK_CUSTOMERS: User[] = [
  {
    id: 'cust-1',
    email: 'alex.morgan@gmail.com',
    fullName: 'Alex Morgan',
    role: Role.CUSTOMER,
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    isActive: true,
  },
  {
    id: 'cust-2',
    email: 'sarah.connor@yahoo.com',
    fullName: 'Sarah Connor',
    role: Role.CUSTOMER,
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    isActive: true,
  },
  {
    id: 'cust-3',
    email: 'david.beck@outlook.com',
    fullName: 'David Beck',
    role: Role.CUSTOMER,
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    isActive: true,
  },
  {
    id: 'cust-4',
    email: 'elena.rostova@gmail.com',
    fullName: 'Elena Rostova',
    role: Role.CUSTOMER,
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    isActive: true,
  },
  {
    id: 'cust-5',
    email: 'marcus.vance@techcorp.io',
    fullName: 'Marcus Vance',
    role: Role.CUSTOMER,
    isVerified: false,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    isActive: true,
  },
  {
    id: 'cust-6',
    email: 'chloe.bennet@gmail.com',
    fullName: 'Chloe Bennet',
    role: Role.CUSTOMER,
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    isActive: true,
  },
];

// Restaurant Staff & Employees
export const MOCK_EMPLOYEES: User[] = [
  {
    id: 'emp-1',
    email: 'admin@restaurant.com',
    fullName: 'Super Administrator',
    role: Role.SUPER_ADMIN,
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
    isActive: true,
  },
  {
    id: 'emp-2',
    email: 'chef.gordon@restaurant.com',
    fullName: 'Chef Gordon Ramsay',
    role: Role.KITCHEN,
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&w=200&q=80',
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
    isActive: true,
  },
  {
    id: 'emp-3',
    email: 'john.waiter@restaurant.com',
    fullName: 'John Waiter',
    role: Role.WAITER,
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    isActive: true,
  },
  {
    id: 'emp-4',
    email: 'lisa.manager@restaurant.com',
    fullName: 'Lisa Manager',
    role: Role.ADMIN,
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    isActive: true,
  },
];

// Live Orders
export const MOCK_ORDERS = [
  {
    id: 'ord-101',
    orderNumber: '#101',
    tableNumber: 'Table 04',
    tableId: 'tbl-4',
    status: 'PREPARING',
    paymentStatus: 'PAID',
    totalAmount: 514000,
    itemCount: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    items: [
      { id: 'oi-1', name: 'Wagyu Ribeye Truffle Steak', quantity: 1, price: 349000 },
      { id: 'oi-2', name: 'Double Smokehouse Bacon Burger', quantity: 1, price: 165000 },
    ],
  },
  {
    id: 'ord-102',
    orderNumber: '#102',
    tableNumber: 'Table 01',
    tableId: 'tbl-1',
    status: 'READY',
    paymentStatus: 'PENDING',
    totalAmount: 220000,
    itemCount: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    items: [
      { id: 'oi-3', name: 'Black Truffle Burrata Pizza', quantity: 1, price: 220000 },
    ],
  },
  {
    id: 'ord-103',
    orderNumber: '#103',
    tableNumber: 'Table 07',
    tableId: 'tbl-7',
    status: 'SERVED',
    paymentStatus: 'PAID',
    totalAmount: 250000,
    itemCount: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    items: [
      { id: 'oi-4', name: 'Dragon Roll Flame-Torched Salmon', quantity: 1, price: 185000 },
      { id: 'oi-5', name: 'Citrus Sunset Passion Mocktail', quantity: 1, price: 65000 },
    ],
  },
  {
    id: 'ord-104',
    orderNumber: '#104',
    tableNumber: 'Table 05',
    tableId: 'tbl-5',
    status: 'PENDING',
    paymentStatus: 'PENDING',
    totalAmount: 444000,
    itemCount: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    items: [
      { id: 'oi-6', name: 'Double Smokehouse Bacon Burger', quantity: 2, price: 330000 },
      { id: 'oi-7', name: 'Molten Belgian Chocolate Lava Cake', quantity: 1, price: 95000 },
    ],
  },
];

// Local storage key for persistent custom items
const STORAGE_KEY = 'smartfood_custom_menu_items';

export function saveLocalMenuItems(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_ITEMS));
    }
  } catch (e) {
    console.warn("Could not save items to localStorage", e);
  }
}

export function loadLocalMenuItems(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge custom items into MOCK_ITEMS without losing newly added ones
          parsed.forEach((customItem: MenuItem) => {
            if (!MOCK_ITEMS.some(i => i.id === customItem.id)) {
              MOCK_ITEMS.unshift(customItem);
            }
          });
        }
      }
    }
  } catch (e) {
    console.warn("Could not load items from localStorage", e);
  }
}

// Automatically load persisted items on startup
loadLocalMenuItems();

