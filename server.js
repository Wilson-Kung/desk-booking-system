const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// 中間件：解析 JSON 請求
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 讀取 bookings.json
function loadBookings() {
  try {
    const data = fs.readFileSync('bookings.json', 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// 寫入 bookings.json
function saveBookings(bookings) {
  fs.writeFileSync('bookings.json', JSON.stringify(bookings, null, 2));
}

// 獲取所有預約
app.get('/bookings', (req, res) => {
  const bookings = loadBookings();
  res.json(bookings);
});

// 新增預約，並檢查衝突
app.post('/bookings', (req, res) => {
  const { name, start, end } = req.body;
  if (!name || !start || !end) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newBooking = { name, start, end };
  const bookings = loadBookings();

  // 檢查時間衝突
  const hasConflict = bookings.some(booking => {
    const bookingStart = new Date(booking.start);
    const bookingEnd = new Date(booking.end);
    const newStart = new Date(start);
    const newEnd = new Date(end);
    return (newStart < bookingEnd && newEnd > bookingStart);
  });

  if (hasConflict) {
    return res.status(409).json({ error: 'Time slot conflict' });
  }

  bookings.push(newBooking);
  saveBookings(bookings);
  res.status(201).json(newBooking);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});