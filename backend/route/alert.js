const express = require("express");
const router = express.Router();

const {handleCreateAlert}  = require('../controller/alert')

router.post("/",handleCreateAlert);


module.exports = router;
