const express = require('express');
const path = require('path');
const routes = require('./routes'); // routes import
const fs = require('fs');

// load .env manually
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .forEach(line => {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim();
    });
}
const app = express();
const port = 3000;

// EJS setup
app.set('view engine', 'ejs');
// Point to src/views (not project root) so lookups like res.render('home') work
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Use routes
app.use('/', routes);

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
