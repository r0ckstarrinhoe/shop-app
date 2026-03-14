PROJEKT: Shop App

REPOZYTORIUM
https://github.com/r0ckstarrinhoe/shop-app

STACK
Frontend: React (Vite)
Backend: Express
ORM: Prisma
Database: MySQL (XAMPP)
Auth: JWT
Uploads: Multer

PORTY
Frontend: http://localhost:5173
Backend: http://localhost:3000
Database: localhost:3306

STRUKTURA
shop-app/
  client/ → React frontend
  server/ → Express backend
  server/prisma → schema bazy
  server/uploads → zdjęcia produktów

FUNKCJE
- lista produktów
- kategorie po lewej stronie
- strona produktu z galerią zdjęć
- koszyk z ilością produktów
- trendujące produkty
- upload wielu zdjęć produktu
- admin login JWT

API

Produkty
GET /products
GET /products/:id
GET /products/trending
GET /products/category/:id
GET /products/search/:text

Kategorie
GET /categories
POST /categories

Admin
POST /admin/register
POST /admin/login

Produkty admin
POST /products
PUT /products/:id
DELETE /products/:id

WORKFLOW
git add .
git commit -m "opis zmiany"
git push

ZASADA W CZACIE
odpowiedzi mają zawierać całe pliki do podmiany