const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    amount: { 
        type: Number, 
        required: true 
    },
    description: { 
        type: String, 
        default: "" 
    },
    receiver: { 
        type: String, 
        required: true 
    },
    type: { 
        type: String, 
        enum: ['income', 'expense'], 
        required: true 
    },
    // Links to Category.id
    category_id: { 
        type: String, 
        required: true 
    },
    payment_date: { 
        type: Date, 
        required: true 
    },
    recurring: { 
        type: Boolean, 
        default: false 
    },
    // Useful for tracking when the entry was logged
    created_at: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true });

module.exports = mongoose.model('processed_transactions', TransactionSchema);