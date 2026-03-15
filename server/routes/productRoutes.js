const express = require("express")
const router = express.Router()
const productController = require("../controllers/productController")
const upload = require("../middleware/upload")

router.get("/trending", productController.getTrendingProducts)
router.get("/category/:id", productController.getProductsByCategory)
router.get("/search/:text", productController.searchProducts)
router.get("/", productController.getProducts)
router.get("/:id", productController.getProductById)

router.post("/", upload.array("images", 10), productController.createProduct)
router.put("/:id", upload.array("images", 10), productController.updateProduct)
router.delete("/:id", productController.deleteProduct)

module.exports = router