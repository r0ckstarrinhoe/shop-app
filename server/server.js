const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({ storage });

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function parseBoolean(value) {
  if (typeof value === "boolean") return value;

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return (
      normalized === "true" ||
      normalized === "1" ||
      normalized === "on" ||
      normalized === "yes"
    );
  }

  return false;
}

function normalizeCode(code) {
  return String(code || "")
    .trim()
    .toUpperCase();
}

function serializeProduct(product) {
  const images = (product.images || []).map((img) => ({
    id: img.id,
    filename: img.filename,
    url: `/uploads/${img.filename}`,
  }));

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    categoryId: product.categoryId,
    isTrending: product.isTrending,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
        }
      : null,
    images,
    image: images[0]?.url || null,
    thumbnail: images[0]?.url || null,
    gallery: images.map((img) => img.url),
  };
}

function serializeDiscount(discount) {
  return {
    id: discount.id,
    name: discount.name,
    code: discount.code,
    scope: discount.scope,
    valueType: discount.valueType,
    value: Number(discount.value),
    minOrderValue:
      discount.minOrderValue !== null ? Number(discount.minOrderValue) : null,
    isActive: discount.isActive,
    startsAt: discount.startsAt,
    endsAt: discount.endsAt,
    productId: discount.productId,
    categoryId: discount.categoryId,
    product: discount.product
      ? {
          id: discount.product.id,
          name: discount.product.name,
        }
      : null,
    category: discount.category
      ? {
          id: discount.category.id,
          name: discount.category.name,
        }
      : null,
    createdAt: discount.createdAt,
    updatedAt: discount.updatedAt,
  };
}

function getDiscountScopeLabel(scope) {
  switch (scope) {
    case "PRODUCT":
      return "product";
    case "CATEGORY":
      return "category";
    case "GLOBAL":
      return "global";
    case "CART":
      return "cart";
    default:
      return "unknown";
  }
}

function isDiscountCurrentlyValid(discount) {
  const now = new Date();

  if (!discount.isActive) {
    return { valid: false, message: "Kod rabatowy jest nieaktywny." };
  }

  if (discount.startsAt && now < discount.startsAt) {
    return { valid: false, message: "Kod rabatowy nie jest jeszcze aktywny." };
  }

  if (discount.endsAt && now > discount.endsAt) {
    return { valid: false, message: "Kod rabatowy wygasł." };
  }

  return { valid: true };
}

function getApplicableItems(items, discount) {
  switch (discount.scope) {
    case "PRODUCT":
      return items.filter((item) => item.productId === discount.productId);

    case "CATEGORY":
      return items.filter((item) => item.categoryId === discount.categoryId);

    case "GLOBAL":
      return items;

    case "CART":
      return items;

    default:
      return [];
  }
}

function calculateDiscountAmountForScope(applicableSubtotal, discount) {
  const discountValue = Number(discount.value);

  if (discount.valueType === "PERCENT") {
    return round2((applicableSubtotal * discountValue) / 100);
  }

  return round2(Math.min(discountValue, applicableSubtotal));
}

function distributeDiscountAcrossItems(items, totalDiscountAmount) {
  const safeDiscount = round2(totalDiscountAmount);

  if (!items.length || safeDiscount <= 0) {
    return items.map((item) => ({
      ...item,
      lineDiscount: 0,
      finalLineTotal: round2(item.lineSubtotal),
    }));
  }

  const subtotal = round2(
    items.reduce((sum, item) => sum + Number(item.lineSubtotal), 0)
  );

  if (subtotal <= 0) {
    return items.map((item) => ({
      ...item,
      lineDiscount: 0,
      finalLineTotal: round2(item.lineSubtotal),
    }));
  }

  let distributed = 0;

  return items.map((item, index) => {
    const lineSubtotal = round2(item.lineSubtotal);
    let lineDiscount;

    if (index === items.length - 1) {
      lineDiscount = round2(safeDiscount - distributed);
    } else {
      lineDiscount = round2((lineSubtotal / subtotal) * safeDiscount);
      distributed = round2(distributed + lineDiscount);
    }

    if (lineDiscount > lineSubtotal) {
      lineDiscount = lineSubtotal;
    }

    return {
      ...item,
      lineDiscount,
      finalLineTotal: round2(lineSubtotal - lineDiscount),
    };
  });
}

