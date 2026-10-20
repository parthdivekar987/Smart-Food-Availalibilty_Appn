import { PrismaClient, Role, MenuItemStatus, OrderStatus, PaymentMethod, PaymentStatus, TableSessionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Indian Restaurant Realistic Database Seed...");

  // 1. CLEANUP OLD DATA
  console.log("🧹 Cleaning up old data...");
  try {
    await prisma.payment.deleteMany();
    await prisma.orderItemModifier.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.tableSession.deleteMany();
    await prisma.review.deleteMany();
    await prisma.menuItemPhoto.deleteMany();
    await prisma.modifierOption.deleteMany();
    await prisma.modifierGroup.deleteMany();
    await prisma.menuItem.deleteMany();
    await prisma.category.deleteMany();
    await prisma.table.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.user.deleteMany();
    console.log("✅ Previous data cleaned successfully.");
  } catch (error) {
    console.warn("⚠️ Cleanup warning (continuing):", error);
  }

  const defaultPasswordHash = await bcrypt.hash("123456", 10);

  // 2. CREATE RESTAURANT
  const restaurant = await prisma.restaurant.create({
    data: {
      name: "The Royal Indian Rasoi & Fast Food",
      address: "Plot 42, Food Street, Indiranagar, Bengaluru, Karnataka 560038",
    },
  });
  console.log(`🏰 Restaurant created: ${restaurant.name}`);

  // 3. CREATE USERS ACROSS ALL ROLES
  console.log("👥 Creating users across all operational roles...");
  const superAdmin = await prisma.user.create({
    data: {
      email: "admin@restaurant.com",
      password: defaultPasswordHash,
      fullName: "Vikramaditya Singhania (Super Admin)",
      role: Role.SUPER_ADMIN,
      isVerified: true,
      isActive: true,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: "manager@restaurant.com",
      password: defaultPasswordHash,
      fullName: "Ananya Deshmukh (Restaurant Manager)",
      role: Role.ADMIN,
      isVerified: true,
      isActive: true,
    },
  });

  const chef1 = await prisma.user.create({
    data: {
      email: "kitchen@restaurant.com",
      password: defaultPasswordHash,
      fullName: "Chef Sanjeev Kumar (Head Chef)",
      role: Role.KITCHEN,
      isVerified: true,
      isActive: true,
    },
  });

  const chef2 = await prisma.user.create({
    data: {
      email: "chef.rahul@restaurant.com",
      password: defaultPasswordHash,
      fullName: "Chef Rahul Verma (Tandoor & Curry Specialist)",
      role: Role.KITCHEN,
      isVerified: true,
      isActive: true,
    },
  });

  const waiter1 = await prisma.user.create({
    data: {
      email: "waiter@restaurant.com",
      password: defaultPasswordHash,
      fullName: "Amit Sharma (Lead Waiter)",
      role: Role.WAITER,
      isVerified: true,
      isActive: true,
    },
  });

  const waiter2 = await prisma.user.create({
    data: {
      email: "waiter.rohit@restaurant.com",
      password: defaultPasswordHash,
      fullName: "Rohit Nair (Floor Staff)",
      role: Role.WAITER,
      isVerified: true,
      isActive: true,
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      email: "customer@restaurant.com",
      password: defaultPasswordHash,
      fullName: "Priya Patel",
      role: Role.CUSTOMER,
      isVerified: true,
      isActive: true,
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: "aarav.sharma@example.com",
      password: defaultPasswordHash,
      fullName: "Aarav Sharma",
      role: Role.CUSTOMER,
      isVerified: true,
      isActive: true,
    },
  });

  const customer3 = await prisma.user.create({
    data: {
      email: "neha.gupta@example.com",
      password: defaultPasswordHash,
      fullName: "Neha Gupta",
      role: Role.CUSTOMER,
      isVerified: true,
      isActive: true,
    },
  });

  // Additional customers
  const extraCustomers = [];
  for (let i = 4; i <= 15; i++) {
    extraCustomers.push({
      email: `foodlover${i}@example.com`,
      password: defaultPasswordHash,
      fullName: `Guest Foodie ${i}`,
      role: Role.CUSTOMER,
      isVerified: true,
      isActive: true,
    });
  }
  await prisma.user.createMany({ data: extraCustomers });
  const allCustomers = await prisma.user.findMany({ where: { role: Role.CUSTOMER } });

  console.log(`✅ Created roles: 1 Super Admin, 1 Manager, 2 Kitchen Chefs, 2 Waiters, ${allCustomers.length} Customers`);

  // 4. CREATE TABLES WITH ASSIGNED WAITERS
  console.log("🪑 Creating restaurant dining tables...");
  const tableConfigs = [
    { name: "Table 1 (Indoor Window)", capacity: 2, waiterId: waiter1.id },
    { name: "Table 2 (Indoor Window)", capacity: 2, waiterId: waiter1.id },
    { name: "Table 3 (Family Booth)", capacity: 4, waiterId: waiter1.id },
    { name: "Table 4 (Family Booth)", capacity: 4, waiterId: waiter1.id },
    { name: "Table 5 (Royal Courtyard)", capacity: 6, waiterId: waiter1.id },
    { name: "Table 6 (Royal Courtyard)", capacity: 6, waiterId: waiter1.id },
    { name: "Table 7 (Garden Terrace)", capacity: 4, waiterId: waiter2.id },
    { name: "Table 8 (Garden Terrace)", capacity: 4, waiterId: waiter2.id },
    { name: "Table 9 (Garden High Table)", capacity: 2, waiterId: waiter2.id },
    { name: "Table 10 (Garden High Table)", capacity: 2, waiterId: waiter2.id },
    { name: "Table 11 (VIP Maharaja Suite)", capacity: 8, waiterId: waiter2.id },
    { name: "Table 12 (VIP Maharaja Suite)", capacity: 10, waiterId: waiter2.id },
  ];

  const createdTables = [];
  for (const tc of tableConfigs) {
    const table = await prisma.table.create({
      data: {
        name: tc.name,
        capacity: tc.capacity,
        restaurantId: restaurant.id,
        waiterId: tc.waiterId,
        isActive: true,
        qrSecret: `secret-table-${tc.name.replace(/[^a-zA-Z0-9]/g, "")}`,
        qrVersion: 1,
      },
    });
    createdTables.push(table);
  }
  console.log(`✅ Created ${createdTables.length} tables with waiter mappings.`);

  // 5. CREATE CATEGORIES & REALISTIC INDIAN FOOD MENU (WITH JUNK FOOD ORIGINS)
  console.log("🍛 Creating Indian & Fast Food Categories and Menu Items...");

  interface SeedMenuItem {
    name: string;
    description: string;
    price: number;
    prepTime: number;
    isChefRecommended: boolean;
    photoUrl: string;
    modifiers?: {
      name: string;
      required: boolean;
      options: { name: string; priceDelta: number }[];
    }[];
  }

  const menuCatalog: { categoryName: string; items: SeedMenuItem[] }[] = [
    {
      categoryName: "🍲 Starters & Street Chaat",
      items: [
        {
          name: "Crispy Samosa Plate (2 Pcs)",
          description: "Golden flaky pastry stuffed with spiced potatoes, green peas and whole cumin, served with saunth and mint chutney.",
          price: 70,
          prepTime: 10,
          isChefRecommended: true,
          photoUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
          modifiers: [
            {
              name: "Chutney Choice",
              required: false,
              options: [
                { name: "Extra Mint Chutney", priceDelta: 10 },
                { name: "Extra Sweet Tamarind Chutney", priceDelta: 10 },
                { name: "Add Curd & Chaat Masala", priceDelta: 20 },
              ],
            },
          ],
        },
        {
          name: "Dilli Wali Aloo Tikki Chaat",
          description: "Pan-grilled spiced potato patties topped with beaten sweet curd, zesty tamarind glaze, sev, and pomegranate seeds.",
          price: 90,
          prepTime: 12,
          isChefRecommended: true,
          photoUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
        },
        {
          name: "Amritsari Paneer Tikka",
          description: "Fresh cottage cheese cubes marinated in carom seeds, Kashmiri red chilli paste, and hung curd, roasted in clay oven.",
          price: 240,
          prepTime: 15,
          isChefRecommended: true,
          photoUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&auto=format&fit=crop&q=80",
          modifiers: [
            {
              name: "Spice Preference",
              required: false,
              options: [
                { name: "Medium Spiced", priceDelta: 0 },
                { name: "Desi Extra Spicy", priceDelta: 0 },
                { name: "Add Lemon Butter Glaze", priceDelta: 25 },
              ],
            },
          ],
        },
        {
          name: "Tandoori Murgh Tikka",
          description: "Succulent boneless chicken chunks marinated in aromatic Punjabi spices and char-grilled over flaming tandoor embers.",
          price: 290,
          prepTime: 18,
          isChefRecommended: true,
          photoUrl: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80",
        },
        {
          name: "Hara Bhara Kebab (6 Pcs)",
          description: "Nutritious pan-fried patties of spinach, green peas, mashed potatoes and cottage cheese centered with cashew nuts.",
          price: 180,
          prepTime: 12,
          isChefRecommended: false,
          photoUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80",
        },
      ],
    },
    {
      categoryName: "🍛 Indian Curries & Gravies",
      items: [
        {
          name: "Delhi Style Butter Chicken (Murgh Makhani)",
          description: "Char-roasted shredded tandoori chicken simmered in rich satin-smooth tomato, cashew cream gravy and hand-churned butter.",
          price: 360,
          prepTime: 20,
          isChefRecommended: true,
          photoUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80",
          modifiers: [
            {
              name: "Portion Size",
              required: true,
              options: [
                { name: "Regular (2-3 pcs)", priceDelta: 0 },
                { name: "Large Handi (5-6 pcs)", priceDelta: 160 },
              ],
            },
            {
              name: "Extra Richness",
              required: false,
              options: [
                { name: "Extra Butter & Cream Dollop", priceDelta: 30 },
              ],
            },
          ],
        },
        {
          name: "Paneer Butter Masala",
          description: "Soft malai paneer cubes cooked in aromatic spiced onion-tomato gravy with kasuri methi and generous fresh cream.",
          price: 280,
          prepTime: 15,
          isChefRecommended: true,
          photoUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80",
          modifiers: [
            {
              name: "Preparation Style",
              required: false,
              options: [
                { name: "Mild & Creamy", priceDelta: 0 },
                { name: "Spicy Dhaba Style", priceDelta: 0 },
                { name: "Extra Paneer Cubes", priceDelta: 50 },
              ],
            },
          ],
        },
        {
          name: "Dhabewali Dal Makhani (Slow Cooked 18 Hrs)",
          description: "Whole black lentils and kidney beans slow-cooked overnight with ginger, garlic, tomatoes and finished with pure white butter.",
          price: 220,
          prepTime: 12,
          isChefRecommended: true,
          photoUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80",
        },
        {
          name: "Kadhai Paneer Special",
          description: "Paneer cubes tossed with crunchy bell peppers, whole coriander seeds, onions and spicy kadhai masala gravy.",
          price: 270,
          prepTime: 16,
          isChefRecommended: false,
          photoUrl: "https://images.unsplash.com/photo-1628294895950-9805252327bc?w=600&auto=format&fit=crop&q=80",
        },
        {
          name: "Kashmiri Mutton Rogan Josh",
          description: "Tender goat meat slow-cooked in aromatic gravy infused with Kashmiri red chillies, fennel powder and dry ginger.",
          price: 440,
          prepTime: 25,
          isChefRecommended: true,
          photoUrl: "https://images.unsplash.com/photo-1545247181-516773cae7be?w=600&auto=format&fit=crop&q=80",
        },
        {
          name: "Amritsari Chole Masala",
          description: "Plump chickpeas stewed with tea leaves, roasted cumin, amchur and whole spices in authentic Punjabi style.",
          price: 190,
          prepTime: 14,
          isChefRecommended: false,
          photoUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&auto=format&fit=crop&q=80",
        },
      ],
    },
    {
      categoryName: "🍚 Dum Biryani & Rice",
      items: [
        {
          name: "Hyderabadi Dum Chicken Biryani",
          description: "Fragrant long-grain aged Basmati rice layered with spiced marinated chicken and saffron milk, slow-cooked in sealed clay pot.",
          price: 320,
          prepTime: 20,
          isChefRecommended: true,
          photoUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
          modifiers: [
            {
              name: "Portion",
              required: true,
              options: [
                { name: "Single Serve (with 1 Egg & Salan)", priceDelta: 0 },
                { name: "Jumbo Handi (Serves 2-3)", priceDelta: 220 },
              ],
            },
            {
              name: "Accompaniments",
              required: false,
              options: [
                { name: "Extra Mirchi Ka Salan", priceDelta: 20 },
                { name: "Extra Boondi Raita", priceDelta: 30 },
              ],
            },
          ],
        },
        {
          name: "Royal Nawabi Veg Dum Biryani",
          description: "Layered basmati rice with farm-fresh carrots, beans, cauliflower, paneer and caramelized crispy onions with mint essence.",
          price: 250,
          prepTime: 18,
          isChefRecommended: false,
          photoUrl: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600&auto=format&fit=crop&q=80",
        },
        {
          name: "Jeera Basmati Rice",
          description: "Aromatic steamed aged basmati rice tempered with roasted cumin seeds and desi cow ghee.",
          price: 130,
          prepTime: 10,
          isChefRecommended: false,
          photoUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop&q=80",
        },
      ],
    },
    {
      categoryName: "🫓 Breads & Tandoor",
      items: [
        {
          name: "Butter Garlic Naan",
          description: "Classic leavened refined flour flatbread brushed with crushed garlic, coriander leaves and molten salted butter.",
          price: 65,
          prepTime: 8,
          isChefRecommended: true,
          photoUrl: "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&auto=format&fit=crop&q=80",
        },
        {
          name: "Cheese Burst Naan",
          description: "Clay oven baked naan stuffed generously with molten mozzarella and processed cheese with herbs.",
          price: 95,
          prepTime: 10,
          isChefRecommended: true,
          photoUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
        },
        {
          name: "Tandoori Butter Roti",
          description: "Wholesome 100% whole wheat bread baked against the clay tandoor wall and glazed with butter.",
          price: 30,
          prepTime: 6,
          isChefRecommended: false,
          photoUrl: "https://images.unsplash.com/photo-1505253758473-96b3d5ebcd96?w=600&auto=format&fit=crop&q=80",
        },
        {
          name: "Amritsari Laccha Paratha",
          description: "Multi-layered crispy whole wheat flaky paratha baked crisp in tandoor.",
          price: 55,
          prepTime: 8,
          isChefRecommended: false,
          photoUrl: "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&auto=format&fit=crop&q=80",
        },
      ],
    },
    {
      categoryName: "🍕 Artisanal Pizzas (Indian Fusion & Fast Food)",
      items: [
        {
          name: "Paneer Tikka Makhani Pizza (10\")",
          description: "Hand-stretched sourdough crust loaded with spiced makhani tomato sauce, char-grilled paneer, bell peppers, onions, and gooey mozzarella.",
          price: 340,
          prepTime: 18,
          isChefRecommended: true,
          photoUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
          modifiers: [
            {
              name: "Crust & Cheese",
              required: false,
              options: [
                { name: "Extra Cheese Burst", priceDelta: 60 },
                { name: "Thin & Crispy Crust", priceDelta: 0 },
                { name: "Add Jalapenos & Olives", priceDelta: 35 },
              ],
            },
          ],
        },
        {
          name: "Chicken Tikka Supreme Pizza (10\")",
          description: "Tandoori smoked chicken breast chunks, pickled red onions, green capsicum, coriander drizzle and spicy tomato herb blend.",
          price: 390,
          prepTime: 20,
          isChefRecommended: true,
          photoUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80",
          modifiers: [
            {
              name: "Topping Add-ons",
              required: false,
              options: [
                { name: "Extra Chicken Tikka", priceDelta: 75 },
                { name: "Spicy Peri-Peri Drizzle", priceDelta: 20 },
              ],
            },
          ],
        },
        {
          name: "Classic Margherita Pizza (10\")",
          description: "San Marzano marinara base, fresh basil leaves, buffalo mozzarella and drizzle of cold pressed extra virgin olive oil.",
          price: 290,
          prepTime: 15,
          isChefRecommended: false,
          photoUrl: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&auto=format&fit=crop&q=80",
        },
      ],
    },
    {
      categoryName: "🍔 Gourmet Burgers, Kathi Rolls & Fries",
      items: [
        {
          name: "Butter Chicken Glazed Burger",
          description: "Crispy fried chicken thigh patty dipped in velvety butter chicken sauce with mint mayo in toasted brioche bun with fries.",
          price: 240,
          prepTime: 14,
          isChefRecommended: true,
          photoUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
          modifiers: [
            {
              name: "Burger Additions",
              required: false,
              options: [
                { name: "Add Cheddar Cheese Slice", priceDelta: 30 },
                { name: "Make It Double Patty", priceDelta: 90 },
              ],
            },
          ],
        },
        {
          name: "Crispy Aloo Herb Crunch Burger",
          description: "Spiced golden potato & corn patty with tangy Indian street sauce, pickled gherkins, lettuce and tomato.",
          price: 150,
          prepTime: 12,
          isChefRecommended: false,
          photoUrl: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80",
        },
        {
          name: "Kolkata Double Egg Chicken Kathi Roll",
          description: "Egg-coated flaky paratha rolled with spiced chicken boti kebab, sliced crunchy onions, green chillies and lemon juice.",
          price: 190,
          prepTime: 12,
          isChefRecommended: true,
          photoUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80",
        },
        {
          name: "Paneer Tikka Franky Roll",
          description: "Rumali paratha roll filled with tandoori paneer cubes, chopped peppers, mint mayo and chatpata masala.",
          price: 170,
          prepTime: 12,
          isChefRecommended: false,
          photoUrl: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80",
        },
        {
          name: "Peri Peri Masala French Fries",
          description: "Crispy golden cut potato fries tossed in fiery African bird's eye chili and Indian spice rub with cheesy garlic dip.",
          price: 120,
          prepTime: 8,
          isChefRecommended: false,
          photoUrl: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80",
        },
      ],
    },
    {
      categoryName: "🍨 Traditional Desserts",
      items: [
        {
          name: "Hot Gulab Jamun with Rabri (2 Pcs)",
          description: "Deep-fried khoya dumplings soaked in rose and cardamom scented sugar syrup, served warm with thick saffron rabri.",
          price: 120,
          prepTime: 6,
          isChefRecommended: true,
          photoUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
        },
        {
          name: "Royal Kesari Rasmalai (2 Pcs)",
          description: "Spongy cottage cheese patties immersed in chilled clotted saffron cream garnished with slivered pistachios.",
          price: 140,
          prepTime: 5,
          isChefRecommended: true,
          photoUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
        },
        {
          name: "Royal Matka Kulfi",
          description: "Traditional slow-reduced dense milk ice cream flavored with pistachio, almonds, green cardamom and real saffron.",
          price: 110,
          prepTime: 4,
          isChefRecommended: false,
          photoUrl: "https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=600&auto=format&fit=crop&q=80",
        },
      ],
    },
    {
      categoryName: "🥤 Beverages & Lassis",
      items: [
        {
          name: "Thick Alphonso Mango Lassi",
          description: "Rich, churned farm-fresh yogurt blended with sweet Ratnagiri Alphonso mango pulp and cardamom.",
          price: 110,
          prepTime: 5,
          isChefRecommended: true,
          photoUrl: "https://images.unsplash.com/photo-1570701564993-e00652af8aa7?w=600&auto=format&fit=crop&q=80",
        },
        {
          name: "Punjabi Sweet Malai Lassi",
          description: "Traditional frothy sweet yogurt drink served in clay kulhad topped with a thick layer of clotted malai.",
          price: 90,
          prepTime: 5,
          isChefRecommended: false,
          photoUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80",
        },
        {
          name: "Kulhad Masala Chai",
          description: "Strong brewed Assam black tea boiled with buffalo milk, crushed ginger, cardamom, cinnamon and cloves.",
          price: 50,
          prepTime: 6,
          isChefRecommended: true,
          photoUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80",
        },
        {
          name: "Fresh Nimbu Shikanji (Soda)",
          description: "Refreshing Indian street style lemonade seasoned with black rock salt, roasted cumin and mint sprigs.",
          price: 60,
          prepTime: 4,
          isChefRecommended: false,
          photoUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80",
        },
      ],
    },
  ];

  const allCreatedMenuItems: any[] = [];

  for (const catData of menuCatalog) {
    const category = await prisma.category.create({
      data: {
        name: catData.categoryName,
        restaurantId: restaurant.id,
      },
    });

    for (const item of catData.items) {
      const createdItem = await prisma.menuItem.create({
        data: {
          name: item.name,
          description: item.description,
          price: item.price,
          prepTime: item.prepTime,
          isChefRecommended: item.isChefRecommended,
          status: MenuItemStatus.AVAILABLE,
          categoryId: category.id,
          photos: {
            create: {
              url: item.photoUrl,
              isPrimary: true,
            },
          },
        },
      });

      if (item.modifiers && item.modifiers.length > 0) {
        for (const modGroup of item.modifiers) {
          await prisma.modifierGroup.create({
            data: {
              name: modGroup.name,
              required: modGroup.required,
              menuItemId: createdItem.id,
              options: {
                create: modGroup.options.map((opt) => ({
                  name: opt.name,
                  priceDelta: opt.priceDelta,
                })),
              },
            },
          });
        }
      }

      allCreatedMenuItems.push(createdItem);
    }
  }
  console.log(`✅ Created ${allCreatedMenuItems.length} authentic menu items with photos & modifiers.`);

  // 6. CREATE REAL REVIEWS & RATINGS
  console.log("⭐ Creating customer reviews & ratings...");
  const reviewsData = [
    {
      menuItemName: "Delhi Style Butter Chicken (Murgh Makhani)",
      customerName: "Aarav Sharma",
      rating: 5,
      comment: "Hands down the best Butter Chicken in town! Incredibly rich and silky gravy. Tastes like Old Delhi.",
    },
    {
      menuItemName: "Amritsari Paneer Tikka",
      customerName: "Priya Patel",
      rating: 5,
      comment: "Super soft paneer with authentic smoky tandoor flavor. The mint chutney complements it perfectly.",
    },
    {
      menuItemName: "Hyderabadi Dum Chicken Biryani",
      customerName: "Rohan Nair",
      rating: 5,
      comment: "Aroma of pure saffron and ghee hits you immediately. Rice grains are long and separate. 10/10!",
    },
    {
      menuItemName: "Paneer Tikka Makhani Pizza (10\")",
      customerName: "Neha Gupta",
      rating: 4,
      comment: "Brilliant fusion! The makhani sauce base on pizza works surprisingly well with molten mozzarella.",
    },
    {
      menuItemName: "Butter Chicken Glazed Burger",
      customerName: "Kabir Mehta",
      rating: 5,
      comment: "Junk food heaven! Saucy, crunchy chicken patty with fresh brioche bun. Must order!",
    },
  ];

  for (const rev of reviewsData) {
    const item = allCreatedMenuItems.find((m) => m.name.includes(rev.menuItemName));
    if (item) {
      await prisma.review.create({
        data: {
          menuItemId: item.id,
          rating: rev.rating,
          comment: rev.comment,
          customerName: rev.customerName,
          userId: customer1.id,
        },
      });
    }
  }

  // 7. SEED ACTIVE LIVE WORKFLOW DATA (FOR KITCHEN, WAITER, ADMIN TESTING)
  console.log("⚡ Seeding live interactive orders across all workflow states...");

  // Scenario 1: Table 1 -> New Order (RECEIVED) - Ready for Kitchen Staff to accept!
  const sessionT1 = await prisma.tableSession.create({
    data: {
      tableId: createdTables[0].id,
      waiterId: waiter1.id,
      status: TableSessionStatus.OPEN,
      startedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
    },
  });

  const samosaItem = allCreatedMenuItems.find((i) => i.name.includes("Samosa"))!;
  const tikkiItem = allCreatedMenuItems.find((i) => i.name.includes("Tikki"))!;

  await prisma.order.create({
    data: {
      tableSessionId: sessionT1.id,
      userId: customer1.id,
      status: OrderStatus.RECEIVED,
      totalAmount: samosaItem.price * 2 + tikkiItem.price,
      items: {
        create: [
          {
            menuItemId: samosaItem.id,
            quantity: 2,
            price: samosaItem.price,
            status: OrderStatus.RECEIVED,
            note: "Crispy please with extra sweet tamarind chutney",
          },
          {
            menuItemId: tikkiItem.id,
            quantity: 1,
            price: tikkiItem.price,
            status: OrderStatus.RECEIVED,
            note: "Less green chilli for kids",
          },
        ],
      },
    },
  });

  // Scenario 2: Table 3 -> In Kitchen Cooking (PREPARING) - Displays on Kitchen Display System!
  const sessionT3 = await prisma.tableSession.create({
    data: {
      tableId: createdTables[2].id,
      waiterId: waiter1.id,
      status: TableSessionStatus.OPEN,
      startedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
    },
  });

  const butterChicken = allCreatedMenuItems.find((i) => i.name.includes("Butter Chicken"))!;
  const garlicNaan = allCreatedMenuItems.find((i) => i.name.includes("Garlic Naan"))!;

  await prisma.order.create({
    data: {
      tableSessionId: sessionT3.id,
      userId: customer2.id,
      status: OrderStatus.PREPARING,
      totalAmount: butterChicken.price + garlicNaan.price * 3,
      items: {
        create: [
          {
            menuItemId: butterChicken.id,
            quantity: 1,
            price: butterChicken.price,
            status: OrderStatus.PREPARING,
            note: "Medium spice, extra gravy",
          },
          {
            menuItemId: garlicNaan.id,
            quantity: 3,
            price: garlicNaan.price,
            status: OrderStatus.PREPARING,
            note: "Crisp and hot from tandoor",
          },
        ],
      },
    },
  });

  // Scenario 3: Table 5 -> Food Cooked, Waiting for Waiter Pickup (READY) - Alerts Waiter!
  const sessionT5 = await prisma.tableSession.create({
    data: {
      tableId: createdTables[4].id,
      waiterId: waiter1.id,
      status: TableSessionStatus.OPEN,
      startedAt: new Date(Date.now() - 25 * 60 * 1000), // 25 mins ago
    },
  });

  const biryaniItem = allCreatedMenuItems.find((i) => i.name.includes("Hyderabadi Dum"))!;
  const mangoLassi = allCreatedMenuItems.find((i) => i.name.includes("Mango Lassi"))!;

  await prisma.order.create({
    data: {
      tableSessionId: sessionT5.id,
      userId: customer3.id,
      status: OrderStatus.READY,
      totalAmount: biryaniItem.price * 2 + mangoLassi.price * 2,
      items: {
        create: [
          {
            menuItemId: biryaniItem.id,
            quantity: 2,
            price: biryaniItem.price,
            status: OrderStatus.READY,
            note: "Extra salan on the side",
          },
          {
            menuItemId: mangoLassi.id,
            quantity: 2,
            price: mangoLassi.price,
            status: OrderStatus.READY,
            note: "Well chilled",
          },
        ],
      },
    },
  });

  // Scenario 4: Table 7 -> Currently Eating & BILL REQUESTED (SERVED + billRequested: true) - For Waiter Billing
  const sessionT7 = await prisma.tableSession.create({
    data: {
      tableId: createdTables[6].id,
      waiterId: waiter2.id,
      status: TableSessionStatus.OPEN,
      startedAt: new Date(Date.now() - 40 * 60 * 1000), // 40 mins ago
    },
  });

  const paneerPizza = allCreatedMenuItems.find((i) => i.name.includes("Paneer Tikka Makhani Pizza"))!;
  const burgerItem = allCreatedMenuItems.find((i) => i.name.includes("Butter Chicken Glazed Burger"))!;
  const friesItem = allCreatedMenuItems.find((i) => i.name.includes("Peri Peri"))!;

  await prisma.order.create({
    data: {
      tableSessionId: sessionT7.id,
      userId: customer1.id,
      status: OrderStatus.SERVED,
      billRequested: true,
      totalAmount: paneerPizza.price + burgerItem.price + friesItem.price,
      items: {
        create: [
          {
            menuItemId: paneerPizza.id,
            quantity: 1,
            price: paneerPizza.price,
            status: OrderStatus.SERVED,
          },
          {
            menuItemId: burgerItem.id,
            quantity: 1,
            price: burgerItem.price,
            status: OrderStatus.SERVED,
          },
          {
            menuItemId: friesItem.id,
            quantity: 1,
            price: friesItem.price,
            status: OrderStatus.SERVED,
          },
        ],
      },
    },
  });

  // Scenario 5: Table 9 -> Just Served, Dining comfortably (SERVED)
  const sessionT9 = await prisma.tableSession.create({
    data: {
      tableId: createdTables[8].id,
      waiterId: waiter2.id,
      status: TableSessionStatus.OPEN,
      startedAt: new Date(Date.now() - 20 * 60 * 1000),
    },
  });

  const kathiRoll = allCreatedMenuItems.find((i) => i.name.includes("Kolkata Double Egg"))!;
  const gulabJamun = allCreatedMenuItems.find((i) => i.name.includes("Gulab Jamun"))!;

  await prisma.order.create({
    data: {
      tableSessionId: sessionT9.id,
      userId: customer2.id,
      status: OrderStatus.SERVED,
      billRequested: false,
      totalAmount: kathiRoll.price * 2 + gulabJamun.price,
      items: {
        create: [
          {
            menuItemId: kathiRoll.id,
            quantity: 2,
            price: kathiRoll.price,
            status: OrderStatus.SERVED,
          },
          {
            menuItemId: gulabJamun.id,
            quantity: 1,
            price: gulabJamun.price,
            status: OrderStatus.SERVED,
          },
        ],
      },
    },
  });

  // 8. HISTORICAL ORDERS & COMPLETED TRANSACTIONS (FOR ADMIN ANALYTICS & CHARTS)
  console.log("📈 Generating historical completed orders across the past 7 days for Admin Analytics...");

  const pastDays = [0, 1, 2, 3, 4, 5, 6]; // Today down to 6 days ago
  let completedCount = 0;

  for (const daysAgo of pastDays) {
    // Generate 5-8 orders per day
    const ordersToday = 5 + (daysAgo % 4);
    for (let o = 0; o < ordersToday; o++) {
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - daysAgo);
      orderDate.setHours(12 + (o * 2) % 10, 15 + (o * 7) % 45, 0);

      const randomTable = createdTables[(o + daysAgo) % createdTables.length];
      const randomCustomer = allCustomers[(o * 3) % allCustomers.length];

      // Closed session
      const histSession = await prisma.tableSession.create({
        data: {
          tableId: randomTable.id,
          waiterId: randomTable.waiterId,
          status: TableSessionStatus.CLOSED,
          startedAt: new Date(orderDate.getTime() - 45 * 60 * 1000),
          endedAt: orderDate,
        },
      });

      // Pick 2-4 items
      const selectedItems = [
        allCreatedMenuItems[(o * 2) % allCreatedMenuItems.length],
        allCreatedMenuItems[(o * 3 + 1) % allCreatedMenuItems.length],
        allCreatedMenuItems[(o * 5 + 2) % allCreatedMenuItems.length],
      ];

      let orderSum = 0;
      const orderItemsData = selectedItems.map((item, idx) => {
        const qty = (idx % 2) + 1;
        orderSum += item.price * qty;
        return {
          menuItemId: item.id,
          quantity: qty,
          price: item.price,
          status: OrderStatus.COMPLETED,
          note: "Delivered to table",
        };
      });

      const histOrder = await prisma.order.create({
        data: {
          tableSessionId: histSession.id,
          userId: randomCustomer.id,
          status: OrderStatus.COMPLETED,
          totalAmount: orderSum,
          createdAt: orderDate,
          items: {
            create: orderItemsData,
          },
        },
      });

      // Add payment
      const paymentMethod = o % 2 === 0 ? PaymentMethod.STRIPE : PaymentMethod.CASH;
      await prisma.payment.create({
        data: {
          orderId: histOrder.id,
          method: paymentMethod,
          status: PaymentStatus.PAID,
          amount: orderSum,
          finalAmount: orderSum,
          paidAt: orderDate,
        },
      });

      completedCount++;
    }
  }

  console.log(`✅ Generated ${completedCount} completed historical orders with payment records.`);

  console.log("🎉 ========================================================");
  console.log("🍛 INDIAN RESTAURANT SEED COMPLETED SUCCESSFULLY!");
  console.log("🎉 ========================================================");
  console.log("Credentials for Testing All Roles (Password: 123456):");
  console.log("  👑 Super Admin: admin@restaurant.com");
  console.log("  📊 Manager:     manager@restaurant.com");
  console.log("  👨‍🍳 Kitchen:     kitchen@restaurant.com (Chef Sanjeev)");
  console.log("  👨‍🍳 Kitchen 2:   chef.rahul@restaurant.com (Chef Rahul)");
  console.log("  🤵 Waiter:      waiter@restaurant.com (Amit Sharma)");
  console.log("  🤵 Waiter 2:    waiter.rohit@restaurant.com (Rohit Nair)");
  console.log("  👤 Customer:    customer@restaurant.com (Priya Patel)");
  console.log("==========================================================");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
