const mongoose = require('mongoose');
const book = require('./book');
const authorSchema = new mongoose.Schema({  
    name: {
        type: String,
        required: true
    }      
    
})

authorSchema.pre('deleteOne', { document: true, query: false }, async function() {
    console.log('Hello pre deleteOne (document)');
    try {
        const books = await book.find({ author: this._id });
        if (books.length > 0) {
            console.log('Hello books (document)');
            throw new Error('This author has books still');
        }
        console.log('Hello next (document)');
    } catch (err) {
        console.log('Hello error (document)', err.message);
        throw err;
    }
});

module.exports = mongoose.model('Author', authorSchema);