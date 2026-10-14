const router = require('express').Router();
const db = require('../config/db.js');

router.get("/", (req, res) => {
    const getCategory = "SELECT * FROM item_categories";
    db.query(getCategory, (err, results) => {
        if (err) {
            return res.status(500).send("DB error");
        }
        const feedback = `SELECT feedback.*, users.full_name FROM feedback LEFT JOIN users ON feedback.user_id = users.user_id ORDER BY feedback.feedback_id DESC`;
        db.query(feedback, (err, result) => {
            if (err) {
                return res.status(500).send("Could not load feedback");
            }
            return res.render("index", {
                categories: results,
                feedbackList: result
        })
    })
})
})

module.exports = router;
