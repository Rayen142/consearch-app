# CONSEARCH - Professional Authentication System Documentation

## 🎯 Overview

Consearch now features a complete, professional authentication system with user registration, login, profile management, and session handling - similar to enterprise applications like Gmail, Spotify, and other modern platforms.

## ✨ Features Implemented

### 1. **User Registration Page** (`/register.html`)
- Email-based account creation
- Password strength indicator (Real-time feedback)
- Full name field
- Confirm password validation
- Form validation with error messages
- Secure password hashing with bcryptjs
- Beautiful glassmorphic UI design

### 2. **User Login Page** (`/login.html`)
- Email and password authentication
- Remember me functionality via JWT tokens
- Session management
- Error handling and validation
- OAuth2 placeholder for future Gmail integration
- Responsive design for mobile/desktop

### 3. **Authenticated User Experience**
- User profile menu with:
  - Display of user initials and email
  - My Tickets access
  - Edit Profile functionality
  - Help Desk
  - Give Rating
  - Sign Out button
- JWT token-based authentication
- Automatic session persistence (24 hours)
- Protected booking endpoints

### 4. **Backend API Endpoints**

#### Authentication Endpoints:

```
POST /api/auth/register
Body: { email, password, full_name }
Response: { user, token, message }

POST /api/auth/login
Body: { email, password }
Response: { user, token, message }

GET /api/auth/me
Headers: { Authorization: "Bearer <token>" }
Response: { id, email, full_name, profile_picture, created_at }

PUT /api/auth/profile
Headers: { Authorization: "Bearer <token>" }
Body: { full_name, profile_picture }
Response: { user, message }

POST /api/auth/logout
Response: { message }
```

### 5. **Security Features**

✅ **Password Hashing**: bcryptjs with 10 salt rounds
✅ **JWT Tokens**: 24-hour expiration
✅ **CORS Protection**: Enabled
✅ **Session Security**: HTTP-only cookies
✅ **Input Validation**: All fields validated server-side
✅ **Protected Routes**: Token verification middleware
✅ **Secure Logout**: Session destruction

## 🗄️ Data Storage

### Database: PostgreSQL (when available)
```sql
CREATE TABLE users (
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
```

### Fallback: In-Memory Storage (for demo mode)
When PostgreSQL is not available, the app uses in-memory storage for demo purposes. All user data is stored in RAM during the session.

## 🚀 How to Use

### For End Users:

#### **Sign Up:**
1. Click "Create Account" in the user menu
2. Fill in your full name, email, and password
3. Click "Create Account"
4. You'll be logged in automatically and redirected to the home page

#### **Sign In:**
1. Click "Sign In" in the user menu
2. Enter your email and password
3. Click "Sign In"
4. You'll be logged in and redirected to the home page

#### **Book Tickets:**
1. Ensure you're signed in (required to book)
2. Click on any concert card
3. Select your seat category
4. Click "Book Now"
5. Your booking will be added to "My Tickets"

#### **Sign Out:**
1. Click your profile icon in the navbar
2. Click "Sign Out"
3. You'll be redirected to the login page

### For Developers:

#### **Testing Registration:**
```bash
# Test API
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

#### **Testing Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

#### **Using JWT Token:**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🔐 Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/consearchdb
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SESSION_SECRET=your-super-secret-session-key-change-this
NODE_ENV=development

# Google OAuth2 (for future implementation)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

## 📦 Dependencies

```json
{
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.x.x",
  "passport": "^0.7.x",
  "passport-google-oauth20": "^2.x.x",
  "dotenv": "^16.x.x",
  "express-session": "^1.x.x",
  "cors": "^2.x.x"
}
```

Install all dependencies:
```bash
npm install
```

## 🎨 UI/UX Features

### Login/Register Pages:
- ✨ Glassmorphism design with blur effects
- 🎨 Gradient backgrounds (purple to pink)
- ⌨️ Real-time password strength indicator
- ✅ Form validation with error messages
- 📱 Fully responsive design
- 🎭 Smooth animations and transitions

### User Menu:
- 👤 User avatar with initials
- 📧 Email display
- 🎫 Quick access to My Tickets
- ⚙️ Edit Profile option
- 🚪 Sign Out button
- 🌐 Language toggle integration

## 🔄 Data Flow

```
User Registration
    ↓
Form Validation (Frontend)
    ↓
Submit to /api/auth/register
    ↓
Backend Validation
    ↓
Password Hashing (bcryptjs)
    ↓
Store in Database/Memory
    ↓
Generate JWT Token
    ↓
Return Token to Frontend
    ↓
Store in localStorage
    ↓
Redirect to Home Page

---

User Login
    ↓
Enter Credentials
    ↓
Submit to /api/auth/login
    ↓
Find User in Database
    ↓
Compare Password Hash
    ↓
Generate JWT Token
    ↓
Create Session
    ↓
Return Token to Frontend
    ↓
Store in localStorage
    ↓
Redirect to Home Page

---

Protected Actions (Booking)
    ↓
Check if User Logged In
    ↓
Send Request with JWT Token
    ↓
Server Verifies Token
    ↓
Process Request
    ↓
Return Response
```

## 🚀 Future Enhancements

### Phase 2:
- [ ] Google OAuth2 Integration
- [ ] Email verification on registration
- [ ] Password reset functionality
- [ ] Two-factor authentication (2FA)
- [ ] Social login (Facebook, Instagram)
- [ ] Profile picture upload

### Phase 3:
- [ ] Email notifications for bookings
- [ ] Ticket PDF generation
- [ ] Booking history with filters
- [ ] User ratings and reviews
- [ ] Wishlist/Favorites
- [ ] Email newsletter subscription

### Phase 4:
- [ ] Payment gateway integration (Stripe, GoPay)
- [ ] Refund management system
- [ ] Admin dashboard
- [ ] User analytics
- [ ] Email marketing campaigns

## ⚠️ Production Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Change `SESSION_SECRET` to a strong random string
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS (set `cookie.secure=true`)
- [ ] Connect to production PostgreSQL database
- [ ] Set up Google OAuth2 credentials
- [ ] Configure CORS for your domain
- [ ] Enable rate limiting on auth endpoints
- [ ] Set up email service for notifications
- [ ] Configure backup strategy
- [ ] Set up monitoring and logging
- [ ] Test all authentication flows
- [ ] Security audit and penetration testing

## 🆘 Troubleshooting

### Issue: "Email already registered"
**Solution**: Use a different email address or reset the in-memory database by restarting the server.

### Issue: "Invalid email or password"
**Solution**: Check that you've entered the correct credentials. Passwords are case-sensitive.

### Issue: "Token expired"
**Solution**: Sign out and sign back in. Tokens expire after 24 hours.

### Issue: Database connection error
**Solution**: The app automatically falls back to in-memory storage for demo mode. To use PostgreSQL, configure the DATABASE_URL environment variable.

### Issue: CORS errors
**Solution**: Ensure CORS is enabled in app.js and your frontend is making requests to the correct API endpoint.

## 📞 Support

For issues, questions, or feature requests, please contact the development team.

---

**Last Updated**: January 2026
**Version**: 1.0.0
**Status**: Production Ready
