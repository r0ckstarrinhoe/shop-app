# 🛒 Shop App

Full-stack sklep internetowy zbudowany w oparciu o **React + Express + Prisma + MySQL**.

Projekt zawiera frontend sklepu, backend API oraz bazę danych z obsługą produktów, kategorii i zamówień.

---

# 🚀 Tech Stack

Frontend
- React (Vite)
- React Router
- Context API (koszyk)

Backend
- Node.js
- Express
- Prisma ORM
- JWT authentication
- Multer (upload zdjęć)

Database
- MySQL (XAMPP)

Tools
- Git
- GitHub
- VSCode

---

# 📦 Funkcje aplikacji

### Sklep
- lista produktów
- filtrowanie po kategorii
- strona produktu z galerią zdjęć
- koszyk z możliwością zmiany ilości
- responsywny layout (mobile)

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

client/ → frontend React  
server/ → backend Express  
server/prisma → schema bazy danych  
server/uploads → zdjęcia produktów  

---

# ⚙️ Instalacja projektu

## 1️⃣ Klonowanie repo

git clone https://github.com/YOUR_USERNAME/shop-app.git  
cd shop-app

---

# Backend setup

cd server

npm install

Utwórz plik `.env`

DATABASE_URL="mysql://root:@localhost:3306/shop_db"  
JWT_SECRET="super_secret_key"

Synchronizacja bazy:

npx prisma db push  
npx prisma generate

Uruchom backend:

npm run dev

Backend działa na:

http://localhost:3000

---

# Frontend setup

cd client

npm install

npm run dev

Frontend działa na:

http://localhost:5173

---

# 📷 Upload zdjęć

Zdjęcia produktów zapisywane są w folderze:

server/uploads

Dostęp do zdjęć:

http://localhost:3000/uploads/filename.jpg

---

# 🔐 Admin API

Rejestracja admina

POST /admin/register

Logowanie

POST /admin/login

Token należy wysyłać w nagłówku:

Authorization: Bearer TOKEN

---

# 📡 API endpoints

Produkty

GET /products  
GET /products/:id  
GET /products/trending  
GET /products/category/:id  
GET /products/search/:text  

Kategorie

GET /categories  
POST /categories  

Produkty (admin)

POST /products  
PUT /products/:id  
DELETE /products/:id  

---

# 💻 Workflow development

Typowy workflow pracy z Git

git add .  
git commit -m "opis zmiany"  
git push

Przykład

git commit -m "responsive product page"

---

# 🧠 Context projektu (dla AI / developerów)

Projekt to sklep internetowy typu headless.

Frontend
React konsumujący REST API

Backend
Express API + Prisma ORM

Architektura

Frontend → API → Database

Porty lokalne

Frontend: 5173  
Backend: 3000  
Database: 3306  

---

# 🧠 Zasady rozwoju projektu

1. każda funkcja ma osobny commit
2. backend i frontend rozwijane niezależnie
3. pliki .env, node_modules, uploads nie są commitowane
4. API rozwijane jako REST

---

# 🔮 Plan rozwoju

Admin Panel
- UI do dodawania produktów
- zarządzanie produktami
- zarządzanie kategoriami
- oznaczanie trendujących produktów

Checkout
- formularz zamówienia
- zapis zamówienia w bazie

Payments
- Stripe
- PayPal
- Przelewy24

Orders
- historia zamówień
- panel admina

Emails
- potwierdzenie zamówienia
- lista produktów

PDF
- generowanie faktury

---

# 📄 Licencja

Projekt edukacyjny