const express = require('express');
const router = express.Router();
const Author = require('../models/author');

/* GET authors listing. */
router.get('/', async (req, res) => {
   searchOptions = {}
  if (req.query.name != null && req.query.name !== '') {
    searchOptions.name = new RegExp(req.query.name, 'i')
  }
  try {
    const authors = await Author.find(searchOptions);
    res.render('authors/index', {authors: authors, searchOptions: req.query});
  }
  catch (error) {
    res.redirect('/');
  }
});

/* GET new author form. */
router.get('/new', (req, res) => {
  res.render('authors/new', {author: new Author()});
});

/* POST create new author. */
router.post('/', async (req, res) => {
  const author = new Author({
    name: req.body.name
  });
  try {
    await author.save();
    res.redirect('authors');
  }
  catch (error) {
    res.render('authors/new', {
      author: author,
      errorMessage: error.message
    });
  } 
}
);
module.exports = router;