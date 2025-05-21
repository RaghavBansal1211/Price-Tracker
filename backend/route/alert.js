const express = require("express");
const router = express.Router();

const {handleCreateAlert,handleGetAlert}  = require('../controller/alert')

router.post("/",handleCreateAlert);
router.get("/:id",handleGetAlert);

module.exports = router;
