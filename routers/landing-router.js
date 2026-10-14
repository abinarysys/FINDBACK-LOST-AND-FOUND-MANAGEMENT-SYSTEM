const router = require('express').Router();
const db = require('../config/db.js');

router.get("/", (req, res) => {
    const getCategory = "SELECT * FROM item_categories"
    db.query(getCategory, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("DB error");
        }
        const feedback = `SELECT feedback.*, users.full_name FROM feedback LEFT JOIN users ON feedback.user_id = users.user_id
        ORDER BY feedback.feedback_id DESC`
        db.query(feedback, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Could not load feedback");
            }
            const lostItems = `SELECT lost_items.*, users.full_name, users.contact_number, item_categories.category_name,
                lost_items.location, lost_items.date_lost, lost_items.photo_path, lost_items.created_at
                FROM lost_items LEFT JOIN users ON lost_items.user_id = users.user_id LEFT JOIN item_categories
                ON lost_items.category_id = item_categories.category_id`
            db.query(lostItems, (err, lostResults) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Could not load lost items")
                }
                const foundItems = `SELECT found_items.*, users.full_name, users.contact_number, item_categories.category_name,
                    found_items.location, found_items.date_found, found_items.photo_path, found_items.created_at
                    FROM found_items LEFT JOIN users ON found_items.user_id = users.user_id LEFT JOIN item_categories
                    ON found_items.category_id = item_categories.category_id`
                db.query(foundItems, (err, foundResults) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send("Could not load found items");
                    }
                    const recentItems = [
                        ...lostResults.map(item => ({
                            ...item,
                            type: "lost",
                            picture: item.photo_path ? '/uploads/' + item.photo_path.replace(/^uploads[\\/]/, '').replace(/^\/uploads[\\/]/, '') : '',
                            location: item.location,
                            itemDate: item.date_lost ? String(item.date_lost).slice(0, 10) : '',
                            postedAt: item.created_at ? String(item.created_at).slice(0, 10) : '',
                            sortDate: item.created_at,
                            reporterName: item.full_name,
                            reporterContact: item.contact_number
                        })),

                        ...foundResults.map(item => ({
                            ...item,
                            type: "found",
                            picture: item.photo_path ? '/uploads/' + item.photo_path.replace(/^uploads[\\/]/, '').replace(/^\/uploads[\\/]/, '') : '',
                            location: item.location,
                            itemDate: item.date_found ? String(item.date_found).slice(0, 10) : '',
                            postedAt: item.created_at ? String(item.created_at).slice(0, 10) : '',
                            sortDate: item.created_at,
                            reporterName: item.full_name,
                            reporterContact: item.contact_number
                        }))
                    ].sort((a, b) => {
                        return new Date(b.sortDate) - new Date(a.sortDate);
                    });
                    return res.render("index", {
                        categories: results,
                        feedbackList: result,
                        recentItems
                    });
                });
            });
        });
    });
});

router.get("/contact", (req,res) =>{
    res.render("contact")
})

router.get("/howitworks", (req,res) =>{
    res.render("howitworks")
})

router.get("/browse", (req,res) =>{
    res.render("browseitems")
})

module.exports = router;