# 🎪 CONSEARCH - Quick Start Guide

## ⚡ Quick Setup (5 minutes)

### 1. **Installation**
```bash
cd e:\consearch-app
npm install
```

### 2. **Start the Server**
```bash
npm start
```

Server will run on: **http://localhost:3000**

### 3. **Access the Application**
- Open browser to `http://localhost:3000`
- Click "Create Account" to register
- Or click "Sign In" if you already have an account

---

## 🎯 Test Credentials

The app uses **in-memory storage** by default, so each session is fresh.

### Create Test Account:
```
Name: Test User
Email: test@example.com
Password: TestPass123!
```

### Then Sign In:
```
Email: test@example.com
Password: TestPass123!
```

---

## 🔐 Authentication Flows

### **Register Page** (`/register.html`)
1. ✍️ Enter Full Name
2. ✍️ Enter Email
3. ✍️ Enter Password (watch strength meter)
4. ✍️ Confirm Password
5. 🖱️ Click "Create Account"
6. ✅ Redirected to home page, logged in

### **Login Page** (`/login.html`)
1. ✍️ Enter Email
2. ✍️ Enter Password
3. 🖱️ Click "Sign In"
4. ✅ Redirected to home page, logged in

### **Book Tickets** (Logged In Only)
1. 🎫 Click on any concert
2. 💺 Select seat category
3. ✓ Click "Book Now"
4. 🎉 Booking added to "My Tickets"

### **Sign Out**
1. 👤 Click profile icon
2. 🚪 Click "Sign Out"
3. ✅ Redirected to login page

---

## 📁 Project Structure

```
consearch-app/
├── app.js                    # Backend server with auth API
├── .env                      # Environment variables
├── AUTH_DOCUMENTATION.md     # Full authentication docs
├── QUICKSTART.md            # This file
├── package.json             # Dependencies
└── public/
    ├── index.html           # Main application
    ├── login.html           # Login page
    ├── register.html        # Registration page
    └── images/              # Concert images
        ├── fanmeet1.jpg
        ├── fanmeet2.jpeg
        ├── konser1-7.jpeg
```

---

## 🛠️ Available Endpoints

### Authentication API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Sign in to account |
| GET | `/api/auth/me` | Get current user (requires token) |
| PUT | `/api/auth/profile` | Update profile (requires token) |
| POST | `/api/auth/logout` | Sign out |

### Concert API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | Get all events |
| POST | `/api/book/:id` | Book a ticket (requires token) |

### Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/metrics` | Prometheus metrics |

---

## 🎨 Features Overview

### ✨ User Authentication
- Email/password registration
- Secure login
- JWT token-based sessions
- 24-hour token expiration
- Session persistence

### 🎫 Concert Booking
- Browse major concerts
- Discover local events
- Select seat categories
- Real-time booking confirmations
- My Tickets history

### 👤 User Profile
- View profile information
- Edit full name
- User avatar with initials
- Account management

### 🌐 Responsive Design
- Mobile-friendly interface
- Tablet optimized
- Desktop experience
- Smooth animations

---

## 🚀 Development Tips

### Debug Mode
Add this to browser console:
```javascript
console.log(localStorage.getItem('token'));
console.log(JSON.parse(localStorage.getItem('user')));
```

### Test API Directly
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test","email":"test@test.com","password":"Pass123!"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Pass123!"}'
```

### Clear Session
```javascript
localStorage.clear();
location.reload();
```

---

## ⚙️ Configuration

### Change JWT Expiration
Edit `app.js`, find:
```javascript
jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' })
```
Change `'24h'` to desired duration (e.g., '7d', '30d')

### Change Password Hash Rounds
Edit `app.js`, find:
```javascript
const password_hash = await bcrypt.hash(password, 10)
```
Change `10` to higher (slower but more secure) or lower (faster but less secure)

### Enable HTTPS Only
Edit `app.js`, find:
```javascript
cookie: { 
    secure: false,  // Change to true
    httpOnly: true,
```

---

## 📊 User Data (Demo Mode)

When using **in-memory storage** (default):
- ✅ Users are stored in RAM
- ❌ Data is lost when server restarts
- 🎯 Perfect for testing and demos
- ⏱️ Session lasts until server restart

For **persistent storage**:
- Configure `DATABASE_URL` in `.env`
- Point to PostgreSQL database
- Data survives server restarts

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000 in use | `netstat -ano \| findstr :3000` then kill process |
| Module not found | Run `npm install` again |
| Token expired | Sign out and sign back in |
| Blank login page | Check browser console for errors |
| Booking not working | Ensure you're logged in first |
| Can't sign up twice | Clear localStorage then refresh |

---

## 🎓 Learning Resources

### Frontend
- JWT tokens stored in localStorage
- Fetch API for HTTP requests
- LocalStorage for persistence
- Event-driven UI updates

### Backend
- Express.js REST API
- bcryptjs for password hashing
- JWT for authentication
- Session management

### Security
- Password hashing (bcryptjs)
- Token expiration
- CORS protection
- HTTP-only cookies

---

## 📞 Next Steps

1. ✅ Register a test account
2. ✅ Sign in and explore
3. ✅ Book some concert tickets
4. ✅ Check "My Tickets"
5. ✅ Read `AUTH_DOCUMENTATION.md` for advanced features

Enjoy! 🎉

---

**Made with ❤️ for Consearch**
*Professional Concert Booking Platform*
