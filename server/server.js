import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import path from "path"
import fs from "fs"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import multer from "multer"
import { fileURLToPath } from "url"
import { PrismaClient } from "@prisma/client"

dotenv.config()

const app = express()
const prisma = new PrismaClient()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET || "secret123"

const DEFAULT_TRENDING_SETTINGS = {
  id: 1,
  mode: "manual",
  limit: 8,
  bestSellerDays: 7,
}

const ALLOWED_TRENDING_MODES = ["manual", "best_sellers", "newest"]

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const uploadsDir = path.join(__dirname, "uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

app.use("/uploads", express.static(uploadsDir))

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${uniqueSuffix}-${file.originalname}`)
  },
})

const upload = multer({ storage })

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Brak tokena" })
    }

    const token = authHeader.split(" ")[1]
    const decoded = jwt.verify(token, JWT_SECRET)

    req.admin = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: "Nieprawidłowy token" })
  }
}

function getBaseUrl(req) {
  return `${req.protocol}://${req.get("host")}`
}

function toAbsoluteUrl(req, value) {
  if (!value) return null
  if (typeof value !== "string") return null

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value
  }

  if (value.startsWith("/")) {
    return `${getBaseUrl(req)}${value}`
  }

  return `${getBaseUrl(req)}/${value}`
}

function extractImageUrl(req, value) {
  if (!value) return null

  if (typeof value === "string") {
    return toAbsoluteUrl(req, value)
  }

  if (typeof value === "object") {
    return (
      toAbsoluteUrl(req, value.url) ||
      toAbsoluteUrl(req, value.filename ? `/uploads/${value.filename}` : null) ||
      toAbsoluteUrl(req, value.image) ||
      toAbsoluteUrl(req, value.src) ||
      toAbsoluteUrl(req, value.path) ||
      null
    )
  }

  return null
}

function uniqueArray(arr) {
  return [...new Set(arr.filter(Boolean))]
}

function normalizeProduct(product, req) {
  if (!product) return product

  const relationImages = Array.isArray(product.images)
    ? product.images
        .map((img, index) => {
          const imageUrl = extractImageUrl(req, img)
          if (!imageUrl) return null

          return {
            id: img.id ?? `generated-${product.id}-${index}`,
            filename: img.filename ?? null,
            productId: img.productId ?? product.id,
            url: imageUrl,
          }
        })
        .filter(Boolean)
    : []

  const relationImageUrls = relationImages.map((img) => img.url)

  const legacyGallery = Array.isArray(product.gallery)
    ? product.gallery.map((img) => extractImageUrl(req, img)).filter(Boolean)
    : []

  const legacyImage =
    extractImageUrl(req, product.image) ||
    extractImageUrl(req, product.thumbnail) ||
    null

  const finalGallery = uniqueArray([
    ...relationImageUrls,
    ...legacyGallery,
    legacyImage,
  ])

  const mainImage = legacyImage || finalGallery[0] || null
  const mainThumbnail =
    extractImageUrl(req, product.thumbnail) || mainImage || null

  return {
    ...product,
    images:
      relationImages.length > 0
        ? relationImages
        : finalGallery.map((url, index) => ({
            id: `generated-${product.id}-${index}`,
            filename: null,
            productId: product.id,
            url,
          })),
    image: mainImage,
    thumbnail: mainThumbnail,
    gallery: finalGallery,
  }
}

function parseIsTrending(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback
  if (value === true || value === "true" || value === 1 || value === "1") return true
  return false
}

function parsePositiveInt(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback

  const parsed = Number(value)

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback
  }

  return Math.floor(parsed)
}

async function getTrendingSettings() {
  return prisma.trendingSettings.upsert({
    where: { id: DEFAULT_TRENDING_SETTINGS.id },
    update: {},
    create: DEFAULT_TRENDING_SETTINGS,
  })
}

function normalizeTrendingSettings(settings) {
  return {
    id: settings.id,
    mode: settings.mode,
    limit: settings.limit,
    bestSellerDays: settings.bestSellerDays,
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt,
  }
}

async function getProductsByIdsInOrder(productIds) {
  if (!productIds.length) return []

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
    include: {
      images: true,
      category: true,
    },
  })

  const productsMap = new Map(products.map((product) => [product.id, product]))

  return productIds.map((id) => productsMap.get(id)).filter(Boolean)
}