async function buildCartFromRequestItems(items) {
  const rawItems = Array.isArray(items) ? items : [];

  if (!rawItems.length) {
    return {
      cartItems: [],
      subtotal: 0,
    };
  }

  const merged = new Map();

  for (const item of rawItems) {
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);

    if (!productId || !quantity || quantity <= 0) continue;

    if (!merged.has(productId)) {
      merged.set(productId, 0);
    }

    merged.set(productId, merged.get(productId) + quantity);
  }

  const productIds = [...merged.keys()];

  if (!productIds.length) {
    return {
      cartItems: [],
      subtotal: 0,
    };
  }

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
    },
    include: {
      category: true,
      images: true,
    },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  const cartItems = productIds
    .map((productId) => {
      const product = productMap.get(productId);
      if (!product) return null;

      const quantity = merged.get(productId);
      const unitPrice = round2(product.price);
      const lineSubtotal = round2(unitPrice * quantity);

      return {
        productId: product.id,
        productName: product.name,
        categoryId: product.categoryId,
        categoryName: product.category?.name || null,
        quantity,
        unitPrice,
        lineSubtotal,
        image: product.images?.[0] ? `/uploads/${product.images[0].filename}` : null,
      };
    })
    .filter(Boolean);

  const subtotal = round2(
    cartItems.reduce((sum, item) => sum + item.lineSubtotal, 0)
  );

  return {
    cartItems,
    subtotal,
  };
}

async function calculateDiscountValidation({ code, items }) {
  const normalizedCode = normalizeCode(code);

  if (!normalizedCode) {
    return {
      valid: false,
      message: "Nie podano kodu rabatowego.",
      code: null,
      discount: null,
      cart: {
        subtotal: 0,
        discountAmount: 0,
        total: 0,
      },
      affectedItems: [],
    };
  }

  const { cartItems, subtotal } = await buildCartFromRequestItems(items);

  if (!cartItems.length) {
    return {
      valid: false,
      message: "Koszyk jest pusty albo zawiera nieprawidłowe produkty.",
      code: normalizedCode,
      discount: null,
      cart: {
        subtotal: 0,
        discountAmount: 0,
        total: 0,
      },
      affectedItems: [],
    };
  }

  const discount = await prisma.discount.findFirst({
    where: {
      code: normalizedCode,
    },
    include: {
      product: true,
      category: true,
    },
  });

  if (!discount) {
    return {
      valid: false,
      message: "Kod rabatowy nie istnieje.",
      code: normalizedCode,
      discount: null,
      cart: {
        subtotal,
        discountAmount: 0,
        total: subtotal,
      },
      affectedItems: cartItems.map((item) => ({
        ...item,
        lineDiscount: 0,
        finalLineTotal: item.lineSubtotal,
      })),
    };
  }

  const statusCheck = isDiscountCurrentlyValid(discount);
  if (!statusCheck.valid) {
    return {
      valid: false,
      message: statusCheck.message,
      code: normalizedCode,
      discount: serializeDiscount(discount),
      cart: {
        subtotal,
        discountAmount: 0,
        total: subtotal,
      },
      affectedItems: cartItems.map((item) => ({
        ...item,
        lineDiscount: 0,
        finalLineTotal: item.lineSubtotal,
      })),
    };
  }

  const minOrderValue =
    discount.minOrderValue !== null ? Number(discount.minOrderValue) : null;

  if (minOrderValue !== null && subtotal < minOrderValue) {
    return {
      valid: false,
      message: `Minimalna wartość zamówienia dla tego kodu to ${minOrderValue.toFixed(
        2
      )} zł.`,
      code: normalizedCode,
      discount: serializeDiscount(discount),
      cart: {
        subtotal,
        discountAmount: 0,
        total: subtotal,
      },
      affectedItems: cartItems.map((item) => ({
        ...item,
        lineDiscount: 0,
        finalLineTotal: item.lineSubtotal,
      })),
    };
  }

  const applicableItems = getApplicableItems(cartItems, discount);

  if (!applicableItems.length) {
    return {
      valid: false,
      message: "Kod rabatowy nie dotyczy produktów w koszyku.",
      code: normalizedCode,
      discount: serializeDiscount(discount),
      cart: {
        subtotal,
        discountAmount: 0,
        total: subtotal,
      },
      affectedItems: cartItems.map((item) => ({
        ...item,
        lineDiscount: 0,
        finalLineTotal: item.lineSubtotal,
      })),
    };
  }

  const applicableSubtotal = round2(
    applicableItems.reduce((sum, item) => sum + item.lineSubtotal, 0)
  );

  let discountAmount = calculateDiscountAmountForScope(applicableSubtotal, discount);

  if (discount.scope === "CART") {
    discountAmount = calculateDiscountAmountForScope(subtotal, discount);
  }

  discountAmount = round2(Math.min(discountAmount, subtotal));

  const distributedApplicableItems = distributeDiscountAcrossItems(
    applicableItems,
    discountAmount
  );

  const distributedMap = new Map(
    distributedApplicableItems.map((item) => [item.productId, item])
  );

  const affectedItems = cartItems.map((item) => {
    const discounted = distributedMap.get(item.productId);

    if (!discounted) {
      return {
        ...item,
        lineDiscount: 0,
        finalLineTotal: item.lineSubtotal,
      };
    }

    return discounted;
  });

  const total = round2(subtotal - discountAmount);

  return {
    valid: true,
    message: "Kod rabatowy został poprawnie zastosowany.",
    code: normalizedCode,
    appliesTo: {
      type: getDiscountScopeLabel(discount.scope),
      productId: discount.productId,
      categoryId: discount.categoryId,
      global: discount.scope === "GLOBAL",
      cartLevel: discount.scope === "CART",
    },
    discount: serializeDiscount(discount),
    cart: {
      subtotal,
      discountAmount,
      total,
    },
    affectedItems,
  };
}

