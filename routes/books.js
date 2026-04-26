const express = require('express');
const router = express.Router();
const Book = require('../models/book');
const Author = require('../models/author');

/* GET books listing. */
router.get('/', async (req, res) => {
    res.send('All Books');
});

// New Book Route
router.get('/new', async (req, res) => {
    try {
        const book = new Book();
        const authors = await Author.find({});
        res.render('books/new', {authors: authors, book: book});
    } catch (error) {
        res.redirect('/books');
    }   
});

/* POST create new author. */
router.post('/', async (req, res) => {
    res.send('Create Book');
}
);
module.exports = router;