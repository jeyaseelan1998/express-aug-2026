const authService = require('../../services/auth.service');
const { setAuthCookie, isWebClient } = require('../../utils/auth-cookie');

async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const { user, token } = await authService.signup({ name, email, password });
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

async function signin(req, res, next) {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.signin({ email, password });

    if (isWebClient(req)) {
      setAuthCookie(res, token, 'web');
      return res.status(200).json({ user });
    }

    res.status(200).json({ user, token });
  } catch (err) {
    next(err);
  }
}

// requireAuth has already resolved and populated the account behind the token,
// so there is nothing left to look up here.
function profile(req, res) {
  res.status(200).json({ user: req.user });
}

module.exports = { signup, signin, profile };
