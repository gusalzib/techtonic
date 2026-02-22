const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    // We keep this as a string to match your JSON: {"id":"1", "name":"Car"...}
    id: { 
        type: String, 
        required: true,
        unique: true 
    },
    name: { 
        type: String, 
        required: true,
        trim: true 
    },
    user_id: { 
        type: String, 
        required: true 
    }
}, {
    timestamps: true,
    collection: 'transactionCategories'
 });

module.exports = mongoose.model('Category', CategorySchema);