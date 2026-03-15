const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

function normalizeProduct(product) {
  if (!product) return product

  const images = Array.isArray(product.images) ? product.images : []
  const firstImage = images[0]?.url || null

  return {
    ...product,
    images,
    image: firstImage,
    thumbnail: firstImage,
    gallery: images.map((img) => img.url),
  }
}

function parseTrending(value, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback
  if (value === true || value === "true" || value === 1 || value === "1") return 1
  return 0
}

exports.getProducts = async (req, res) => {
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

    res.json(products.map(normalizeProduct))
  } catch (error) {
    console.error("GET /products error:", error)
    res.status(500).json({ error: "Błąd pobierania produktów" })
  }
}

exports.getProductById = async (req, res) => {
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

    res.json(normalizeProduct(product))
  } catch (error) {
    console.error("GET /products/:id error:", error)
    res.status(500).json({ error: "Błąd pobierania produktu" })
  }
}

exports.getTrendingProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { trending: 1 },
          { trending: true },
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

    res.json(products.map(normalizeProduct))
  } catch (error) {
    console.error("GET /products/trending error:", error)
    res.status(500).json({ error: "Błąd pobierania trendujących produktów" })
  }
}

exports.getProductsByCategory = async (req, res) => {
  try {
    const categoryId = Number(req.params.id)

    if (Number.isNaN(categoryId)) {
      return res.status(400).json({ error: "Nieprawidłowe ID kategorii" })
    }

    const products = await prisma.product.findMany({
      where: {
        categoryId,
      },
      include: {
        images: true,
        category: true,
      },
      orderBy: {
        id: "desc",
      },
    })

    res.json(products.map(normalizeProduct))
  } catch (error) {
    console.error("GET /products/category/:id error:", error)
    res.status(500).json({ error: "Błąd pobierania produktów kategorii" })
  }
}

exports.searchProducts = async (req, res) => {
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

    res.json(products.map(normalizeProduct))
  } catch (error) {
    console.error("GET /products/search/:text error:", error)
    res.status(500).json({ error: "Błąd wyszukiwania produktów" })
  }
}

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, categoryId, trending } = req.body

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
        categoryId: numericCategoryId,
        trending: parseTrending(trending, 0),
      },
    })

    if (req.files && req.files.length > 0) {
      await prisma.productImage.createMany({
        data: req.files.map((file) => ({
          url: `/uploads/${file.filename}`,
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

    res.status(201).json(normalizeProduct(product))
  } catch (error) {
    console.error("POST /products error:", error)
    res.status(500).json({ error: "Błąd tworzenia produktu" })
  }
}

exports.updateProduct = async (req, res) => {
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

    const { name, description, price, categoryId, trending } = req.body
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

    if (categoryId !== undefined && categoryId !== "") {
      const numericCategoryId = Number(categoryId)
      if (Number.isNaN(numericCategoryId)) {
        return res.status(400).json({ error: "Nieprawidłowa kategoria" })
      }
      updateData.categoryId = numericCategoryId
    }

    if (trending !== undefined) {
      updateData.trending = parseTrending(trending, existingProduct.trending)
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
          url: `/uploads/${file.filename}`,
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

    res.json(normalizeProduct(updatedProduct))
  } catch (error) {
    console.error("PUT /products/:id error:", error)
    res.status(500).json({
      error: error.message || "Błąd edycji produktu",
    })
  }
}

exports.deleteProduct = async (req, res) => {
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
}