async function getManualTrendingProducts(limit) {
  return prisma.product.findMany({
    where: {
      isTrending: true,
    },
    include: {
      images: true,
      category: true,
    },
    orderBy: [
      {
        id: "desc",
      },
    ],
    take: limit,
  })
}

async function getNewestTrendingProducts(limit) {
  return prisma.product.findMany({
    include: {
      images: true,
      category: true,
    },
    orderBy: [
      {
        createdAt: "desc",
      },
      {
        id: "desc",
      },
    ],
    take: limit,
  })
}

async function getBestSellerTrendingProducts(limit, bestSellerDays) {
  const sinceDate = new Date()
  sinceDate.setDate(sinceDate.getDate() - bestSellerDays)

  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: {
        createdAt: {
          gte: sinceDate,
        },
      },
    },
    _sum: {
      quantity: true,
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: limit,
  })

  const sortedIds = grouped
    .filter((item) => (item._sum.quantity || 0) > 0)
    .map((item) => item.productId)

  if (!sortedIds.length) {
    return []
  }

  return getProductsByIdsInOrder(sortedIds)
}

async function resolveTrendingProducts() {
  const settings = await getTrendingSettings()

  const limit = parsePositiveInt(settings.limit, DEFAULT_TRENDING_SETTINGS.limit)
  const bestSellerDays = parsePositiveInt(
    settings.bestSellerDays,
    DEFAULT_TRENDING_SETTINGS.bestSellerDays
  )

  let mode = settings.mode
  let products = []

  if (mode === "manual") {
    products = await getManualTrendingProducts(limit)
  } else if (mode === "newest") {
    products = await getNewestTrendingProducts(limit)
  } else if (mode === "best_sellers") {
    products = await getBestSellerTrendingProducts(limit, bestSellerDays)

    if (!products.length) {
      products = await getNewestTrendingProducts(limit)
    }
  } else {
    mode = DEFAULT_TRENDING_SETTINGS.mode
    products = await getManualTrendingProducts(limit)
  }

  return {
    settings: {
      ...settings,
      mode,
      limit,
      bestSellerDays,
    },
    products,
  }
}

app.get("/", (req, res) => {
  res.json({ message: "API działa" })
})

/* =========================
   ADMIN
========================= */

app.post("/admin/register", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email i hasło są wymagane" })
    }

    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    })

    if (existingAdmin) {
      return res.status(400).json({ error: "Admin już istnieje" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
      },
    })

    res.status(201).json({
      id: admin.id,
      email: admin.email,
      message: "Admin utworzony",
    })
  } catch (error) {
    console.error("POST /admin/register error:", error)
    res.status(500).json({ error: "Błąd rejestracji admina" })
  }
})

app.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email i hasło są wymagane" })
    }

    const admin = await prisma.admin.findUnique({
      where: { email },
    })

    if (!admin) {
      return res.status(401).json({ error: "Nieprawidłowy email lub hasło" })
    }

    const validPassword = await bcrypt.compare(password, admin.password)

    if (!validPassword) {
      return res.status(401).json({ error: "Nieprawidłowy email lub hasło" })
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
      },
    })
  } catch (error) {
    console.error("POST /admin/login error:", error)
    res.status(500).json({ error: "Błąd logowania" })
  }
})

/* =========================
   TRENDING SETTINGS
========================= */

app.get("/trending-settings", async (req, res) => {
  try {
    const settings = await getTrendingSettings()
    res.json(normalizeTrendingSettings(settings))
  } catch (error) {
    console.error("GET /trending-settings error:", error)
    res.status(500).json({ error: "Błąd pobierania ustawień trendingu" })
  }
})

