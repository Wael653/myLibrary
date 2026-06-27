const express = require("express");
const router = express.Router();
const Book = require("../models/book");
const Author = require("../models/author");
const imageMimeTypes = ["image/jpeg", "image/png", "images/gif"];

/* GET books listing. */
router.get("/", async (req, res) => {
  let query = Book.find(); // query is a mongoose query object that we can add conditions to
  if (req.query.title != null && req.query.title !== "") {
    query = query.regex("title", new RegExp(req.query.title, "i"));
  }
  if (req.query.publishedAfter != null && req.query.publishedAfter !== "") {
    query = query.gte("publishDate", req.query.publishedAfter);
  }
  if (req.query.publishedBefore != null && req.query.publishedBefore !== "") {
    query = query.lte("publishDate", req.query.publishedBefore);
  }
  try {
    const books = await query.exec();
    res.render("books/index", { books: books, searchOptions: req.query });
  } catch (error) {
    console.error("dswwwwwwww");
    res.redirect("/");
  }
});

// New Book Route
router.get("/new", async (req, res) => {
  renderNewPage(res, new Book());
});

// Edit Book Route
router.get("/:id/edit", async (req, res) => {
  try {
  const book = await Book.findById(req.params.id);
  renderEditPage(res, book)
  } catch {
    res.redirect("/books");
  }

});

// Show Book Route
router.get("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate("author").exec();
    if (book == null) {
      return res.redirect("/books");
    }
    res.render("books/show", { book: book, errorMessage: null });
  }
  catch (error) {
    console.error(error);
    res.redirect("/");
  }
});

/* POST create new book. */
router.post("/", async (req, res) => {
  const book = new Book({
    title: req.body.title,
    author: req.body.author,
    publishDate: new Date(req.body.publishDate),
    pageCount: req.body.pageCount,
    description: req.body.description,
  });
  saveCover(book, req.body.cover);
  try {
    const newBook = await book.save();
    res.redirect(`books/${newBook.id}`);
  //  res.redirect("/books");
  } catch {
    renderNewPage(res, book, true);
  }
});
/* PUT update existing book. */
router.put("/:id", async (req, res) => {
  let book
  try {
    book = await Book.findById(req.params.id);
    book.title = req.body.title;
    book.author = req.body.author;
    book.publishDate = new Date(req.body.publishDate);
    book.pageCount = req.body.pageCount;
    book.description = req.body.description;
    if (req.body.cover != null && req.body.cover !== "") {
      saveCover(book, req.body.cover);
    }
    await book.save();
    res.redirect(`/books/${book.id}`);
  } catch {
    if (book != null) {
      renderEditPage(res, book, true);
    } else {
      res.redirect("/");
    }
  }
});

// DELETE delete book
router.delete("/:id", async (req, res) => {
  let book
  try {
    book = await Book.findById(req.params.id);
    if (book == null) {
      return res.redirect("/books");
    }
    await book.deleteOne();
    res.redirect("/books");
  }
  catch (error) {
    console.error("DELETE /books/:id error:", error);
    if (book != null) {
      res.render("books/show", {
        book: book,
        errorMessage: "Could not remove book",
      });
    } else {
      res.redirect("/");
    }
  }
});


async function renderNewPage(res, book, hasError = false) {
  renderFormPage(res, book, "new", hasError);
}

async function renderEditPage(res, book, hasError = false) {
  renderFormPage(res, book, "edit", hasError);
}

async function renderFormPage(res, book, form, hasError = false) {
  try {
    const authors = await Author.find({});
    const params = {
      authors: authors,
      book: book,
    };
    if (hasError) {
      if (form === "edit") params.errorMessage = "Error Updating Book";
      else params.errorMessage = "Error Creating Book";
    }
    res.render(`books/${form}`, params);
  } catch (error) {
    res.redirect("/books");
  }
}

function saveCover(book, coverEncoded) {
  if (coverEncoded == null) return;
  const cover = JSON.parse(coverEncoded);
  if (cover != null && imageMimeTypes.includes(cover.type)) {
    book.coverImage = new Buffer.from(cover.data, "base64");
    book.coverImageType = cover.type;
  }
}

module.exports = router;