async function getTrendingSettings() {
  let settings = await prisma.trendingSettings.findUnique({
    where: { id: 1 },
  });

  if (!settings) {
    settings = await prisma.trendingSettings.create({
      data: {
        id: 1,
        mode: "manual",
        limit: 8,
        days: 30,
      },
    });
  }

  return settings;
}

async function getTrendingProductsInternal() {
  const settings = await getTrendingSettings();

  if (settings.mode === "manual") {
    const products = await prisma.product.findMany({
      where: { isTrending: true },
      include: {
        category: true,
        images: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: settings.limit,
    });

    return products;
  }

  if (settings.mode === "newest") {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        images: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: settings.limit,
    });

    return products;
  }

  if (settings.mode === "best_sellers") {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - settings.days);

    const grouped = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: {
        quantity: true,
      },
      where: {
        order: {
          createdAt: {
            gte: dateFrom,
          },
        },
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: settings.limit,
    });

    const productIds = grouped.map((row) => row.productId);

    if (!productIds.length) {
      const fallbackProducts = await prisma.product.findMany({
        include: {
          category: true,
          images: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: settings.limit,
      });

      return fallbackProducts;
    }

    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      include: {
        category: true,
        images: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    return productIds.map((id) => productMap.get(id)).filter(Boolean);
  }

  return [];
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Brak tokenu." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Nieprawidłowy token." });
  }
}

app.get("/", (req, res) => {
  res.json({ message: "API działa" });
});

/* =========================
   ADMIN AUTH
========================= */

app.post("/admin/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email i hasło są wymagane." });
    }

    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      return res.status(400).json({ message: "Admin już istnieje." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    res.status(201).json({
      id: admin.id,
      email: admin.email,
      message: "Admin utworzony.",
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: "Błąd rejestracji admina." });
  }
});