app.put("/trending-settings", authMiddleware, async (req, res) => {
  try {
    const { mode, limit, bestSellerDays } = req.body

    const currentSettings = await getTrendingSettings()

    let nextMode = currentSettings.mode
    let nextLimit = currentSettings.limit
    let nextBestSellerDays = currentSettings.bestSellerDays

    if (mode !== undefined) {
      if (!ALLOWED_TRENDING_MODES.includes(mode)) {
        return res.status(400).json({
          error: "Nieprawidłowy tryb trendingu",
        })
      }

      nextMode = mode
    }

    if (limit !== undefined) {
      const parsedLimit = parsePositiveInt(limit, null)

      if (!parsedLimit) {
        return res.status(400).json({
          error: "Limit musi być liczbą większą od 0",
        })
      }

      nextLimit = parsedLimit
    }

    if (bestSellerDays !== undefined) {
      const parsedBestSellerDays = parsePositiveInt(bestSellerDays, null)

      if (!parsedBestSellerDays) {
        return res.status(400).json({
          error: "Liczba dni musi być liczbą większą od 0",
        })
      }

      nextBestSellerDays = parsedBestSellerDays
    }

    const updatedSettings = await prisma.trendingSettings.upsert({
      where: { id: DEFAULT_TRENDING_SETTINGS.id },
      update: {
        mode: nextMode,
        limit: nextLimit,
        bestSellerDays: nextBestSellerDays,
      },
      create: {
        id: DEFAULT_TRENDING_SETTINGS.id,
        mode: nextMode,
        limit: nextLimit,
        bestSellerDays: nextBestSellerDays,
      },
    })

    res.json(normalizeTrendingSettings(updatedSettings))
  } catch (error) {
    console.error("PUT /trending-settings error:", error)
    res.status(500).json({ error: "Błąd zapisu ustawień trendingu" })
  }
})

/* =========================
   CATEGORIES
========================= */

app.get("/categories", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        id: "desc",
      },
    })

    res.json(categories)
  } catch (error) {
    console.error("GET /categories error:", error)
    res.status(500).json({ error: "Błąd pobierania kategorii" })
  }
})

app.post("/categories", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Nazwa kategorii jest wymagana" })
    }

    const category = await prisma.category.create({
      data: {
        name: String(name).trim(),
      },
    })

    res.status(201).json(category)
  } catch (error) {
    console.error("POST /categories error:", error)
    res.status(500).json({ error: "Błąd tworzenia kategorii" })
  }
})

app.put("/categories/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { name } = req.body

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Nieprawidłowe ID kategorii" })
    }

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Nazwa kategorii jest wymagana" })
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: String(name).trim(),
      },
    })

    res.json(updatedCategory)
  } catch (error) {
    console.error("PUT /categories/:id error:", error)
    res.status(500).json({ error: "Błąd edycji kategorii" })
  }
})

/* =========================
   PRODUCTS
========================= */

app.get("/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        images: true,
        category: true,
      },
      orderBy: {
        id: "desc",
      },
    })

    res.json(products.map((product) => normalizeProduct(product, req)))
  } catch (error) {
    console.error("GET /products error:", error)
    res.status(500).json({ error: "Błąd pobierania produktów" })
  }
})

app.get("/products/trending", async (req, res) => {
  try {
    const result = await resolveTrendingProducts()
    res.json(result.products.map((product) => normalizeProduct(product, req)))
  } catch (error) {
    console.error("GET /products/trending error:", error)
    res.status(500).json({ error: "Błąd pobierania trendujących produktów" })
  }
})

app.get("/products/category/:id", async (req, res) => {
  try {
    const categoryId = Number(req.params.id)

    if (Number.isNaN(categoryId)) {
      return res.status(400).json({ error: "Nieprawidłowe ID kategorii" })
    }

    const products = await prisma.product.findMany({
      where: {
        category: {
          id: categoryId,
        },
      },
      include: {
        images: true,
        category: true,
      },
      orderBy: {
        id: "desc",
      },
    })

    res.json(products.map((product) => normalizeProduct(product, req)))
  } catch (error) {
    console.error("GET /products/category/:id error:", error)
    res.status(500).json({ error: "Błąd pobierania produktów kategorii" })
  }
})

app.get("/products/search/:text", async (req, res) => {
  try {
    const text = req.params.text || ""

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
        images: true,
        category: true,
      },
      orderBy: {
        id: "desc",
      },
    })

    res.json(products.map((product) => normalizeProduct(product, req)))
  } catch (error) {
    console.error("GET /products/search/:text error:", error)
    res.status(500).json({ error: "Błąd wyszukiwania produktów" })
  }
})

app.get("/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Nieprawidłowe ID produktu" })
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        category: true,
      },
    })

    if (!product) {
      return res.status(404).json({ error: "Produkt nie istnieje" })
    }

    res.json(normalizeProduct(product, req))
  } catch (error) {
    console.error("GET /products/:id error:", error)
    res.status(500).json({ error: "Błąd pobierania produktu" })
  }
})

