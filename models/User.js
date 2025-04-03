const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },         // Текущий баланс
  transactions: [{                               // История операций
    amount: { type: Number, required: true },    // +100 или -50
    type: { type: String, enum: ['topup', 'print'] },  // Тип операции
    date: { type: Date, default: Date.now }      // Дата транзакции
  }]
});

module.exports = mongoose.model('User', userSchema);