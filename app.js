require("dotenv").config(); // must be first so process.env is filled

// MODULES
const express = require("express");
const session = require("express-session");
const http = require("http");
const { Server } = require("socket.io");
const flash = require("connect-flash");

// SECURITY MIDDLEWARE
const { applySecurity } = require("./middleware/security");

// IF THERE IS NO SESSION SECRET IN .env FILE
if (!process.env.SESSION_SECRET) {
  throw new Error(
    "SESSION_SECRET is missing. Add SESSION_SECRET=<long random text> to your .env file.",
  );
}

// CREATE EXPRESS APPLICATION
const app = express();

// WE HAVWE HTTP MODULE BECAUSE SOCKET.IO CANNOT WORK WITHOUT A SERVER
const server = http.createServer(app);
const io = new Server(server);

// SECURITY
app.set("trust proxy", 1);
applySecurity(app); // secure headers: BEFORE session and routes

// BUILT MIDDLEWARWE
app.use(express.urlencoded({ extended: true, limit: "50kb" }));
app.use(express.json({ limit: "100kb" }));

// CONFIGURE SESSION MIDDLEWARE
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // JS IN THE CONSOLE CANNOT READ THE COOKIE
    sameSite: "lax", // BLOCKS CROSS-SITE REQUEST COOKIES
    secure: process.env.NODE_ENV === "production", // HTTPS ONLY IN PRODUCTION
    maxAge: 1000 * 60 * 60 * 8, // 8 HOURSY
  },
});
app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);

// FLASH (THE MESSSAGE SHOWING IF YOU CREATED A TASK, CAN BE SUCCESS OR ERROR)
app.use(flash());
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// FOR UPLOADS
app.use(express.static("public"));

// EJS IS FOR US TO USE JS INSIDE AN HTML MAKING IT AN EJS OR EMBEDDED JAVASCRIPT FILE
app.set("view engine", "ejs");

app.set("io", io);

// WEB SOCKET
// ONLY SESSION USERS CAN CONNECRT TO WEB SOCKET
io.use((socket, next) => {
  if (!socket.request.session?.user?.user_id) {
    return next(new Error("unauthorized"));
  }
  next();
});

io.on("connection", (socket) => {
  const sessUser = socket.request.session?.user;
  if (sessUser) {
    socket.join(`user:${sessUser.user_id}`); // private room per user
    if (sessUser.role === "admin") socket.join("admins");
  }
  console.log("A user connected:", socket.id);
  socket.on("disconnect", () => console.log("A user disconnected:", socket.id));
});

// MIDDLEWARES
const userMiddleware = require("./middleware/user-middleware.js");
const upload = require("./middleware/upload-middleware.js");

//using the middleware
app.use(userMiddleware);

// currentPath lets the navigation highlight the page you are on; the theme is loaded per user.
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});
app.use(require("./middleware/user-theme.js"));

// Extras added to every page for logged-in users, including admin pages:
//  1. the user's saved theme, applied at the top of <head> so there is no flash of the wrong theme
//  2. shared appearance overrides, added after each page's own stylesheets
//  3. the notification bell
const globalBell = require("./config/global-bell.js");
const { themeScript } = require("./config/theme.js");

app.use((req, res, next) => {
  const user = req.session?.user;
  if (!user) return next();
  const isAdminRoute = req.path.startsWith("/admin");

  const render = res.render.bind(res);
  res.render = (view, options, callback) => {
    if (typeof options === "function") {
      callback = options;
      options = undefined;
    }
    if (callback) return render(view, options, callback); // caller wants the raw HTML

    render(view, options, (err, html) => {
      if (err) return next(err);

      if (typeof html === "string") {
        const head = html.match(/<head[^>]*>/i);
        if (head) {
          const script = themeScript(user.theme, true);
          html = html.replace(head[0], () => head[0] + script);
        }

        const end = html.toLowerCase().lastIndexOf("</body>");
        if (end !== -1) {
          const themeStyles = '<link id="fb-theme-overrides" rel="stylesheet" href="/css/theme-overrides.css">';
          const extras =
            (isAdminRoute || html.includes('id="notifBell"') ? "" : globalBell) +
            (html.includes('id="fb-theme-overrides"') ? "" : themeStyles);
          html = html.slice(0, end) + extras + html.slice(end);
        }
      }
      res.send(html);
    });
  };
  next();
});

// MOUNT ROUTERS
app.use("/", require("./routers/landing-router.js"));
app.use("/auth", require("./routers/auth-router.js")); 
app.use("/fb", require("./routers/feedback-router.js"));
app.use("/lost", require("./routers/lostItem-router.js"));
app.use("/found", require("./routers/foundItem-router.js"));
app.use("/admin", require("./routers/admin-router.js"));
app.use("/user", require("./routers/userprofile-router.js"));
app.use("/claim", require("./routers/claim-router.js"));
app.use("/user/settings", require("./routers/usersettings-router.js"));
app.use("/user/chat", require("./routers/userchat-router.js"));
app.use("/user/notifications", require("./routers/notification-router.js"));
app.use("/user/claims", require("./routers/user-claims-router.js"));

server.listen(4000, () => {
  console.log("FINDBACK running at http://localhost:4000");
});
