const mysql2 = require('mysql2')

const db = mysql2.createConnection({
    host: "localhost",
    user: "root",
    password: "{password_here}",
    database: "findback_db"

})

module.exports = db;