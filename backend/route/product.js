const express = require("express");
const router = express.Router();


const {handleCheckOrAddProduct, handleGetProductByuserId, handlefetchAllUserProducts}  = require('../controller/product')

router.post("/",handleCheckOrAddProduct);
router.get("/fetchAll",handlefetchAllUserProducts)
router.get("/:productId",handleGetProductByuserId);


module.exports = router;