app.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return res.status(401).json({ message: "Nieprawidłowy email lub hasło." });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Nieprawidłowy email lub hasło." });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Błąd logowania." });
  }
});

/* =========================
   CATEGORIES
========================= */

app.get("/categories", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });

    res.json(categories);
  } catch (error) {
    console.error("GET CATEGORIES ERROR:", error);
    res.status(500).json({ message: "Błąd pobierania kategorii." });
  }
});

app.post("/categories", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Nazwa kategorii jest wymagana." });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
      },
    });

    res.status(201).json(category);
  } catch (error) {
    console.error("CREATE CATEGORY ERROR:", error);

    if (error.code === "P2002") {
      return res.status(400).json({ message: "Taka kategoria już istnieje." });
    }

    res.status(500).json({ message: "Błąd tworzenia kategorii." });
  }
});

/* =========================
   PRODUCTS
========================= */

app.get("/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        images: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(products.map(serializeProduct));
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);
    res.status(500).json({ message: "Błąd pobierania produktów." });
  }
});

app.get("/products/trending", async (req, res) => {
  try {
    const products = await getTrendingProductsInternal();
    res.json(products.map(serializeProduct));
  } catch (error) {
    console.error("GET TRENDING PRODUCTS ERROR:", error);
    res.status(500).json({ message: "Błąd pobierania trendujących produktów." });
  }
});

app.get("/products/category/:id", async (req, res) => {
  try {
    const categoryId = Number(req.params.id);

    const products = await prisma.product.findMany({
      where: {
        categoryId,
      },
      include: {
        category: true,
        images: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(products.map(serializeProduct));
  } catch (error) {
    console.error("GET PRODUCTS BY CATEGORY ERROR:", error);
    res.status(500).json({ message: "Błąd pobierania produktów kategorii." });
  }
});

app.get("/products/search/:text", async (req, res) => {
  try {
    const text = req.params.text;

    const products = await prisma.product.findMany({
      where: {
        OR: [
          {
            name: {
              contains: text,
            },
          },
          {
            description: {
              contains: text,
            },
          },
        ],
      },
      include: {
        category: true,
        images: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(products.map(serializeProduct));
  } catch (error) {
    console.error("SEARCH PRODUCTS ERROR:", error);
    res.status(500).json({ message: "Błąd wyszukiwania produktów." });
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: true,
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Produkt nie istnieje." });
    }

    res.json(serializeProduct(product));
  } catch (error) {
    console.error("GET PRODUCT ERROR:", error);
    res.status(500).json({ message: "Błąd pobierania produktu." });
  }
});

app.post("/products", authMiddleware, upload.array("images", 10), async (req, res) => {
  try {
    const { name, description, price, categoryId, isTrending } = req.body;

    if (!name || !description || !price || !categoryId) {
      return res.status(400).json({
        message: "name, description, price i categoryId są wymagane.",
      });
    }

    const product = await prisma.product.create({
      data: {
        name: String(name).trim(),
        description: String(description).trim(),
        price: Number(price),
        categoryId: Number(categoryId),
        isTrending: parseBoolean(isTrending),
      },
    });

    if (req.files?.length) {
      await prisma.productImage.createMany({
        data: req.files.map((file) => ({
          filename: file.filename,
          productId: product.id,
        })),
      });
    }

    const createdProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        images: true,
      },
    });

    res.status(201).json(serializeProduct(createdProduct));
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);
    res.status(500).json({ message: "Błąd tworzenia produktu." });
  }
});

app.put("/products/:id", authMiddleware, upload.array("images", 10), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      name,
      description,
      price,
      categoryId,
      isTrending,
      replaceImages,
    } = req.body;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existingProduct) {
      return res.status(404).json({ message: "Produkt nie istnieje." });
    }

    await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? String(name).trim() : existingProduct.name,
        description:
          description !== undefined
            ? String(description).trim()
            : existingProduct.description,
        price: price !== undefined ? Number(price) : existingProduct.price,
        categoryId:
          categoryId !== undefined ? Number(categoryId) : existingProduct.categoryId,
        isTrending:
          isTrending !== undefined
            ? parseBoolean(isTrending)
            : existingProduct.isTrending,
      },
    });

    if (parseBoolean(replaceImages)) {
      for (const img of existingProduct.images) {
        const filePath = path.join(uploadsDir, img.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await prisma.productImage.deleteMany({
        where: { productId: id },
      });
    }

    if (req.files?.length) {
      await prisma.productImage.createMany({
        data: req.files.map((file) => ({
          filename: file.filename,
          productId: id,
        })),
      });
    }

    const updatedProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: true,
      },
    });

    res.json(serializeProduct(updatedProduct));
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);
    res.status(500).json({ message: "Błąd aktualizacji produktu." });
  }
});

