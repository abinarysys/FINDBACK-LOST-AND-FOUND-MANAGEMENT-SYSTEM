// File guide: This module wraps callback-based MySQL queries in Promises for async handlers.
// Inputs and outputs: Express requests or configuration enter through its exports; it returns middleware, route responses, query results, or browser behavior as appropriate.
// Connections: Imports and router mounts in app.js show how other modules call this code.

// config/query.js
// Promise wrapper around your existing callback-style config/db.js,
// so controllers and middleware can use  await query(sql, params).
// Import the shared connection pool from db.js.
const db = require("./db.js");

// Export a helper that accepts SQL plus its placeholder values and returns a Promise.
// The empty array is the default when a query has no ? parameters.
module.exports = (sql, params = []) =>
  // A Promise lets route/controller code use await instead of nesting callbacks.
  new Promise((resolve, reject) => {
    // mysql2 runs the SQL; params fill ? placeholders in order, and the callback receives results or an error.
    db.query(sql, params, (err, results) => {
      // Reject makes await throw, so the calling handler can handle this error with try/catch.
      if (err) return reject(err);
      // Resolve returns the query result rows to the code that awaited this helper.
      resolve(results);
    });
  });
