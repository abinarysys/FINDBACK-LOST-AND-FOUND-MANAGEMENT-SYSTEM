const router = require('express').Router();
const db = require('../config/db.js');

router.get("/", (req, res) => {
const getCategory = "SELECT * FROM item_categories";
db.query(getCategory, (err, results) => {
    if (err) {
        console.log('Category error:', err);
        return res.status(500).send("DB error");
    }

    const feedbackQuery = `
        SELECT feedback.*, users.full_name FROM feedback LEFT JOIN users ON feedback.user_id = users.user_id ORDER BY feedback.feedback_id DESC`;

    db.query(feedbackQuery, (err, feedbackResults) => {
        if (err) {
            console.log('Feedback list error:', err);
            return res.status(500).send("Could not load feedback");
        }

        return res.render("index", {
            categories: results,
            user: req.session.user || null,
            feedbackList: feedbackResults
        });
    });
});

});

module.exports = router;
