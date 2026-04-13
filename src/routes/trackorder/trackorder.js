const express = require('express');
const router = express.Router();

// Only GET route is needed now, since we handle form logic entirely in Frontend JS
router.get('/', (req, res) => {
    res.render('trackorder/trackorder', { title: 'Track Order' });
});

module.exports = router;
