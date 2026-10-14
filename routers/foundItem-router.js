const router = require('express').Router()
const db = require('../config/db.js');

router.get("/", (req,res) =>{
    res.render("submitFoundItem")
})

module.exports = router;