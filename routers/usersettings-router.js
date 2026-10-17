// MODULES
const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const db = require('../config/db.js');

// MIDDLEWARES
const authMiddleware = require('../middleware/auth-middleware.js');
const upload = require('../middleware/upload-middleware.js');

router.get("/", (req,res) =>{
    res.render("user/settings")
})

module.exports = router;