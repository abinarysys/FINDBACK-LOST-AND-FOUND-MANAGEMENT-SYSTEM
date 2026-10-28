/// MODULES AND EXPORTS
const router = require("express").Router();
const db = require("../config/db.js");

// PHOTO UPLOAD HELPER
const toPicture = (p) =>
  p
    ? "/uploads/" +
      String(p)
        .replace(/^uploads[\\/]/, "")
        .replace(/^\/uploads[\\/]/, "")
    : "";

const day = (value) => (value ? String(value).slice(0, 10) : "");

//  
const mapLost = (item) => ({
  ...item,
  type: "lost",
  isClaimed: false,
  itemId: item.item_id ?? item.lost_id ?? item.id,
  picture: toPicture(item.photo_path),
  location: item.location,
  itemDate: day(item.date_lost),
  postedAt: day(item.created_at),
  sortDate: item.created_at,
  reporterName: item.full_name,
  reporterContact: item.contact_number,
});

const mapFound = (item) => ({
  ...item,
  type: "found",
  isClaimed: item.status === "claimed",
  itemId: item.item_id ?? item.found_id ?? item.id,
  picture: toPicture(item.photo_path),
  location: item.location,
  itemDate: day(item.date_found),
  postedAt: day(item.created_at),
  sortDate: item.created_at,
  reporterName: item.full_name,
  reporterContact: item.contact_number,
});

const combineItems = (lostRows, foundRows) =>
  [...lostRows.map(mapLost), ...foundRows.map(mapFound)].sort(
    (a, b) => new Date(b.sortDate) - new Date(a.sortDate),
  );

// LANDING PAGE
router.get("/", (req, res) => {
  // GET CATEGORY AS BUTTONS IN LANDING PAGE
  const getCategory = "SELECT * FROM item_categories";
  db.query(getCategory, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("DB error");
    }
    // SHOW FEEDBACKS
    const feedback = `SELECT feedback.*, users.full_name FROM feedback LEFT JOIN users ON feedback.user_id = users.user_id
            ORDER BY feedback.feedback_id DESC`;
    db.query(feedback, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Could not load feedback");
      }
      // SHOW LOST ITEMS
      const lostItems = `SELECT lost_items.*, users.full_name, users.contact_number, item_categories.category_name,
                lost_items.location, lost_items.date_lost, lost_items.photo_path, lost_items.created_at
                FROM lost_items LEFT JOIN users ON lost_items.user_id = users.user_id LEFT JOIN item_categories
                ON lost_items.category_id = item_categories.category_id`;
      db.query(lostItems, (err, lostResults) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Could not load lost items");
        }
        // SHOW FOUND ITEMS
        const foundItems = `SELECT found_items.*, users.full_name, users.contact_number, item_categories.category_name,
                    found_items.location, found_items.date_found, found_items.photo_path, found_items.created_at
                    FROM found_items LEFT JOIN users ON found_items.user_id = users.user_id LEFT JOIN item_categories
                    ON found_items.category_id = item_categories.category_id`;
        db.query(foundItems, (err, foundResults) => {
          if (err) {
            console.error(err);
            return res.status(500).send("Could not load found items");
          }
          // COMBNINE BOTH AS RECENT ITEMS
          const recentItems = combineItems(lostResults, foundResults).slice(
            0,
            4,
          );
          return res.render("index", {
            categories: results,
            feedbackList: result,
            recentItems,
          });
        });
      });
    });
  });
});

// STATIC CONTACT PAGE
router.get("/contacts", (req, res) => {
  res.render("contact");
});

// STATIC HOW IT WORKS PAGE
router.get("/howitworks", (req, res) => {
  res.render("howitworks");
});

// BROWSE ITEMS
router.get("/browse", (req, res) => {
  // THIS IS TO GO TO EVERY PAGE BY THGE CATEGORY TAPPED IN THE SCREEN
  db.query(
    "SELECT * FROM item_categories ORDER BY category_id",
    (err, categories) => {
      if (err) {
        console.error(err);
        return res.status(500).send("DB error");
      }

      // LOST ITEMS
      const lostSql = `SELECT lost_items.*, users.full_name, users.contact_number, item_categories.category_name
            FROM lost_items
            LEFT JOIN users ON lost_items.user_id = users.user_id
            LEFT JOIN item_categories ON lost_items.category_id = item_categories.category_id`;

      db.query(lostSql, (err, lostRows) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Could not load lost items");
        }
        // FOUND ITEMS
        const foundSql = `SELECT found_items.*, users.full_name, users.contact_number, item_categories.category_name
                FROM found_items
                LEFT JOIN users ON found_items.user_id = users.user_id
                LEFT JOIN item_categories ON found_items.category_id = item_categories.category_id`;

        db.query(foundSql, (err, foundRows) => {
          if (err) {
            console.error(err);
            return res.status(500).send("Could not load found items");
          }

          // COMBINE THE TWO AS ITEMS (AT THE TOP, WE SPREAD ITEMS AND ADDED ADDITIONAL INFO TO PUT ON THE EJS FILE LATER ON)
          const items = combineItems(lostRows, foundRows);

          res.render("browseitems", {
            categories,
            items,
            searchQuery: String(req.query.q || "").trim().slice(0, 80),
            activeCategory: req.query.category || "all",
            activeType: ["lost", "found", "claimed"].includes(req.query.type)
              ? req.query.type
              : "all",
          });
        });
      });
    },
  );
});

