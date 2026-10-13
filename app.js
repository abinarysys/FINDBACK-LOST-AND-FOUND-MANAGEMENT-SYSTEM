const express = require('express')
const db = require('./config/db.js')
const session = require('express-session')
const http = require('http')
const { Server } = require('socket.io')

const app = express();
const server = http.createServer(app)
const io = new Server (server)

app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(session({
    secret: 's3cr3t',
    resave: false,
    saveUninitialized: false
}))
app.use(express.static('public'))

app.set("view engine", "ejs")

app.get("/", (req,res) =>{
    const getCategory = `SELECT * FROM item_categories`;
    db.query(getCategory, (err, results) =>{
        if(err){
            console.log(err)
            return res.status(500).send("DB error")
        }else{
            res.render("index", {categories: results})
        }
    })
})

server.listen(4000)