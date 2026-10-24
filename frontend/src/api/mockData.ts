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

// ─── MASTER PROMPT STRICT CATEGORIES ─────────────────────────────────
export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-kathi-rolls', name: 'Kathi Rolls', menuItems: [] },
  { id: 'cat-pizza', name: 'Pizza', menuItems: [] },
  { id: 'cat-burgers', name: 'Burgers', menuItems: [] },
  { id: 'cat-starters', name: 'Starters', menuItems: [] },
  { id: 'cat-main-course', name: 'Main Course', menuItems: [] },
  { id: 'cat-desserts', name: 'Desserts', menuItems: [] },
  { id: 'cat-beverages', name: 'Beverages', menuItems: [] },
];

// ─── MASTER PROMPT STRICT MENU ITEMS (Zero Cross-Category Leaks) ─────
export const MOCK_ITEMS: MenuItem[] = [
  // ── 1. KATHI ROLLS ──
  {
    id: 'roll-1',
    categoryId: 'cat-kathi-rolls',
    name: 'Paneer Tikka Kathi Roll',
    price: 140,
    description: 'Soft buttered roomali roti rolled with smoky tandoori paneer, crunchy bell peppers, onions, and zesty mint chutney.',
    prepTime: 10,
    status: 'AVAILABLE',
    isChefRecommended: true,
    photos: [{ id: 'pr-1', menuItemId: 'roll-1', url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [
      {
        id: 'mg-r1',
        name: 'Wrap & Addons',
        required: false,
        options: [
          { id: 'opt-r1', name: 'Lachha Paratha Wrap', priceDelta: 15 },
          { id: 'opt-r2', name: 'Extra Mint Chutney', priceDelta: 10 },
          { id: 'opt-r3', name: 'Melted Amul Cheese Slice', priceDelta: 25 },
        ],
      },
    ],
  },
  {
    id: 'roll-2',
    categoryId: 'cat-kathi-rolls',
    name: 'Kolkata Double Egg Chicken Roll',
    price: 180,
    description: 'Authentic Kolkata street style paratha layered with beaten egg, juicy spiced chicken boti, sliced onions, and green chillies.',
    prepTime: 12,
    status: 'AVAILABLE',
    isChefRecommended: true,
    photos: [{ id: 'pr-2', menuItemId: 'roll-2', url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [],
  },
  {
    id: 'roll-3',
    categoryId: 'cat-kathi-rolls',
    name: 'Mutton Seekh Kebab Roll',
    price: 220,
    description: 'Tender minced lamb seekh grilled on charcoal skewers, wrapped in flaky paratha with lemon-tossed onion rings.',
    prepTime: 15,
    status: 'AVAILABLE',
    isChefRecommended: false,
    photos: [{ id: 'pr-3', menuItemId: 'roll-3', url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [],
  },
  {
    id: 'roll-4',
    categoryId: 'cat-kathi-rolls',
    name: 'Crunchy Veggie Mayo Roll',
    price: 120,
    description: 'Crisp spiced vegetable patty wrapped in toasted paratha with shredded cabbage, carrots, sweet corn, and house herb mayo.',
    prepTime: 10,
    status: 'AVAILABLE',
    isChefRecommended: false,
    photos: [{ id: 'pr-4', menuItemId: 'roll-4', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [],
  },

  // ── 2. PIZZA ──
  {
    id: 'pizza-1',
    categoryId: 'cat-pizza',
    name: 'Black Truffle Burrata Pizza',
    price: 420,
    description: 'Wood-fired sourdough crust, fior di latte, creamy Italian burrata, shaved summer truffles, and wild arugula.',
    prepTime: 15,
    status: 'AVAILABLE',
    isChefRecommended: true,
    photos: [{ id: 'pp-1', menuItemId: 'pizza-1', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [
      {
        id: 'mg-p1',
        name: 'Crust Preference',
        required: false,
        options: [
          { id: 'opt-p1', name: 'Extra Virgin Truffle Oil', priceDelta: 30 },
          { id: 'opt-p2', name: 'Stuffed Garlic Cheese Crust', priceDelta: 50 },
        ],
      },
    ],
  },
  {
    id: 'pizza-2',
    categoryId: 'cat-pizza',
    name: 'Wood-Fired Margherita Basil Pizza',
    price: 260,
    description: 'Classic San Marzano tomato sauce, fresh buffalo mozzarella, extra virgin olive oil, and sweet basil leaves.',
    prepTime: 14,
    status: 'AVAILABLE',
    isChefRecommended: false,
    photos: [{ id: 'pp-2', menuItemId: 'pizza-2', url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [],
  },
  {
    id: 'pizza-3',
    categoryId: 'cat-pizza',
    name: 'Tandoori Chicken Tikka Feast Pizza',
    price: 380,
    description: 'Crispy thin crust topped with spicy tandoori chicken tikka, red paprika, charred red onions, and gooey mozzarella.',
    prepTime: 16,
    status: 'AVAILABLE',
    isChefRecommended: true,
    photos: [{ id: 'pp-3', menuItemId: 'pizza-3', url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [],
  },
  {
    id: 'pizza-4',
    categoryId: 'cat-pizza',
    name: 'Paneer Makhani Fusion Pizza',
    price: 320,
    description: 'Makhani gravy base, marinated cottage cheese cubes, capsicum, red onions, and melted mozzarella on stone-baked crust.',
    prepTime: 15,
    status: 'AVAILABLE',
    isChefRecommended: false,
    photos: [{ id: 'pp-4', menuItemId: 'pizza-4', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [],
  },

  // ── 3. BURGERS ──
  {
    id: 'burger-1',
    categoryId: 'cat-burgers',
    name: 'Double Smokehouse Bacon Burger',
    price: 280,
    description: 'Twin Angus beef patties, molten sharp cheddar, maple wood-smoked bacon, and caramelized onion relish on toasted brioche.',
    prepTime: 14,
    status: 'AVAILABLE',
    isChefRecommended: true,
    photos: [{ id: 'pb-1', menuItemId: 'burger-1', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [
      {
        id: 'mg-b1',
        name: 'Sides & Fries',
        required: false,
        options: [
          { id: 'opt-b1', name: 'Truffle Parmesan Fries', priceDelta: 45 },
          { id: 'opt-b2', name: 'Classic Crispy Fries', priceDelta: 25 },
        ],
      },
    ],
  },
  {
    id: 'burger-2',
    categoryId: 'cat-burgers',
    name: 'Mumbai Crispy Aloo Tikki Burger',
    price: 90,
    description: 'Golden crunchy spiced potato patty in toasted sesame bun with tamarind chutney, mint spread, and crisp iceberg lettuce.',
    prepTime: 10,
    status: 'AVAILABLE',
    isChefRecommended: true,
    photos: [{ id: 'pb-2', menuItemId: 'burger-2', url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [],
  },
  {
    id: 'burger-3',
    categoryId: 'cat-burgers',
    name: 'Crispy Fried Chicken Zinger Burger',
    price: 220,
    description: 'Buttermilk battered extra crispy chicken fillet, spicy sriracha mayo, iceberg lettuce, and dill pickles on brioche bun.',
    prepTime: 12,
    status: 'AVAILABLE',
    isChefRecommended: true,
    photos: [{ id: 'pb-3', menuItemId: 'burger-3', url: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [],
  },
  {
    id: 'burger-4',
    categoryId: 'cat-burgers',
    name: 'Gourmet Truffle Mushroom Melt Burger',
    price: 240,
    description: 'Charbroiled beef patty smothered in sautéed wild mushrooms, Swiss cheese, and black truffle garlic aioli.',
    prepTime: 15,
    status: 'AVAILABLE',
    isChefRecommended: false,
    photos: [{ id: 'pb-4', menuItemId: 'burger-4', url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [],
  },

  // ── 4. STARTERS ──
  {
    id: 'starter-1',
    categoryId: 'cat-starters',
    name: 'Crispy Samosa Plate with Chutneys (2 Pcs)',
    price: 70,
    description: 'Golden flaky triangular pastries stuffed with spiced potatoes, green peas and whole cumin, served with saunth and mint chutney.',
    prepTime: 10,
    status: 'AVAILABLE',
    isChefRecommended: true,
    photos: [{ id: 'ps-1', menuItemId: 'starter-1', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [
      {
        id: 'mg-s1',
        name: 'Chutneys',
        required: false,
        options: [
          { id: 'opt-s1', name: 'Extra Sweet Tamarind Chutney', priceDelta: 10 },
          { id: 'opt-s2', name: 'Spicy Mint Coriander Chutney', priceDelta: 10 },
        ],
      },
    ],
  },
  {
    id: 'starter-2',
    categoryId: 'cat-starters',
    name: 'Dilli Wali Aloo Tikki Chaat',
    price: 90,
    description: 'Pan-grilled spiced potato patties topped with beaten sweet curd, zesty tamarind glaze, sev, and pomegranate seeds.',
    prepTime: 10,
    status: 'AVAILABLE',
    isChefRecommended: true,
    photos: [{ id: 'ps-2', menuItemId: 'starter-2', url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [],
  },
  {
    id: 'starter-3',
    categoryId: 'cat-starters',
    name: 'Amritsari Paneer Tikka',
    price: 240,
    description: 'Fresh cottage cheese cubes marinated in carom seeds, Kashmiri red chilli paste, and hung curd, roasted in clay oven.',
    prepTime: 15,
    status: 'AVAILABLE',
    isChefRecommended: true,
    photos: [{ id: 'ps-3', menuItemId: 'starter-3', url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [],
  },
  {
    id: 'starter-4',
    categoryId: 'cat-starters',
    name: 'Tandoori Murgh Tikka',
    price: 290,
    description: 'Succulent boneless chicken chunks marinated in aromatic Punjabi spices and char-grilled over flaming tandoor embers.',
    prepTime: 18,
    status: 'AVAILABLE',
    isChefRecommended: true,
    photos: [{ id: 'ps-4', menuItemId: 'starter-4', url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [],
  },
  {
    id: 'starter-5',
    categoryId: 'cat-starters',
    name: 'Hara Bhara Kebab (6 Pcs)',
    price: 180,
    description: 'Nutritious pan-fried patties of spinach, green peas, mashed potatoes and cottage cheese centered with cashew nuts.',
    prepTime: 12,
    status: 'AVAILABLE',
    isChefRecommended: false,
    photos: [{ id: 'ps-5', menuItemId: 'starter-5', url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [],
  },

  // ── 5. MAIN COURSE ──
  {
    id: 'main-1',
    categoryId: 'cat-main-course',
    name: 'Delhi Style Butter Chicken (Murgh Makhani)',
    price: 360,
    description: 'Char-roasted shredded tandoori chicken simmered in rich satin-smooth tomato, cashew cream gravy and hand-churned butter.',
    prepTime: 20,
    status: 'AVAILABLE',
    isChefRecommended: true,
    photos: [{ id: 'pm-1', menuItemId: 'main-1', url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [
      {
        id: 'mg-m1',
        name: 'Handi Size',
        required: false,
        options: [
          { id: 'opt-m1', name: 'Regular Handi', priceDelta: 0 },
          { id: 'opt-m2', name: 'Family Handi (Feeds 3)', priceDelta: 160 },
        ],
      },
    ],
  },
  {
    id: 'main-2',
    categoryId: 'cat-main-course',
    name: 'Shahi Paneer Butter Masala',
    price: 310,
    description: 'Cottage cheese squares cooked in a luscious royal gravy of cashews, tomatoes, and aromatic whole spices.',
    prepTime: 18,
    status: 'AVAILABLE',
    isChefRecommended: true,
    photos: [{ id: 'pm-2', menuItemId: 'main-2', url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [],
  },
  {
    id: 'main-3',
    categoryId: 'cat-main-course',
    name: 'Dal Makhani Bukhara Style',
    price: 260,
    description: 'Black lentils slow-cooked overnight with cream, fresh butter, and roasted cumin on charcoal embers.',
    prepTime: 15,
    status: 'AVAILABLE',
    isChefRecommended: true,
    photos: [{ id: 'pm-3', menuItemId: 'main-3', url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [],
  },
  {
    id: 'main-4',
    categoryId: 'cat-main-course',
    name: 'Hyderabadi Dum Chicken Biryani',
    price: 340,
    description: 'Fragrant long-grain aged basmati rice layered with spiced marinated chicken, saffron, brown onions, and fresh mint.',
    prepTime: 22,
    status: 'AVAILABLE',
    isChefRecommended: true,
    photos: [{ id: 'pm-4', menuItemId: 'main-4', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [],
  },
  {
    id: 'main-5',
    categoryId: 'cat-main-course',
    name: 'Butter Garlic Naan',
    price: 60,
    description: 'Tandoor-baked leavened flatbread brushed with crushed roasted garlic and melted dairy butter.',
    prepTime: 8,
    status: 'AVAILABLE',
    isChefRecommended: false,
    photos: [{ id: 'pm-5', menuItemId: 'main-5', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [],
  },

  // ── 6. DESSERTS ──
  {
    id: 'dessert-1',
    categoryId: 'cat-desserts',
    name: 'Royal Angoori Gulab Jamun (3 Pcs)',
    price: 110,
    description: 'Soft melt-in-mouth milk-solid dumplings soaked in warm rosewater and green cardamom sugar syrup with pistachio dust.',
    prepTime: 6,
    status: 'AVAILABLE',
    isChefRecommended: true,
    photos: [{ id: 'pd-1', menuItemId: 'dessert-1', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [],
  },
  {
    id: 'dessert-2',
    categoryId: 'cat-desserts',
    name: 'Molten Belgian Chocolate Lava Cake',
    price: 180,
    description: 'Warm dark chocolate cake with a rich liquid ganache center, paired with Madagascar vanilla bean gelato.',
    prepTime: 12,
    status: 'AVAILABLE',
    isChefRecommended: true,
    photos: [{ id: 'pd-2', menuItemId: 'dessert-2', url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [],
  },
  {
    id: 'dessert-3',
    categoryId: 'cat-desserts',
    name: 'Kesar Pista Matka Kulfi',
    price: 130,
    description: 'Traditional dense and creamy slow-cooked Indian ice cream infused with saffron strands and crushed pistachios.',
    prepTime: 5,
    status: 'AVAILABLE',
    isChefRecommended: false,
    photos: [{ id: 'pd-3', menuItemId: 'dessert-3', url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [],
  },
  {
    id: 'dessert-4',
    categoryId: 'cat-desserts',
    name: 'Chilled Rasmalai with Saffron Milk (2 Pcs)',
    price: 140,
    description: 'Delicate cottage cheese patties immersed in chilled clotted saffron cream milk garnished with sliced almonds.',
    prepTime: 5,
    status: 'AVAILABLE',
    isChefRecommended: true,
    photos: [{ id: 'pd-4', menuItemId: 'dessert-4', url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [],
  },

  // ── 7. BEVERAGES ──
  {
    id: 'bev-coke',
    categoryId: 'cat-beverages',
    name: 'Classic Chilled Coca-Cola',
    price: 60,
    description: 'Ice-cold refreshing Coca-Cola poured over crystalline ice cubes with a fresh slice of lemon, effervescent fizz, and cold condensation.',
    prepTime: 3,
    status: 'AVAILABLE',
    isChefRecommended: true,
    photos: [{ id: 'pbev-1', menuItemId: 'bev-coke', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [
      {
        id: 'mg-coke',
        name: 'Serving Style',
        required: false,
        options: [
          { id: 'opt-c1', name: 'Chilled Glass with Ice & Lemon', priceDelta: 0 },
          { id: 'opt-c2', name: 'Can Only (Unopened)', priceDelta: 0 },
        ],
      },
    ],
  },
  {
    id: 'bev-2',
    categoryId: 'cat-beverages',
    name: 'Royal Alphonso Mango Lassi',
    price: 110,
    description: 'Thick and creamy churned yogurt blended with ripe Ratnagiri Alphonso mango pulp and cardamom.',
    prepTime: 6,
    status: 'AVAILABLE',
    isChefRecommended: true,
    photos: [{ id: 'pbev-2', menuItemId: 'bev-2', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [],
  },
  {
    id: 'bev-3',
    categoryId: 'cat-beverages',
    name: 'Kulhad Masala Chai',
    price: 50,
    description: 'Steaming Indian street tea brewed with crushed ginger, green cardamom, cinnamon, and whole milk in an earthen clay cup.',
    prepTime: 8,
    status: 'AVAILABLE',
    isChefRecommended: false,
    photos: [{ id: 'pbev-3', menuItemId: 'bev-3', url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [],
  },
  {
    id: 'bev-4',
    categoryId: 'cat-beverages',
    name: 'Citrus Sunset Passion Mocktail',
    price: 130,
    description: 'Fresh squeezed passionfruit puree, ruby blood orange, mint leaves, crushed ice and bubbly club soda.',
    prepTime: 5,
    status: 'AVAILABLE',
    isChefRecommended: false,
    photos: [{ id: 'pbev-4', menuItemId: 'bev-4', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [],
  },
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
    email: 'chef.sanjeev@restaurant.com',
    fullName: 'Chef Sanjeev Kumar',
    role: Role.KITCHEN,
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&w=200&q=80',
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
    isActive: true,
  },
  {
    id: 'emp-3',
    email: 'amit.waiter@restaurant.com',
    fullName: 'Amit Sharma',
    role: Role.WAITER,
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    isActive: true,
  },
  {
    id: 'emp-4',
    email: 'ananya.manager@restaurant.com',
    fullName: 'Ananya Deshmukh',
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
      { id: 'oi-1', name: 'Delhi Style Butter Chicken', quantity: 1, price: 360 },
      { id: 'oi-2', name: 'Double Smokehouse Bacon Burger', quantity: 1, price: 280 },
    ],
  },
  {
    id: 'ord-102',
    orderNumber: '#102',
    tableNumber: 'Table 01',
    tableId: 'tbl-1',
    status: 'READY',
    paymentStatus: 'PENDING',
    totalAmount: 420000,
    itemCount: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    items: [
      { id: 'oi-3', name: 'Black Truffle Burrata Pizza', quantity: 1, price: 420 },
    ],
  },
];

// Local storage key for persistent custom items
const STORAGE_KEY = 'smartfood_custom_menu_items_v2';

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

loadLocalMenuItems();
