const express = require("express");
const router = express.Router();


const {handleAddProduct,handleGetProduct}  = require('../controller/product')

router.post("/",handleAddProduct);
router.get("/:id",handleGetProduct);

module.exports = router;
