const Transaction = require('../models/transaction.js'); // Adjust path as needed
const Category = require('../models/transactionCategory.js');

exports.getTransactions = async (req, res) => {
    try {
        // We sort by payment_date descending so newest shows first
        const transactions = await Transaction.find().sort({ payment_date: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createTransaction = async (req, res) => {
    const transaction = new Transaction({
        amount: req.body.amount,
        description: req.body.description,
        receiver: req.body.receiver,
        type: req.body.type,
        category_id: req.body.category_id,
        payment_date: req.body.payment_date,
        recurring: req.body.recurring === true || req.body.recurring === "1"
    });

    try {
        const newTransaction = await transaction.save();
        res.status(201).json(newTransaction);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find();        
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getBudgetStats = async (req, res) => {
    try {
        const stats = await Transaction.aggregate([
            {
                $group: {
                    _id: "$type",
                    total: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            }
        ]);
        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};