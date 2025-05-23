const express = require("express");
const router = express.Router();


const {handleCheckOrAddProduct, handleGetProduct, handleCompare}  = require('../controller/product')

router.post("/",handleCheckOrAddProduct);
router.get("/:id",handleGetProduct);

module.exports = router;