app.delete("/products/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const product = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!product) {
      return res.status(404).json({ message: "Produkt nie istnieje." });
    }

    for (const image of product.images) {
      const filePath = path.join(uploadsDir, image.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.product.delete({
      where: { id },
    });

    res.json({ message: "Produkt usunięty." });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);
    res.status(500).json({ message: "Błąd usuwania produktu." });
  }
});

/* =========================
   TRENDING SETTINGS
========================= */

app.get("/trending-settings", async (req, res) => {
  try {
    const settings = await getTrendingSettings();
    res.json(settings);
  } catch (error) {
    console.error("GET TRENDING SETTINGS ERROR:", error);
    res.status(500).json({ message: "Błąd pobierania ustawień trending." });
  }
});

app.put("/trending-settings", authMiddleware, async (req, res) => {
  try {
    const { mode, limit, days } = req.body;

    const validModes = ["manual", "best_sellers", "newest"];
    if (!validModes.includes(mode)) {
      return res.status(400).json({ message: "Nieprawidłowy tryb trending." });
    }

    const settings = await prisma.trendingSettings.upsert({
      where: { id: 1 },
      update: {
        mode,
        limit: Number(limit) || 8,
        days: Number(days) || 30,
      },
      create: {
        id: 1,
        mode,
        limit: Number(limit) || 8,
        days: Number(days) || 30,
      },
    });

    res.json(settings);
  } catch (error) {
    console.error("UPDATE TRENDING SETTINGS ERROR:", error);
    res.status(500).json({ message: "Błąd aktualizacji ustawień trending." });
  }
});

/* =========================
   DISCOUNTS
========================= */

app.get("/discounts", async (req, res) => {
  try {
    const discounts = await prisma.discount.findMany({
      include: {
        product: true,
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(discounts);
  } catch (error) {
    console.error("GET DISCOUNTS ERROR:", error);
    res.status(500).json({ message: "Błąd pobierania rabatów." });
  }
});

app.get("/discounts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const discount = await prisma.discount.findUnique({
      where: { id },
      include: {
        product: true,
        category: true,
      },
    });

    if (!discount) {
      return res.status(404).json({ message: "Rabat nie istnieje." });
    }

    res.json(discount);
  } catch (error) {
    console.error("GET DISCOUNT ERROR:", error);
    res.status(500).json({ message: "Błąd pobierania rabatu." });
  }
});