app.post("/products", authMiddleware, upload.array("images", 10), async (req, res) => {
  try {
    const { name, description, price, categoryId, isTrending, trending } = req.body

    if (!name || price === undefined || price === "" || !categoryId) {
      return res.status(400).json({ error: "Brakuje wymaganych pól" })
    }

    const numericPrice = Number(price)
    const numericCategoryId = Number(categoryId)

    if (Number.isNaN(numericPrice) || Number.isNaN(numericCategoryId)) {
      return res.status(400).json({ error: "Nieprawidłowe dane produktu" })
    }

    const createdProduct = await prisma.product.create({
      data: {
        name: String(name),
        description: description ? String(description) : "",
        price: numericPrice,
        isTrending: parseIsTrending(
          isTrending !== undefined ? isTrending : trending,
          false
        ),
        category: {
          connect: {
            id: numericCategoryId,
          },
        },
      },
    })

    if (req.files && req.files.length > 0) {
      await prisma.productImage.createMany({
        data: req.files.map((file) => ({
          filename: file.filename,
          productId: createdProduct.id,
        })),
      })
    }

    const product = await prisma.product.findUnique({
      where: { id: createdProduct.id },
      include: {
        images: true,
        category: true,
      },
    })

    res.status(201).json(normalizeProduct(product, req))
  } catch (error) {
    console.error("POST /products error:", error)
    res.status(500).json({ error: error.message || "Błąd tworzenia produktu" })
  }
})

app.put("/products/:id", authMiddleware, upload.array("images", 10), async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Nieprawidłowe ID produktu" })
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        category: true,
      },
    })

    if (!existingProduct) {
      return res.status(404).json({ error: "Produkt nie istnieje" })
    }

    const { name, description, price, categoryId, isTrending, trending } = req.body
    const updateData = {}

    if (name !== undefined) {
      updateData.name = String(name)
    }

    if (description !== undefined) {
      updateData.description = String(description)
    }

    if (price !== undefined && price !== "") {
      const numericPrice = Number(price)

      if (Number.isNaN(numericPrice)) {
        return res.status(400).json({ error: "Nieprawidłowa cena" })
      }

      updateData.price = numericPrice
    }

    if (isTrending !== undefined || trending !== undefined) {
      updateData.isTrending = parseIsTrending(
        isTrending !== undefined ? isTrending : trending,
        existingProduct.isTrending
      )
    }

    if (categoryId !== undefined && categoryId !== "") {
      const numericCategoryId = Number(categoryId)

      if (Number.isNaN(numericCategoryId)) {
        return res.status(400).json({ error: "Nieprawidłowa kategoria" })
      }

      updateData.category = {
        connect: {
          id: numericCategoryId,
        },
      }
    }

    await prisma.product.update({
      where: { id },
      data: updateData,
    })

    if (req.files && req.files.length > 0) {
      await prisma.productImage.deleteMany({
        where: { productId: id },
      })

      await prisma.productImage.createMany({
        data: req.files.map((file) => ({
          filename: file.filename,
          productId: id,
        })),
      })
    }

    const updatedProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        category: true,
      },
    })

    res.json(normalizeProduct(updatedProduct, req))
  } catch (error) {
    console.error("PUT /products/:id error:", error)
    res.status(500).json({ error: error.message || "Błąd edycji produktu" })
  }
})

app.delete("/products/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Nieprawidłowe ID produktu" })
    }

    await prisma.productImage.deleteMany({
      where: { productId: id },
    })

    await prisma.product.delete({
      where: { id },
    })

    res.json({ message: "Produkt usunięty" })
  } catch (error) {
    console.error("DELETE /products/:id error:", error)
    res.status(500).json({ error: "Błąd usuwania produktu" })
  }
})

/* =========================
   ORDERS
========================= */

app.get("/orders", authMiddleware, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    })

    res.json(orders)
  } catch (error) {
    console.error("GET /orders error:", error)
    res.status(500).json({ error: "Błąd pobierania zamówień" })
  }
})

app.listen(PORT, () => {
  console.log(`Server działa na porcie ${PORT}`)
})