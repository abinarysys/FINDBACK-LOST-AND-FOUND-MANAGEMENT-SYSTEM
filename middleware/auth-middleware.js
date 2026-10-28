module.exports = (req, res, next) => {
  if (!req.session.user) {
    req.flash("error", "Please login first");
    return res.redirect("/auth/login");
  }

  next();
}; // if not user, do not authorized that person to get into this page
