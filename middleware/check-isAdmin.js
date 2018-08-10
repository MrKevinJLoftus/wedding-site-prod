const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // token is going to be the value of the 'authorization' http header
  // token will be in format "Bearer abcd1234..."
  // split on the white space to grab the token value
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token,
      process.env.JWT_KEY
    );
    if (decodedToken.isAdmin === false) {
      res.status(401).json({message: "Authorization failed!"});
    }
    req.userData = {username: decodedToken.username, userId: decodedToken.userId};
    // if code gets here with no errors thrown, token is present and valid
    next();
  } catch (error) {
    res.status(401).json({message: "Authorization failed!"});
  }
}