//CATEGORY ROUTES (one route per category)

// ELECTRONICS
router.get("/Electronics", (req, res) => {
  const getLostElectronics = `SELECT * FROM lost_items WHERE category_id = 1`;
  db.query(getLostElectronics, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("DB error");
    }
    const getFoundElectronics = `SELECT * FROM found_items WHERE category_id = 1`;
    db.query(getFoundElectronics, (err, foundResults) => {
      if (err) {
        console.error(err);
        return res.status(500).send("DB error");
      }
      res.render("electronics", { items: combineItems(results, foundResults) });
    });
  });
});


// BAGS
router.get("/Bags", (req, res) => {
  const getLostBags = `SELECT * FROM lost_items WHERE category_id = 2`;
  db.query(getLostBags, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("DB error");
    }
    const getFoundBags = `SELECT * FROM found_items WHERE category_id = 2`;
    db.query(getFoundBags, (err, foundResults) => {
      if (err) {
        console.error(err);
        return res.status(500).send("DB error");
      }
      res.render("bags", { items: combineItems(results, foundResults) });
    });
  });
});

// IDs AND CARDS
router.get("/IDsandCards", (req, res) => {
  const getLostIDs = `SELECT * FROM lost_items WHERE category_id = 3`;
  db.query(getLostIDs, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("DB error");
    }
    const getFoundIDs = `SELECT * FROM found_items WHERE category_id = 3`;
    db.query(getFoundIDs, (err, foundResults) => {
      if (err) {
        console.error(err);
        return res.status(500).send("DB error");
      }
      res.render("idandcards", { items: combineItems(results, foundResults) });
    });
  });
});

// KEYS
router.get("/Keys", (req, res) => {
  const getLostKeys = `SELECT * FROM lost_items WHERE category_id = 4`;
  db.query(getLostKeys, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("DB error");
    }
    const getFoundKeys = `SELECT * FROM found_items WHERE category_id = 4`;
    db.query(getFoundKeys, (err, foundResults) => {
      if (err) {
        console.error(err);
        return res.status(500).send("DB error");
      }
      res.render("keys", { items: combineItems(results, foundResults) });
    });
  });
});

// CLOTHING
router.get("/Clothing", (req, res) => {
  const getLostClothing = `SELECT * FROM lost_items WHERE category_id = 5`;
  db.query(getLostClothing, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("DB error");
    }
    const getFoundClothing = `SELECT * FROM found_items WHERE category_id = 5`;
    db.query(getFoundClothing, (err, foundResults) => {
      if (err) {
        console.error(err);
        return res.status(500).send("DB error");
      }
      res.render("clothing", { items: combineItems(results, foundResults) });
    });
  });
});

// WALLETS
router.get("/Wallets", (req, res) => {
  const getLostWallets = `SELECT * FROM lost_items WHERE category_id = 6`;
  db.query(getLostWallets, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("DB error");
    }
    const getFoundWallets = `SELECT * FROM found_items WHERE category_id = 6`;
    db.query(getFoundWallets, (err, foundResults) => {
      if (err) {
        console.error(err);
        return res.status(500).send("DB error");
      }
      res.render("wallets", { items: combineItems(results, foundResults) });
    });
  });
});

// OTHERS
router.get("/Others", (req, res) => {
  const getLostOthers = `SELECT * FROM lost_items WHERE category_id = 7`;
  db.query(getLostOthers, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("DB error");
    }
    const getFoundOthers = `SELECT * FROM found_items WHERE category_id = 7`;
    db.query(getFoundOthers, (err, foundResults) => {
      if (err) {
        console.error(err);
        return res.status(500).send("DB error");
      }
      res.render("others", { items: combineItems(results, foundResults) });
    });
  });
});

module.exports = router;
