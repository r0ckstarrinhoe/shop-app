import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey";

const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeName = file.originalname.replace(/\s+/g, "-");
    cb(null, `${uniqueSuffix}-${safeName}`);
  },
});

const upload = multer({ storage });

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Brak tokena." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Nieprawidłowy token." });
  }
}

function generateToken(admin) {
  return jwt.sign(
    {
      id: admin.id,
      email: admin.email,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function getImagesFromProduct(product) {
  if (Array.isArray(product?.images)) return product.images;
  if (Array.isArray(product?.productImages)) return product.productImages;
  if (Array.isArray(product?.gallery)) return product.gallery;
  return [];
}

function mapProduct(product) {
  if (!product) return product;

  const images = getImagesFromProduct(product).map((img) => {
    return {
      id: img.id,
      url:
        img.url ||
        img.path ||
        img.imageUrl ||
        (img.filename ? `/uploads/${img.filename}` : ""),
    };
  });

  return {
    ...product,
    images,
  };
}

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
*/

app.post("/admin/register", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

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

    return res.status(201).json({
      token: generateToken(admin),
      admin: {
        id: admin.id,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("POST /admin/register error:", error);
    return res.status(500).json({ message: "Błąd rejestracji admina." });
  }
});

app.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ message: "Email i hasło są wymagane." });
    }

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return res.status(401).json({ message: "Nieprawidłowy email lub hasło." });
    }

    const valid = await bcrypt.compare(password, admin.password);

    if (!valid) {
      return res.status(401).json({ message: "Nieprawidłowy email lub hasło." });
    }

    return res.json({
      token: generateToken(admin),
      admin: {
        id: admin.id,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("POST /admin/login error:", error);
    return res.status(500).json({ message: "Błąd logowania." });
  }
});

/*
|--------------------------------------------------------------------------
| Kategorie
|--------------------------------------------------------------------------
*/

app.get("/categories", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        id: "desc",
      },
    });

    return res.json(categories);
  } catch (error) {
    console.error("GET /categories error:", error);
    return res.status(500).json({ message: "Błąd pobierania kategorii." });
  }
});

app.post("/categories", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body ?? {};

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Nazwa kategorii jest wymagana." });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
      },
    });

    return res.status(201).json(category);
  } catch (error) {
    console.error("POST /categories error:", error);
    return res.status(500).json({ message: "Błąd dodawania kategorii." });
  }
});

app.put("/categories/:id", authMiddleware, async (req, res) => {
  try {
    const categoryId = Number(req.params.id);
    const { name } = req.body ?? {};

    if (Number.isNaN(categoryId)) {
      return res.status(400).json({ message: "Nieprawidłowe ID kategorii." });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Nazwa kategorii jest wymagana." });
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      return res.status(404).json({ message: "Kategoria nie istnieje." });
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: name.trim(),
      },
    });

    return res.json(updatedCategory);
  } catch (error) {
    console.error("PUT /categories/:id error:", error);
    return res.status(500).json({ message: "Błąd edycji kategorii." });
  }
});

/*
|--------------------------------------------------------------------------
| Produkty
|--------------------------------------------------------------------------
*/

app.get("/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        images: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    return res.json(products.map(mapProduct));
  } catch (error) {
    console.error("GET /products error:", error);
    return res.status(500).json({ message: "Błąd pobierania produktów." });
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const productId = Number(req.params.id);

    if (Number.isNaN(productId)) {
      return res.status(400).json({ message: "Nieprawidłowe ID produktu." });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        images: true,
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Produkt nie istnieje." });
    }

    return res.json(mapProduct(product));
  } catch (error) {
    console.error("GET /products/:id error:", error);
    return res.status(500).json({ message: "Błąd pobierania produktu." });
  }
});

app.get("/products/trending", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        trending: true,
      },
      include: {
        category: true,
        images: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    return res.json(products.map(mapProduct));
  } catch (error) {
    console.error("GET /products/trending error:", error);
    return res
      .status(500)
      .json({ message: "Błąd pobierania trendujących produktów." });
  }
});

app.get("/products/category/:id", async (req, res) => {
  try {
    const categoryId = Number(req.params.id);

    if (Number.isNaN(categoryId)) {
      return res.status(400).json({ message: "Nieprawidłowe ID kategorii." });
    }

    const products = await prisma.product.findMany({
      where: {
        categoryId,
      },
      include: {
        category: true,
        images: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    return res.json(products.map(mapProduct));
  } catch (error) {
    console.error("GET /products/category/:id error:", error);
    return res
      .status(500)
      .json({ message: "Błąd pobierania produktów kategorii." });
  }
});

app.get("/products/search/:text", async (req, res) => {
  try {
    const text = req.params.text?.trim();

    if (!text) {
      return res.json([]);
    }

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
        id: "desc",
      },
    });

    return res.json(products.map(mapProduct));
  } catch (error) {
    console.error("GET /products/search/:text error:", error);
    return res.status(500).json({ message: "Błąd wyszukiwania produktów." });
  }
});

