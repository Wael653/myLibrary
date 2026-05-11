const express = require('express');
const router = express.Router();
const Book = require('../models/book');

/* GET home page. */
router.get('/', async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 }).limit(5);
    res.render('index', { books: books });
  } catch (error) {
    console.error(error);
    res.redirect('/');
  }
});

module.exports = router;