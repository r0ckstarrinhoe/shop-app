import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

/* ---------------- UPLOAD KONFIGURACJA ---------------- */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

/* ---------------- JWT MIDDLEWARE ---------------- */

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Brak tokena" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.admin = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ error: "Token nieprawidłowy" });
  }
};

/* ---------------- TEST ---------------- */

app.get("/", (req, res) => {
  res.send("API działa");
});

/* ---------------- ADMIN ---------------- */

app.post("/admin/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const existing = await prisma.admin.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(400).json({ error: "Admin już istnieje" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    res.json(admin);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return res.status(401).json({ error: "Nieprawidłowy email lub hasło" });
    }

    const valid = await bcrypt.compare(password, admin.password);

    if (!valid) {
      return res.status(401).json({ error: "Nieprawidłowy email lub hasło" });
    }

    const token = jwt.sign(
      { adminId: admin.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

/* ---------------- KATEGORIE ---------------- */

app.post("/categories", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    const category = await prisma.category.create({
      data: { name },
    });

    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.get("/categories", async (req, res) => {
  try {
    const categories = await prisma.category.findMany();

    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

/* ---------------- PRODUKTY ---------------- */

app.post(
  "/products",
  authMiddleware,
  upload.array("images", 10),
  async (req, res) => {
    try {
      const { name, description, price, categoryId } = req.body;

      const product = await prisma.product.create({
        data: {
          name,
          description,
          price: parseFloat(price),
          categoryId: parseInt(categoryId),
          images: {
            create: (req.files || []).map((file) => ({
              filename: file.filename,
            })),
          },
        },
        include: {
          category: true,
          images: true,
        },
      });

      res.json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Błąd serwera" });
    }
  }
);

/* ---------------- TRENDING ---------------- */

app.get("/products/trending", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isTrending: true,
      },
      include: {
        category: true,
        images: true,
      },
      take: 5,
      orderBy: {
        id: "desc",
      },
    });

    res.json(products);
  } catch (error) {
    console.error("Błąd GET /products/trending:", error);
    res.status(500).json({
      error: "Błąd serwera",
      details: error.message,
    });
  }
});

/* ---------------- PRODUKTY WG KATEGORII ---------------- */

app.get("/products/category/:id", async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);

    const products = await prisma.product.findMany({
      where: {
        categoryId: categoryId,
      },
      include: {
        category: true,
        images: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

/* ---------------- WYSZUKIWANIE ---------------- */

app.get("/products/search/:text", async (req, res) => {
  try {
    const text = req.params.text;

    const products = await prisma.product.findMany({
      where: {
        name: {
          contains: text,
        },
      },
      include: {
        category: true,
        images: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

/* ---------------- WSZYSTKIE PRODUKTY ---------------- */

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

    res.json(products);
  } catch (error) {
    console.error("Błąd GET /products:", error);
    res.status(500).json({
      error: "Błąd serwera",
      details: error.message,
    });
  }
});

/* ---------------- PRODUKT PO ID ---------------- */

app.get("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Nieprawidłowe id produktu" });
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: true,
      },
    });

    if (!product) {
      return res.status(404).json({ error: "Produkt nie istnieje" });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

/* ---------------- UPDATE PRODUKTU ---------------- */

app.put("/products/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const { name, description, price, categoryId, isTrending } = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: parseFloat(price),
        categoryId: parseInt(categoryId),
        isTrending,
      },
      include: {
        category: true,
        images: true,
      },
    });

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

/* ---------------- USUWANIE PRODUKTU ---------------- */

app.delete("/products/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    await prisma.product.delete({
      where: { id },
    });

    res.json({ message: "Produkt usunięty" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

/* ---------------- START SERWERA ---------------- */

app.listen(3000, () => {
  console.log("Server działa na http://localhost:3000");
});