app.post("/products", authMiddleware, upload.array("images"), async (req, res) => {
  try {
    const body = req.body ?? {};
    const { name, categoryId, description, price } = body;

    if (!name || !categoryId || !description || !price) {
      return res.status(400).json({
        message: "Pola name, categoryId, description i price są wymagane.",
      });
    }

    const parsedCategoryId = Number(categoryId);
    const parsedPrice = Number(price);

    if (Number.isNaN(parsedCategoryId) || Number.isNaN(parsedPrice)) {
      return res.status(400).json({ message: "Nieprawidłowe categoryId lub price." });
    }

    const files = Array.isArray(req.files) ? req.files : [];

    const createdProduct = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        price: parsedPrice,
        categoryId: parsedCategoryId,
      },
    });

    if (files.length > 0) {
      await prisma.productImage.createMany({
        data: files.map((file) => ({
          productId: createdProduct.id,
          url: `/uploads/${file.filename}`,
        })),
      });
    }

    const fullProduct = await prisma.product.findUnique({
      where: { id: createdProduct.id },
      include: {
        category: true,
        images: true,
      },
    });

    return res.status(201).json(mapProduct(fullProduct));
  } catch (error) {
    console.error("POST /products error:", error);
    return res.status(500).json({ message: "Błąd dodawania produktu." });
  }
});

app.put("/products/:id", authMiddleware, upload.array("images"), async (req, res) => {
  try {
    const productId = Number(req.params.id);

    if (Number.isNaN(productId)) {
      return res.status(400).json({ message: "Nieprawidłowe ID produktu." });
    }

    const body = req.body ?? {};
    const { name, categoryId, description, price } = body;

    if (!name || !categoryId || !description || !price) {
      return res.status(400).json({
        message: "Pola name, categoryId, description i price są wymagane.",
      });
    }

    const parsedCategoryId = Number(categoryId);
    const parsedPrice = Number(price);

    if (Number.isNaN(parsedCategoryId) || Number.isNaN(parsedPrice)) {
      return res.status(400).json({ message: "Nieprawidłowe categoryId lub price." });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return res.status(404).json({ message: "Produkt nie istnieje." });
    }

    await prisma.product.update({
      where: { id: productId },
      data: {
        name: name.trim(),
        description: description.trim(),
        price: parsedPrice,
        categoryId: parsedCategoryId,
      },
    });

    const files = Array.isArray(req.files) ? req.files : [];

    if (files.length > 0) {
      await prisma.productImage.createMany({
        data: files.map((file) => ({
          productId,
          url: `/uploads/${file.filename}`,
        })),
      });
    }

    const updatedProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        images: true,
      },
    });

    return res.json(mapProduct(updatedProduct));
  } catch (error) {
    console.error("PUT /products/:id error:", error);
    return res.status(500).json({ message: "Błąd edycji produktu." });
  }
});

app.delete("/products/:id", authMiddleware, async (req, res) => {
  try {
    const productId = Number(req.params.id);

    if (Number.isNaN(productId)) {
      return res.status(400).json({ message: "Nieprawidłowe ID produktu." });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: true,
      },
    });

    if (!existingProduct) {
      return res.status(404).json({ message: "Produkt nie istnieje." });
    }

    const images = getImagesFromProduct(existingProduct);

    for (const image of images) {
      const rawPath =
        image.url || image.path || image.imageUrl || (image.filename ? `/uploads/${image.filename}` : "");

      if (!rawPath) continue;

      const imagePath = path.join(__dirname, rawPath.replace(/^\/+/, ""));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await prisma.productImage.deleteMany({
      where: {
        productId,
      },
    });

    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    return res.json({ message: "Produkt został usunięty." });
  } catch (error) {
    console.error("DELETE /products/:id error:", error);
    return res.status(500).json({ message: "Błąd usuwania produktu." });
  }
});

/*
|--------------------------------------------------------------------------
| Zamówienia
|--------------------------------------------------------------------------
*/

app.get("/orders", authMiddleware, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: {
        id: "desc",
      },
    });

    return res.json(orders);
  } catch (error) {
    console.error("GET /orders error:", error);
    return res.status(500).json({ message: "Błąd pobierania zamówień." });
  }
});

app.listen(PORT, () => {
  console.log(`Server działa na porcie ${PORT}`);
});
