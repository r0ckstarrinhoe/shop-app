PROJECT: Shop App

STACK
Frontend: React (Vite)
Backend: Express
ORM: Prisma
Database: MySQL
Auth: JWT
Uploads: Multer

PORTS
Frontend: 5173
Backend: 3000
Database: 3306

FOLDERS
client/ → React frontend
server/ → Express backend
server/prisma/ → database schema
server/uploads/ → product images

FEATURES
- product listing
- categories sidebar
- product gallery
- cart with quantity
- trending products
- admin login
- upload multiple product images

MAIN API
GET /products
GET /products/:id
GET /products/trending
GET /products/category/:id
GET /products/search/:text

ADMIN API
POST /admin/register
POST /admin/login
POST /products
PUT /products/:id
DELETE /products/:id

DATABASE MODELS
Product
Category
ProductImage
Order
OrderItem

WORKFLOW
git add .
git commit -m "description"
git push