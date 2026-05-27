const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

const db = new sqlite3.Database('contacts.db');

db.run(`
  CREATE TABLE IF NOT EXISTS contacts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name  TEXT NOT NULL,
    email      TEXT NOT NULL,
    subject    TEXT,
    message    TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  )
`);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/contact', (req, res) => {
  const { firstName, lastName, email, subject, message } = req.body;

  if (!firstName || !lastName || !email || !message) {
    return res.status(400).json({ success: false, errors: ['All required fields must be filled.'] });
  }

  const stmt = `INSERT INTO contacts (first_name, last_name, email, subject, message) VALUES (?, ?, ?, ?, ?)`;
  db.run(stmt, [firstName, lastName, email, subject || 'Not specified', message], function(err) {
    if (err) {
      return res.status(500).json({ success: false, errors: ['Database error.'] });
    }
    res.json({ success: true, id: this.lastID });
  });
});

app.get('/admin', (req, res) => {
  db.all('SELECT * FROM contacts ORDER BY created_at DESC', [], (err, rows) => {
    if (err) rows = [];

    const rowsHtml = rows.length === 0
      ? `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#888">No submissions yet.</td></tr>`
      : rows.map(r => `<tr>
          <td>${r.id}</td>
          <td>${r.first_name} ${r.last_name}</td>
          <td>${r.email}</td>
          <td>${r.subject}</td>
          <td>${r.message}</td>
          <td>${r.created_at}</td>
        </tr>`).join('');

    res.send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Admin Panel</title>
<style>
  body { font-family: sans-serif; padding: 2rem; background: #FAF6F3; }
  h1 { margin-bottom: 1rem; color: #2C2420; }
  table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; }
  th { background: #FBEAF0; padding: 10px 14px; text-align: left; font-size: 0.8rem; color: #7A6A62; text-transform: uppercase; }
  td { padding: 12px 14px; font-size: 0.85rem; border-bottom: 1px solid #EAE0D8; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  .count { background: #FBEAF0; color: #72243E; padding: 4px 12px; border-radius: 100px; font-size: 0.75rem; display: inline-block; margin-bottom: 1rem; }
</style>
</head><body>
<h1>She Can Foundation — Submissions</h1>
<div class="count">${rows.length} total submission${rows.length !== 1 ? 's' : ''}</div>
<table>
  <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Subject</th><th>Message</th><th>Date</th></tr></thead>
  <tbody>${rowsHtml}</tbody>
</table>
</body></html>`);
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Admin panel at http://localhost:${PORT}/admin`);
});