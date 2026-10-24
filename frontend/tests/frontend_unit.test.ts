import { useCartStore } from '../src/store/useCartStore';
import { MOCK_CATEGORIES, MOCK_ITEMS } from '../src/api/mockData';
import { MenuItem } from '../src/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${name}`);
    failed++;
  }
}

console.log("\n=======================================================");
console.log("🧪 FRONTEND UNIT TESTS — STORES, CART & DATA MODELS");
console.log("=======================================================\n");

// ── TEST 1: Cart Store Initialization ────────────────────────────────
console.log("▶ TEST 1: Cart Store Initial State");
const store = useCartStore.getState();
store.clearCart();
assert(useCartStore.getState().items.length === 0, "Cart starts empty after clearCart()");
assert(useCartStore.getState().totalAmount() === 0, "Initial cart totalAmount() is 0");

// ── TEST 2: Add Item Without Modifiers ────────────────────────────────
console.log("\n▶ TEST 2: Add Item to Cart (Base Price)");
const sampleRoll: MenuItem = {
  id: 'test-roll-1',
  categoryId: 'cat-kathi-rolls',
  name: 'Test Paneer Roll',
  price: 140,
  prepTime: 10,
  status: 'AVAILABLE',
  isChefRecommended: true,
  photos: [],
  modifierGroups: [],
};

store.addToCart(sampleRoll, 2, {});
const stateAfterAdd = useCartStore.getState();
assert(stateAfterAdd.items.length === 1, "Cart contains 1 item entry");
assert(stateAfterAdd.items[0].quantity === 2, "Item quantity is correctly set to 2");
assert(stateAfterAdd.items[0].totalPrice === 140, "Item unit price is 140");
assert(stateAfterAdd.totalAmount() === 280, "Cart totalAmount is 2 * 140 = 280");

// ── TEST 3: Add Item With Modifiers (Price Delta) ─────────────────────
console.log("\n▶ TEST 3: Add Item with Custom Modifiers (Price Deltas)");
const sampleBurger: MenuItem = {
  id: 'test-burger-1',
  categoryId: 'cat-burgers',
  name: 'Test Truffle Burger',
  price: 240,
  prepTime: 12,
  status: 'AVAILABLE',
  isChefRecommended: true,
  photos: [],
  modifierGroups: [],
};

const burgerModifiers = {
  fries: [{ id: 'opt-fries', name: 'Truffle Fries', priceDelta: 45 }],
  cheese: [{ id: 'opt-cheese', name: 'Extra Cheddar', priceDelta: 30 }],
};

store.addToCart(sampleBurger, 1, burgerModifiers);
const stateWithBurger = useCartStore.getState();
assert(stateWithBurger.items.length === 2, "Cart now contains 2 distinct item entries");

// 240 + 45 + 30 = 315 unit price
const burgerEntry = stateWithBurger.items.find(i => i.id === 'test-burger-1');
assert(burgerEntry?.totalPrice === 315, "Burger unit price with modifiers is 240 + 45 + 30 = 315");
assert(stateWithBurger.totalAmount() === 280 + 315, "Cart grand total equals 280 + 315 = 595");

// ── TEST 4: Quantity Increment & Duplicate Merge ──────────────────────
console.log("\n▶ TEST 4: Duplicate Item Merging with Identical Modifiers");
store.addToCart(sampleBurger, 1, burgerModifiers);
const stateMerged = useCartStore.getState();
assert(stateMerged.items.length === 2, "Duplicate item with identical modifiers did NOT create duplicate entry");
const updatedBurgerEntry = stateMerged.items.find(i => i.id === 'test-burger-1');
assert(updatedBurgerEntry?.quantity === 2, "Existing item quantity merged to 2");

// ── TEST 5: Remove from Cart ─────────────────────────────────────────
console.log("\n▶ TEST 5: Remove Item from Cart");
if (updatedBurgerEntry) {
  store.removeFromCart(updatedBurgerEntry.cartItemId);
}
assert(useCartStore.getState().items.length === 1, "Item successfully removed from cart");
assert(useCartStore.getState().totalAmount() === 280, "Cart total updated after removal");

// ── TEST 6: Strict Category Segregation in Mock Data ─────────────────
console.log("\n▶ TEST 6: Frontend Mock Data Strict Category Segregation");
assert(MOCK_CATEGORIES.length === 7, `MOCK_CATEGORIES contains exactly 7 categories (found: ${MOCK_CATEGORIES.length})`);

const expectedSlugs = [
  'cat-kathi-rolls',
  'cat-pizza',
  'cat-burgers',
  'cat-starters',
  'cat-main-course',
  'cat-desserts',
  'cat-beverages'
];

for (const slug of expectedSlugs) {
  const items = MOCK_ITEMS.filter(i => i.categoryId === slug);
  assert(items.length >= 4, `Category '${slug}' contains at least 4 items (found: ${items.length})`);
  
  // Verify strict isolation
  if (slug === 'cat-kathi-rolls') {
    assert(items.every(i => !i.name.toLowerCase().includes('pizza') && !i.name.toLowerCase().includes('burger')), "Kathi rolls category contains 0 pizzas or burgers");
  }
  if (slug === 'cat-pizza') {
    assert(items.every(i => !i.name.toLowerCase().includes('roll') && !i.name.toLowerCase().includes('burger')), "Pizza category contains 0 rolls or burgers");
  }
  if (slug === 'cat-beverages') {
    const hasCoke = items.some(i => i.name.toLowerCase().includes('coke') || i.name.toLowerCase().includes('coca-cola'));
    assert(hasCoke, "Beverages category contains Classic Chilled Coca-Cola hero item");
  }
}

// ── SUMMARY ──────────────────────────────────────────────────────────
console.log("\n=======================================================");
console.log(`📊 FRONTEND UNIT TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("=======================================================\n");

if (failed > 0) {
  process.exit(1);
}
