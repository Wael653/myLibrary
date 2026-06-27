const mongoose = require('mongoose');
const authorSchema = new mongoose.Schema({  
    name: {
        type: String,
        required: true
    }      
    
})

authorSchema.pre('deleteOne', { document: true, query: false }, async function() {
    console.log('pre deleteOne (document) for author', this._id);
    try {
        const Book = mongoose.model('Book');
        const books = await Book.find({ author: this._id });
        if (books.length > 0) {
            console.log('Author has books, aborting delete (document)');
            throw new Error('This author has books still');
        }
        console.log('No books found, proceeding with delete (document)');
    } catch (err) {
        console.log('pre deleteOne error (document)', err.message);
        throw err;
    }
});

module.exports = mongoose.model('Author', authorSchema);