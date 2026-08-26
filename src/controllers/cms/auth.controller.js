const authService = require('../../services/auth.service');
const { setAuthCookie, isWebClient } = require('../../utils/auth-cookie');

async function signin(req, res, next) {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.cmsSignin({ email, password });

    if (isWebClient(req)) {
      setAuthCookie(res, token, 'cms');
      return res.status(200).json({ user });
    }

    res.status(200).json({ user, token });
  } catch (err) {
    next(err);
  }
}

module.exports = { signin };
