
function CheckAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.redirect('/');
    }
  }
  
  function CheckNotAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/dashboard');
    }
    next();
  }
  
  module.exports = {CheckAuth, CheckNotAuth}