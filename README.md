# 🛒 Shop App

Full-stack sklep internetowy zbudowany w oparciu o **React + Express + Prisma + MySQL**.

Projekt zawiera frontend sklepu, backend API oraz bazę danych z obsługą produktów, kategorii i zamówień.

---

# 🚀 Stack technologiczny

Frontend:
- React (Vite)
- React Router
- Context API (koszyk)

Backend:
- Node.js
- Express
- Prisma ORM
- JWT Authentication
- Multer (upload zdjęć)

Database:
- MySQL (XAMPP)

---

# 📦 Funkcje aplikacji

### Sklep
- lista produktów
- filtrowanie po kategorii
- strona produktu z galerią zdjęć
- koszyk z możliwością zmiany ilości
- responsywny layout (mobile friendly)

### Produkty
- wiele zdjęć produktu
- galeria ze strzałkami
- trendujące produkty na stronie głównej

### Admin
- logowanie admina (JWT)
- dodawanie produktów
- upload wielu zdjęć

### API
- produkty
- kategorie
- wyszukiwanie
- trendujące produkty

---

# 📁 Struktura projektu
shop-app
│
├── client # frontend React
│ ├── src
│ │ ├── components
│ │ ├── pages
│ │ ├── context
│ │ └── services
│
├── server # backend Express
│ ├── prisma
│ ├── uploads
│ └── server.js
│
└── README.md

---

# ⚙️ Instalacja projektu

## 1️⃣ Klonowanie repo
git clone https://github.com/YOUR_USERNAME/shop-app.git

cd shop-app

---

# Backend setup

Przejdź do folderu backendu:
cd server

Zainstaluj zaleznosc:
npm install

Utworz plik `.env`:
DATABASE_URL="mysql://root:@localhost:3306/shop_db"
JWT_SECRET="super_secret_key"

Synchronizacja bazy:
npx prisma db push
npx prisma generate

Uruchom backend:
npm run dev

Backend dziala na:
https://localhost:300

---

# Frontend setup

Przejdz do folderu:
cd client

Zainstaluj zaleznosci:
npm install

Uruchom aplikacje:
npm run dev

Frontend dziala na:
http://localhost:5137

---

# 📷 Upload zdjęć

Zdjęcia produktów zapisywane są w folderze:
server/uploads

Dostęp przez:
http://localhost:3000/uploads/filename.jpg

---

# 🔐 Admin API

### Rejestracja admina
POST /admin/register

### Logowanie
POST /admin/login

Otrzymany token nalezy wyslac w naglowku:
Authorization: Bearer TOKEN

---

# 📡 API endpoints

### Produkty
GET /products
GET /products/:id
GET /products/trending
GET /products/category/:id
GET /products/search/:text

### Kategorie
GET /categories
POST /categories

### Produkty (admin)
POST /products
PUT /products/:id
DELETE /products/:id

---

# 🧠 Plan rozwoju

- admin panel UI
- checkout
- płatności (Stripe / PayPal)
- system zamówień
- faktury PDF
- wysyłka email po zamówieniu

---

# 📄 Licencja

Projekt edukacyjny.
