import { PrismaClient, Role, MenuItemStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
  console.log("🚀 Starting Master Prompt Strict Category Seeding...");

  // 1. Get or create Restaurant
  let restaurant = await prisma.restaurant.findFirst();
  if (!restaurant) {
    restaurant = await prisma.restaurant.create({
      data: {
        name: "Aura 3D Dining & Gastronomy",
        address: "742 Evergreen Terrace, Culinary District",
      },
    });
  }
  console.log("Restaurant ID:", restaurant.id);

  // 2. Delete existing items, categories and photos to enforce clean strict segregation
  console.log("Cleaning old menu items & categories...");
  await prisma.orderItemModifier.deleteMany().catch(() => {});
  await prisma.orderItem.deleteMany().catch(() => {});
  await prisma.payment.deleteMany().catch(() => {});
  await prisma.order.deleteMany().catch(() => {});
  await prisma.review.deleteMany().catch(() => {});
  await prisma.menuItemPhoto.deleteMany().catch(() => {});
  await prisma.modifierOption.deleteMany().catch(() => {});
  await prisma.modifierGroup.deleteMany().catch(() => {});
  await prisma.menuItem.deleteMany().catch(() => {});
  await prisma.category.deleteMany().catch(() => {});

  // 3. Define the exact 7 categories specified in Master Prompt
  const categoriesData = [
    { name: "Kathi Rolls", icon: "🌯" },
    { name: "Pizza", icon: "🍕" },
    { name: "Burgers", icon: "🍔" },
    { name: "Starters", icon: "🥟" },
    { name: "Main Course", icon: "🍛" },
    { name: "Desserts", icon: "🍰" },
    { name: "Beverages", icon: "🥤" },
  ];

  const createdCategories: Record<string, string> = {};

  for (const cat of categoriesData) {
    const created = await prisma.category.create({
      data: {
        name: cat.name,
        restaurantId: restaurant.id,
      },
    });
    createdCategories[cat.name] = created.id;
    console.log(`✅ Created Category: ${cat.name} (${created.id})`);
  }

  // 4. Seed strict items for each category
  const menuData = [
    // --- KATHI ROLLS ---
    {
      category: "Kathi Rolls",
      name: "Paneer Tikka Kathi Roll",
      price: 140,
      description: "Soft buttered roomali roti rolled with smoky tandoori paneer, crunchy bell peppers, onions, and zesty mint chutney.",
      prepTime: 10,
      isChefRecommended: true,
      photoUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80",
      modifiers: [
        {
          name: "Roll Wrap Choice",
          required: false,
          options: [
            { name: "Whole Wheat Lachha Paratha", priceDelta: 15 },
            { name: "Extra Spiced Mint Chutney", priceDelta: 10 },
            { name: "Melted Cheese Layer", priceDelta: 25 },
          ],
        },
      ],
    },
    {
      category: "Kathi Rolls",
      name: "Kolkata Double Egg Chicken Roll",
      price: 180,
      description: "Authentic Kolkata street style paratha layered with beaten egg, juicy spiced chicken boti, sliced onions, and green chillies.",
      prepTime: 12,
      isChefRecommended: true,
      photoUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80",
    },
    {
      category: "Kathi Rolls",
      name: "Mutton Seekh Kebab Roll",
      price: 220,
      description: "Tender minced lamb seekh grilled on charcoal skewers, wrapped in flaky paratha with lemon-tossed onion rings.",
      prepTime: 15,
      isChefRecommended: false,
      photoUrl: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80",
    },
    {
      category: "Kathi Rolls",
      name: "Crunchy Veggie Mayo Roll",
      price: 120,
      description: "Crisp spiced vegetable patty wrapped in toasted paratha with shredded cabbage, carrots, sweet corn, and house herb mayo.",
      prepTime: 10,
      isChefRecommended: false,
      photoUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80",
    },

    // --- PIZZA ---
    {
      category: "Pizza",
      name: "Black Truffle Burrata Pizza",
      price: 420,
      description: "Wood-fired sourdough crust, fior di latte, creamy Italian burrata, shaved summer truffles, and wild arugula.",
      prepTime: 15,
      isChefRecommended: true,
      photoUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
      modifiers: [
        {
          name: "Crust Style",
          required: false,
          options: [
            { name: "Extra Virgin Olive Oil Drizzle", priceDelta: 20 },
            { name: "Stuffed Garlic Cheese Crust", priceDelta: 50 },
          ],
        },
      ],
    },
    {
      category: "Pizza",
      name: "Wood-Fired Margherita Basil Pizza",
      price: 260,
      description: "Classic San Marzano tomato sauce, fresh buffalo mozzarella, extra virgin olive oil, and sweet basil leaves.",
      prepTime: 14,
      isChefRecommended: false,
      photoUrl: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=800&auto=format&fit=crop&q=80",
    },
    {
      category: "Pizza",
      name: "Tandoori Chicken Tikka Feast Pizza",
      price: 380,
      description: "Crispy thin crust topped with spicy tandoori chicken tikka, red paprika, charred red onions, and gooey mozzarella.",
      prepTime: 16,
      isChefRecommended: true,
      photoUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80",
    },
    {
      category: "Pizza",
      name: "Paneer Makhani Fusion Pizza",
      price: 320,
      description: "Makhani gravy base, marinated cottage cheese cubes, capsicum, red onions, and melted mozzarella on stone-baked crust.",
      prepTime: 15,
      isChefRecommended: false,
      photoUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
    },

    // --- BURGERS ---
    {
      category: "Burgers",
      name: "Double Smokehouse Bacon Burger",
      price: 280,
      description: "Twin Angus beef patties, molten sharp cheddar, maple wood-smoked bacon, and caramelized onion relish on toasted brioche.",
      prepTime: 14,
      isChefRecommended: true,
      photoUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80",
      modifiers: [
        {
          name: "Fries & Sides",
          required: false,
          options: [
            { name: "Truffle Parmesan Fries", priceDelta: 45 },
            { name: "Classic Crispy Fries", priceDelta: 25 },
            { name: "Extra Cheddar Melt", priceDelta: 30 },
          ],
        },
      ],
    },
    {
      category: "Burgers",
      name: "Mumbai Crispy Aloo Tikki Burger",
      price: 90,
      description: "Golden crunchy spiced potato patty in toasted sesame bun with tamarind chutney, mint spread, and crisp iceberg lettuce.",
      prepTime: 10,
      isChefRecommended: true,
      photoUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80",
    },
    {
      category: "Burgers",
      name: "Crispy Fried Chicken Zinger Burger",
      price: 220,
      description: "Buttermilk battered extra crispy chicken fillet, spicy sriracha mayo, iceberg lettuce, and dill pickles on brioche bun.",
      prepTime: 12,
      isChefRecommended: true,
      photoUrl: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=800&auto=format&fit=crop&q=80",
    },
    {
      category: "Burgers",
      name: "Gourmet Truffle Mushroom Melt Burger",
      price: 240,
      description: "Charbroiled beef patty smothered in sautéed wild mushrooms, Swiss cheese, and black truffle garlic aioli.",
      prepTime: 15,
      isChefRecommended: false,
      photoUrl: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&auto=format&fit=crop&q=80",
    },

    // --- STARTERS ---
    {
      category: "Starters",
      name: "Crispy Samosa Plate with Chutneys (2 Pcs)",
      price: 70,
      description: "Golden flaky triangular pastries stuffed with spiced potatoes, green peas and whole cumin, served with saunth and mint chutney.",
      prepTime: 10,
      isChefRecommended: true,
      photoUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80",
      modifiers: [
        {
          name: "Chutney Extras",
          required: false,
          options: [
            { name: "Extra Mint Coriander Chutney", priceDelta: 10 },
            { name: "Sweet Tamarind Chutney", priceDelta: 10 },
          ],
        },
      ],
    },
    {
      category: "Starters",
      name: "Dilli Wali Aloo Tikki Chaat",
      price: 90,
      description: "Pan-grilled spiced potato patties topped with beaten sweet curd, zesty tamarind glaze, sev, and pomegranate seeds.",
      prepTime: 10,
      isChefRecommended: true,
      photoUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
    },
    {
      category: "Starters",
      name: "Amritsari Paneer Tikka",
      price: 240,
      description: "Fresh cottage cheese cubes marinated in carom seeds, Kashmiri red chilli paste, and hung curd, roasted in clay oven.",
      prepTime: 15,
      isChefRecommended: true,
      photoUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&auto=format&fit=crop&q=80",
    },
    {
      category: "Starters",
      name: "Tandoori Murgh Tikka",
      price: 290,
      description: "Succulent boneless chicken chunks marinated in aromatic Punjabi spices and char-grilled over flaming tandoor embers.",
      prepTime: 18,
      isChefRecommended: true,
      photoUrl: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80",
    },
    {
      category: "Starters",
      name: "Hara Bhara Kebab (6 Pcs)",
      price: 180,
      description: "Nutritious pan-fried patties of spinach, green peas, mashed potatoes and cottage cheese centered with cashew nuts.",
      prepTime: 12,
      isChefRecommended: false,
      photoUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80",
    },

    // --- MAIN COURSE ---
    {
      category: "Main Course",
      name: "Delhi Style Butter Chicken (Murgh Makhani)",
      price: 360,
      description: "Char-roasted shredded tandoori chicken simmered in rich satin-smooth tomato, cashew cream gravy and hand-churned butter.",
      prepTime: 20,
      isChefRecommended: true,
      photoUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=80",
      modifiers: [
        {
          name: "Portion Size",
          required: false,
          options: [
            { name: "Regular Bowl", priceDelta: 0 },
            { name: "Large Handi (Feeds 2)", priceDelta: 160 },
          ],
        },
      ],
    },
    {
      category: "Main Course",
      name: "Shahi Paneer Butter Masala",
      price: 310,
      description: "Cottage cheese squares cooked in a luscious royal gravy of cashews, tomatoes, and aromatic whole spices.",
      prepTime: 18,
      isChefRecommended: true,
      photoUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
    },
    {
      category: "Main Course",
      name: "Dal Makhani Bukhara Style",
      price: 260,
      description: "Black lentils slow-cooked overnight with cream, fresh butter, and roasted cumin on charcoal embers.",
      prepTime: 15,
      isChefRecommended: true,
      photoUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
    },
    {
      category: "Main Course",
      name: "Hyderabadi Dum Chicken Biryani",
      price: 340,
      description: "Fragrant long-grain aged basmati rice layered with spiced marinated chicken, saffron, brown onions, and fresh mint.",
      prepTime: 22,
      isChefRecommended: true,
      photoUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
    },
    {
      category: "Main Course",
      name: "Butter Garlic Naan",
      price: 60,
      description: "Tandoor-baked leavened flatbread brushed with crushed roasted garlic and melted dairy butter.",
      prepTime: 8,
      isChefRecommended: false,
      photoUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80",
    },

    // --- DESSERTS ---
    {
      category: "Desserts",
      name: "Royal Angoori Gulab Jamun (3 Pcs)",
      price: 110,
      description: "Soft melt-in-mouth milk-solid dumplings soaked in warm rosewater and green cardamom sugar syrup with pistachio dust.",
      prepTime: 6,
      isChefRecommended: true,
      photoUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80",
    },
    {
      category: "Desserts",
      name: "Molten Belgian Chocolate Lava Cake",
      price: 180,
      description: "Warm dark chocolate cake with a rich liquid ganache center, paired with Madagascar vanilla bean gelato.",
      prepTime: 12,
      isChefRecommended: true,
      photoUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80",
    },
    {
      category: "Desserts",
      name: "Kesar Pista Matka Kulfi",
      price: 130,
      description: "Traditional dense and creamy slow-cooked Indian ice cream infused with saffron strands and crushed pistachios.",
      prepTime: 5,
      isChefRecommended: false,
      photoUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop&q=80",
    },
    {
      category: "Desserts",
      name: "Chilled Rasmalai with Saffron Milk (2 Pcs)",
      price: 140,
      description: "Delicate cottage cheese patties immersed in chilled clotted saffron cream milk garnished with sliced almonds.",
      prepTime: 5,
      isChefRecommended: true,
      photoUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
    },

    // --- BEVERAGES ---
    {
      category: "Beverages",
      name: "Classic Chilled Coca-Cola",
      price: 60,
      description: "Ice-cold refreshing Coca-Cola poured over crystalline ice cubes with a fresh slice of lemon, effervescent fizz, and cold condensation.",
      prepTime: 3,
      isChefRecommended: true,
      photoUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=80",
      modifiers: [
        {
          name: "Serving Style",
          required: false,
          options: [
            { name: "Extra Ice Cubes & Fresh Lemon Wedge", priceDelta: 0 },
            { name: "Chilled Can Only (No Ice)", priceDelta: 0 },
          ],
        },
      ],
    },
    {
      category: "Beverages",
      name: "Royal Alphonso Mango Lassi",
      price: 110,
      description: "Thick and creamy churned yogurt blended with ripe Ratnagiri Alphonso mango pulp and cardamom.",
      prepTime: 6,
      isChefRecommended: true,
      photoUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80",
    },
    {
      category: "Beverages",
      name: "Kulhad Masala Chai",
      price: 50,
      description: "Steaming Indian street tea brewed with crushed ginger, green cardamom, cinnamon, and whole milk in an earthen clay cup.",
      prepTime: 8,
      isChefRecommended: false,
      photoUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop&q=80",
    },
    {
      category: "Beverages",
      name: "Citrus Sunset Passion Mocktail",
      price: 130,
      description: "Fresh squeezed passionfruit puree, ruby blood orange, mint leaves, crushed ice and bubbly club soda.",
      prepTime: 5,
      isChefRecommended: false,
      photoUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80",
    },
  ];

  for (const item of menuData) {
    const categoryId = createdCategories[item.category];
    if (!categoryId) {
      console.warn(`Category ${item.category} not found!`);
      continue;
    }

    const createdItem = await prisma.menuItem.create({
      data: {
        categoryId,
        name: item.name,
        price: item.price,
        description: item.description,
        prepTime: item.prepTime,
        status: MenuItemStatus.AVAILABLE,
        isChefRecommended: item.isChefRecommended,
        photos: {
          create: [
            {
              url: item.photoUrl,
              isPrimary: true,
            },
          ],
        },
      },
    });

    if (item.modifiers && item.modifiers.length > 0) {
      for (const mod of item.modifiers) {
        await prisma.modifierGroup.create({
          data: {
            menuItemId: createdItem.id,
            name: mod.name,
            required: mod.required,
            options: {
              create: mod.options.map(opt => ({
                name: opt.name,
                priceDelta: opt.priceDelta,
              })),
            },
          },
        });
      }
    }

    console.log(`  -> Seeded: [${item.category}] ${item.name}`);
  }

  console.log("🎉 Successfully seeded 7 strict categories with all menu items!");
}

seed()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
