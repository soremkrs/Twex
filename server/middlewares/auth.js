// Middleware to protect routes that require user authentication
// Checks if the user is authenticated (logged in) via Passport
// If authenticated, calls next() to continue to the route handler
// If not authenticated, responds with HTTP 401 Unauthorized and a JSON message
export const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Unauthorized" });
};