app.post("/discounts", async (req, res) => {
  try {
    let {
      name,
      code,
      scope,
      valueType,
      value,
      productId,
      categoryId,
      startsAt,
      endsAt,
      isActive,
    } = req.body;

    code = normalizeCode(code);

    if (!name || !scope || !valueType || value === undefined || value === null) {
      return res.status(400).json({ message: "Brak wymaganych pól." });
    }

    if (valueType === "PERCENT" && (Number(value) <= 0 || Number(value) > 100)) {
      return res.status(400).json({ message: "Procent musi być w zakresie 1-100." });
    }

    if (valueType === "FIXED" && Number(value) <= 0) {
      return res.status(400).json({ message: "Kwota musi być większa od 0." });
    }

    if (valueType === "FIXED" && scope === "GLOBAL") {
      return res.status(400).json({ message: "Rabaty kwotowe nie mogą być globalne." });
    }

    if (scope === "PRODUCT" && !productId) {
      return res.status(400).json({ message: "Dla PRODUCT wymagane jest productId." });
    }

    if (scope === "CATEGORY" && !categoryId) {
      return res.status(400).json({ message: "Dla CATEGORY wymagane jest categoryId." });
    }

    if (scope === "GLOBAL") {
      productId = null;
      categoryId = null;
    }

    if (startsAt && endsAt && new Date(startsAt) > new Date(endsAt)) {
      return res.status(400).json({ message: "Niepoprawny zakres dat." });
    }

    const discount = await prisma.discount.create({
      data: {
        name: String(name).trim(),
        code,
        scope,
        valueType,
        value: Number(value),
        productId: productId ? Number(productId) : null,
        categoryId: categoryId ? Number(categoryId) : null,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        isActive: isActive !== undefined ? parseBoolean(isActive) : true,
      },
    });

    res.status(201).json(discount);
  } catch (error) {
    console.error("CREATE DISCOUNT ERROR:", error);
    res.status(500).json({ message: "Błąd tworzenia rabatu." });
  }
});

app.put("/discounts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    let {
      name,
      code,
      scope,
      valueType,
      value,
      productId,
      categoryId,
      startsAt,
      endsAt,
      isActive,
    } = req.body;

    if (code !== undefined) {
      code = normalizeCode(code);
    }

    if (valueType === "PERCENT" && (Number(value) <= 0 || Number(value) > 100)) {
      return res.status(400).json({ message: "Procent musi być w zakresie 1-100." });
    }

    if (valueType === "FIXED" && Number(value) <= 0) {
      return res.status(400).json({ message: "Kwota musi być większa od 0." });
    }

    if (valueType === "FIXED" && scope === "GLOBAL") {
      return res.status(400).json({ message: "Rabaty kwotowe nie mogą być globalne." });
    }

    if (scope === "PRODUCT" && !productId) {
      return res.status(400).json({ message: "Dla PRODUCT wymagane jest productId." });
    }

    if (scope === "CATEGORY" && !categoryId) {
      return res.status(400).json({ message: "Dla CATEGORY wymagane jest categoryId." });
    }

    if (scope === "GLOBAL") {
      productId = null;
      categoryId = null;
    }

    if (startsAt && endsAt && new Date(startsAt) > new Date(endsAt)) {
      return res.status(400).json({ message: "Niepoprawny zakres dat." });
    }

    const discount = await prisma.discount.update({
      where: { id },
      data: {
        name,
        code,
        scope,
        valueType,
        value: value !== undefined ? Number(value) : undefined,
        productId: productId ? Number(productId) : null,
        categoryId: categoryId ? Number(categoryId) : null,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        isActive: isActive !== undefined ? parseBoolean(isActive) : undefined,
      },
    });

    res.json(discount);
  } catch (error) {
    console.error("UPDATE DISCOUNT ERROR:", error);
    res.status(500).json({ message: "Błąd aktualizacji rabatu." });
  }
});

app.delete("/discounts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.discount.delete({
      where: { id },
    });

    res.json({ message: "Rabat usunięty." });
  } catch (error) {
    console.error("DELETE DISCOUNT ERROR:", error);
    res.status(500).json({ message: "Błąd usuwania rabatu." });
  }
});

app.post("/discounts/validate", async (req, res) => {
  try {
    const { code, items } = req.body;

    const result = await calculateDiscountValidation({ code, items });

    if (!result.valid) {
      return res.status(200).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error("VALIDATE DISCOUNT ERROR:", error);
    res.status(500).json({
      valid: false,
      message: "Błąd walidacji kodu rabatowego.",
      code: normalizeCode(req.body?.code),
      discount: null,
      cart: {
        subtotal: 0,
        discountAmount: 0,
        total: 0,
      },
      affectedItems: [],
    });
  }
});

/* =========================
   START
========================= */

app.listen(PORT, () => {
  console.log(`Server działa na porcie ${PORT}`);
});