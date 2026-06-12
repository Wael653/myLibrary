const express = require("express");
const router = express.Router();
const Author = require("../models/author");
const Book = require("../models/book");

/* GET authors listing. */
router.get("/", async (req, res) => {
  const searchOptions = {};
  if (req.query.name != null && req.query.name !== "") {
    searchOptions.name = new RegExp(req.query.name, "i");
  }
  try {
    const authors = await Author.find(searchOptions);
    res.render("authors/index", { authors: authors, searchOptions: req.query });
  } catch (error) {
    res.redirect("/");
  }
});

/* GET new author form. */
router.get("/new", (req, res) => {
  res.render("authors/new", { author: new Author() });
});

/* GET author detail. */
router.get("/:id", async (req, res) => {
  try {
    const author = await Author.findById(req.params.id);
    const booksByAuthor = await Book.find({ author: author.id }).limit(6).exec();
    res.render("authors/show", { author: author, booksByAuthor: booksByAuthor });
  } catch (error) {
    console.error(error);
    res.redirect("/authors");
  }
});

/* GET author edit form. */
router.get("/:id/edit", async (req, res) => {
  try {
    const author = await Author.findById(req.params.id);
    if (author == null) {
      return res.redirect("/authors");
    }
    res.render("authors/edit", { author: author });
  } catch (error) {
    res.redirect("/authors");
  }
});

/* PUT update author. */
router.put("/:id", async (req, res) => {
  let author;
  try {  
    author = await Author.findById(req.params.id);
    author.name = req.body.name;
    await author.save();
    res.redirect(`/authors/${author.id}`);
  } catch (error) {
    if (author == null) {
      return res.redirect("/authors");
    }
    res.render("authors/edit", {
      author: author,
      errorMessage: error.message,
    });
  }
});

/* DELETE author. */
router.delete("/:id", async (req, res) => {
  let author;
  try {
    author = await Author.findById(req.params.id);
    await author.deleteOne();
    res.redirect("/authors");
  } catch (error) {
    console.error("DELETE /authors/:id error:", error);
    if (author == null) {
      return res.redirect("/authors");
    }
    res.redirect(`/authors/${author.id}`);
  }
});

/* POST create new author. */
router.post("/", async (req, res) => {
  const author = new Author({
    name: req.body.name,
  });
  try {
    await author.save();
    res.redirect(`/authors/${author.id}`);
  } catch (error) {
    res.render("authors/new", {
      author: author,
      errorMessage: error.message,
    });
  }
});

module.exports = router;
