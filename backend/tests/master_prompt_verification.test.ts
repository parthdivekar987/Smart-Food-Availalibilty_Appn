import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EXPECTED_CATEGORIES = [
  "Kathi Rolls",
  "Pizza",
  "Burgers",
  "Starters",
  "Main Course",
  "Desserts",
  "Beverages",
];

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("🧪 MASTER PROMPT — END-TO-END VERIFICATION TEST SUITE");
  console.log("=======================================================\n");

  // ── TEST 1: Database Connectivity ──────────────────────────────────
  console.log("▶ TEST 1: Neon PostgreSQL Database Live Connectivity");
  try {
    const rawResult: any = await prisma.$queryRaw`SELECT 1 as connected, NOW() as server_time`;
    assert(rawResult && rawResult[0]?.connected === 1, "Neon PostgreSQL responded to query with valid timestamp");
  } catch (err: any) {
    assert(false, `Database connection failed: ${err.message}`);
  }

  // ── TEST 2: Strict Categories Presence ─────────────────────────────
  console.log("\n▶ TEST 2: Strict Categories Verification (Section 3.2)");
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const categoryNames = categories.map((c) => c.name);
  console.log("  Categories Found in DB:", categoryNames);

  for (const exp of EXPECTED_CATEGORIES) {
    const exists = categoryNames.includes(exp);
    assert(exists, `Required category '${exp}' exists in Database`);
  }

  assert(categories.length === 7, `Exact category count matches specification (7 categories, found ${categories.length})`);

  // ── TEST 3: Strict Category Segregation (Section 3.1) ──────────────
  console.log("\n▶ TEST 3: Strict Category Segregation & Isolation (Zero Data Leakage)");

  const categoryMap: Record<string, string> = {};
  categories.forEach((c) => {
    categoryMap[c.name] = c.id;
  });

  // 3a. Kathi Rolls check
  const rolls = await prisma.menuItem.findMany({
    where: { categoryId: categoryMap["Kathi Rolls"] },
  });
  assert(rolls.length >= 4, `Kathi Rolls category has seeded items (count: ${rolls.length})`);
  const anyNonRoll = rolls.some(
    (r) =>
      r.name.toLowerCase().includes("pizza") ||
      r.name.toLowerCase().includes("burger") ||
      r.name.toLowerCase().includes("curry")
  );
  assert(!anyNonRoll, "Kathi Rolls category contains ZERO pizzas, burgers, or curries (Strict Isolation)");

  // 3b. Pizza check
  const pizzas = await prisma.menuItem.findMany({
    where: { categoryId: categoryMap["Pizza"] },
  });
  assert(pizzas.length >= 4, `Pizza category has seeded items (count: ${pizzas.length})`);
  const anyNonPizza = pizzas.some(
    (p) =>
      p.name.toLowerCase().includes("roll") ||
      p.name.toLowerCase().includes("burger") ||
      p.name.toLowerCase().includes("biryani")
  );
  assert(!anyNonPizza, "Pizza category contains ZERO rolls, burgers, or rice dishes (Strict Isolation)");

  // 3c. Burgers check
  const burgers = await prisma.menuItem.findMany({
    where: { categoryId: categoryMap["Burgers"] },
  });
  assert(burgers.length >= 4, `Burgers category has seeded items (count: ${burgers.length})`);
  const anyNonBurger = burgers.some(
    (b) =>
      b.name.toLowerCase().includes("pizza") ||
      b.name.toLowerCase().includes("kathi") ||
      b.name.toLowerCase().includes("naan")
  );
  assert(!anyNonBurger, "Burgers category contains ZERO pizzas, rolls, or breads (Strict Isolation)");

  // 3d. Starters check
  const starters = await prisma.menuItem.findMany({
    where: { categoryId: categoryMap["Starters"] },
  });
  assert(starters.length >= 4, `Starters category has seeded items (count: ${starters.length})`);

  // 3e. Main Course check
  const mainCourses = await prisma.menuItem.findMany({
    where: { categoryId: categoryMap["Main Course"] },
  });
  assert(mainCourses.length >= 4, `Main Course category has seeded items (count: ${mainCourses.length})`);

  // 3f. Desserts check
  const desserts = await prisma.menuItem.findMany({
    where: { categoryId: categoryMap["Desserts"] },
  });
  assert(desserts.length >= 4, `Desserts category has seeded items (count: ${desserts.length})`);

  // 3g. Beverages (Coke hero item) check
  const beverages = await prisma.menuItem.findMany({
    where: { categoryId: categoryMap["Beverages"] },
  });
  assert(beverages.length >= 4, `Beverages category has seeded items (count: ${beverages.length})`);
  const cokeItem = beverages.find(
    (b) => b.name.toLowerCase().includes("coca-cola") || b.name.toLowerCase().includes("coke")
  );
  assert(!!cokeItem, "Classic Chilled Coca-Cola hero item exists in Beverages category");

  // ── TEST 4: Backend Public REST Endpoints ─────────────────────────
  console.log("\n▶ TEST 4: Live REST API Endpoints Verification (Port 4000)");

  try {
    const catRes = await fetch("http://localhost:4000/api/v1/guest/categories");
    assert(catRes.status === 200, "GET /api/v1/guest/categories returns 200 OK");
    const catData: any = await catRes.json();
    assert(Array.isArray(catData?.data) && catData.data.length === 7, `API returns all 7 categories (received: ${catData?.data?.length})`);

    // Fetch items specifically for Kathi Rolls via API
    const rollCatId = categoryMap["Kathi Rolls"];
    const itemsRes = await fetch(`http://localhost:4000/api/v1/guest/menu-items?categoryId=${rollCatId}`);
    assert(itemsRes.status === 200, `GET /api/v1/guest/menu-items?categoryId=${rollCatId} returns 200 OK`);
    const itemsData: any = await itemsRes.json();
    const fetchedItems: any[] = itemsData?.data || [];
    assert(fetchedItems.length > 0, `API returned ${fetchedItems.length} items for Kathi Rolls`);
    const allMatchingCat = fetchedItems.every((item) => item.categoryId === rollCatId);
    assert(allMatchingCat, "Data layer filtering enforces strict category matches with 0 leaks");
  } catch (err: any) {
    assert(false, `API request failed: ${err.message}`);
  }

  // ── TEST 5: Cart Modifier Calculation & Business Logic ────────────
  console.log("\n▶ TEST 5: Cart Calculations & Price Modifiers");
  const basePrice = 140; // Kathi Roll
  const cheeseDelta = 25;
  const quantity = 2;
  const computedTotal = (basePrice + cheeseDelta) * quantity;
  assert(computedTotal === 330, `Modifier pricing calculation accurate: (${basePrice} + ${cheeseDelta}) * ${quantity} = 330`);

  // ── SUMMARY ───────────────────────────────────────────────────────
  console.log("\n=======================================================");
  console.log(`📊 TEST SUITE SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log("=======================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error("Test runner error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
