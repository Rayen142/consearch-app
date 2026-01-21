const express = require('express');
const { Pool } = require('pg');
const client = require('prom-client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cors());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'session-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// --- MONITORING ---
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'code'],
    buckets: [0.1, 0.5, 1] 
});
register.registerMetric(httpRequestDuration);

const ticketSoldCounter = new client.Counter({
    name: 'tickets_sold_total',
    help: 'Total tickets sold'
});
register.registerMetric(ticketSoldCounter);

// --- DATABASE ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/consearchdb'
});

// In-memory fallback storage for demo mode
let usersDB = [];
let dbAvailable = false;

// Initialize users table
const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255),
                profile_picture VARCHAR(500),
                provider VARCHAR(50),
                provider_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        dbAvailable = true;
        console.log('✓ PostgreSQL database connected');
    } catch (err) {
        dbAvailable = false;
        console.warn('⚠ Database not available. Using in-memory storage for demo.');
    }
};

// Try to initialize DB on startup
setTimeout(() => initDB(), 1000);

app.use((req, res, next) => {
    const end = httpRequestDuration.startTimer();
    res.on('finish', () => end({ method: req.method, route: req.path, code: res.statusCode }));
    next();
});

// --- MIDDLEWARE ---
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
    const { email, password, full_name } = req.body;
    
    try {
        // Validate input
        if (!email || !password || !full_name) {
            return res.status(400).json({ error: 'Email, password, and full name are required' });
        }
        
        let userExists = false;
        
        if (dbAvailable) {
            const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            userExists = result.rows.length > 0;
        } else {
            userExists = usersDB.some(u => u.email === email);
        }
        
        if (userExists) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Hash password
        const password_hash = await bcrypt.hash(password, 10);
        
        let user;
        if (dbAvailable) {
            const result = await pool.query(
                'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name',
                [email, password_hash, full_name]
            );
            user = result.rows[0];
        } else {
            // In-memory storage
            user = {
                id: usersDB.length + 1,
                email,
                full_name,
                password_hash,
                created_at: new Date()
            };
            usersDB.push(user);
        }
        
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        
        res.json({ 
            message: 'Registration successful',
            user: { id: user.id, email: user.email, full_name: user.full_name },
            token 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        let user = null;
        
        if (dbAvailable) {
            const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            if (result.rows.length === 0) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }
            user = result.rows[0];
        } else {
            user = usersDB.find(u => u.email === email);
            if (!user) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }
        }
        
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        req.session.userId = user.id;
        
        res.json({
            message: 'Login successful',
            user: { id: user.id, email: user.email, full_name: user.full_name },
            token
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: 'Logout failed' });
        res.json({ message: 'Logout successful' });
    });
});

app.get('/api/auth/me', verifyToken, async (req, res) => {
    try {
        let user = null;
        
        if (dbAvailable) {
            const result = await pool.query('SELECT id, email, full_name, profile_picture, created_at FROM users WHERE id = $1', [req.user.id]);
            if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
            user = result.rows[0];
        } else {
            user = usersDB.find(u => u.id === req.user.id);
            if (!user) return res.status(404).json({ error: 'User not found' });
            user = { id: user.id, email: user.email, full_name: user.full_name, profile_picture: user.profile_picture };
        }
        
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/auth/profile', verifyToken, async (req, res) => {
    const { full_name, profile_picture } = req.body;
    
    try {
        let user;
        
        if (dbAvailable) {
            const result = await pool.query(
                'UPDATE users SET full_name = $1, profile_picture = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, email, full_name, profile_picture',
                [full_name, profile_picture, req.user.id]
            );
            user = result.rows[0];
        } else {
            user = usersDB.find(u => u.id === req.user.id);
            if (user) {
                user.full_name = full_name || user.full_name;
                user.profile_picture = profile_picture || user.profile_picture;
            }
        }
        
        res.json({ message: 'Profile updated', user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- EXISTING ROUTES ---
app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
});

app.get('/api/events', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM events ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/book/:id', verifyToken, async (req, res) => {
    const eventId = req.params.id;
    try {
        const result = await pool.query(
            'UPDATE events SET stock = stock - 1 WHERE id = $1 AND stock > 0 RETURNING *',
            [eventId]
        );
        if (result.rows.length === 0) return res.status(400).json({ message: "Sold Out!" });
        ticketSoldCounter.inc();
        res.json({ message: "Booking Success!", sisa_stok: result.rows[0].stock });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(port, () => console.log(`Consearch running on port ${port}`));