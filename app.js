require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB подключена'))
  .catch(err => console.log('Ошибка MongoDB:', err));


// Роут регистрации 
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email уже занят' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'Пользователь зарегистрирован!' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});


// Система баллов


// Пополнение баланса
app.post('/balance/topup', async (req, res) => {
  try {
    const { email, amount } = req.body;
    const user = await User.findOneAndUpdate(
      { email },
      { 
        $inc: { balance: amount },
        $push: { transactions: { amount, type: "topup" } }
      },
      { new: true }
    );
    res.json({ balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Списание баллов за печать
app.post('/balance/print', async (req, res) => {
  try {
    const { email, cost } = req.body;
    const user = await User.findOne({ email });

    if (user.balance < cost) {
      return res.status(400).json({ error: "Недостаточно баллов" });
    }

    user.balance -= cost;
    user.transactions.push({ amount: -cost, type: "print" });
    await user.save();
    res.json({ balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Проверка баланса
app.get('/balance/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    res.json({ balance: user?.balance || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});


// Запуск сервера 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});