const express = require("express");
const router = express.Router();


const {handleCheckOrAddProduct}  = require('../controller/product')

router.post("/",handleCheckOrAddProduct);

module.exports = router;
