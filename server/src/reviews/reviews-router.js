const express = require('express')
const path = require('path')
const ReviewsService = require('./reviews-service')

const reviewsRouter = express.Router()
const jsonBodyParser = express.json()

reviewsRouter
  .route('/')
  .all((req, res, next) => {
    // get user id from username
    const token = req.get('Authorization').slice(7) || '';
    const unpw = Buffer.from(token, 'base64').toString().split(':');

    req.app.get('db')
      .select('*')
      .from('thingful_users')
      .where('user_name', unpw[0])
      .then(user => {
        if(! user || user[0].password !== unpw[1]) {
          return res.status(401).json({ error: 'Unauthorized request' });
        }

        req.user = user[0];
        next();
      });
  })
  .post(jsonBodyParser, (req, res, next) => {
    const { thing_id, rating, text } = req.body;
    const newReview = { thing_id, rating, text, user_id: req.user.id };
    console.log(newReview);

    for (const [key, value] of Object.entries(newReview))
      if (value == null)
        return res.status(400).json({
          error: `Missing '${key}' in request body`
        })

    ReviewsService.insertReview(
      req.app.get('db'),
      newReview
    )
      .then(review => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${review.id}`))
          .json(ReviewsService.serializeReview(review))
      })
      .catch(next)
    })

module.exports = reviewsRouter
