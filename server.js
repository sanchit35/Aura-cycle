const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());
app.use(express.static('aura_app'));

// Simple middleware to handle "Local Session" or "Google Session"
const getUser = (req) => {
    // For now, using a default user ID 1 for local mode
    return 1;
};

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/status', (req, res) => {
    const userId = getUser(req);
    db.all(`SELECT * FROM cycles WHERE user_id = ? ORDER BY start_date DESC`, [userId], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        
        // Logic moved from engine.js to SQL queries/JS here
        let phase = "Logged Data Needed";
        let next = "Calculating...";
        
        if (rows.length > 0) {
            const last = new Date(rows[0].start_date);
            const dayOfCycle = Math.floor((new Date() - last) / (86400000)) + 1;
            
            if (dayOfCycle <= 5) phase = 'Menstrual (Rest)';
            else if (dayOfCycle <= 13) phase = 'Follicular (Bloom)';
            else if (dayOfCycle <= 15) phase = 'Ovulatory (Peak)';
            else if (dayOfCycle <= 32) phase = 'Luteal (Stable)';
            else phase = 'Late (Verify)';

            // Basic prediction
            const nextDate = new Date(last);
            nextDate.setDate(last.getDate() + 28);
            next = nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        res.json({ phase, next });
    });
});

app.post('/api/add', (req, res) => {
    const userId = getUser(req);
    const { date, duration } = req.body;
    db.run(`INSERT INTO cycles (user_id, start_date, duration) VALUES (?, ?, ?)`, 
        [userId, date, duration], (err) => {
            if (err) res.status(500).json({error: err.message});
            else res.json({success: true});
        });
});

app.post('/api/symptoms', (req, res) => {
    const userId = getUser(req);
    const { date, symptoms } = req.body;
    const type = Object.keys(symptoms)[0];
    const value = symptoms[type];
    
    db.run(`INSERT INTO symptoms (user_id, date, type, value) VALUES (?, ?, ?, ?)`, 
        [userId, date, type, value], (err) => {
            if (err) res.status(500).json({error: err.message});
            else res.json({success: true});
        });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Aura Pro Production Server live on port ${PORT}`));
