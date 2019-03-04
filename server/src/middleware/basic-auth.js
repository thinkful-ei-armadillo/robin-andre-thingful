function requireAuth(req, res, next) {
  const token = req.get('Authorization') || '';
  let bearerToken;

  if(! token.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({error: 'Missing bearer token'});
  } else {
    bearerToken = token.slice(7, token.length);
  }

  const [tokenUserName, tokenPassword] = Buffer
    .from(bearerToken, 'base64')
    .toString()
    .split(':');
  
  if(! tokenUserName || ! tokenPassword) {
    return res.status(401).json({error: 'Unauthorized request'});
  }

  req.app.get('db')('thingful_users')
    .where({ user_name: tokenUserName})
    .first()
    .then(user => {
      if(! user || user.password !== tokenPassword) {
        return res.status(401).json({error: 'Unauthorized request'});
      }

      req.user = user;
      next();
    })
    .catch(next);
}

module.exports = {requireAuth};