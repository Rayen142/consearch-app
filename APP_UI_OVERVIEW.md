# 🎵 Consearch - Live Concert Experience App

## 📱 Tampilan Aplikasi Web

### **1. Home Page (Dashboard Utama)**
- **Deskripsi**: Landing page dengan tampilan modern, premium
- **Fitur Utama**:
  - Slider carousel untuk showcase konser
  - Background ambient dengan gradient (ungu ke hitam)
  - Navigation bar dengan sidebar
  - Smooth animations & transitions
  - Search functionality
  - Calendar view untuk event dates
  
- **Desain**:
  - Dark theme (background hitam)
  - Glassmorphism effect (blur & transparency)
  - Font: Plus Jakarta Sans (modern)
  - Gradient colors: Purple (#8b5cf6) → Pink (#ec4899)
  - Responsive design (mobile, tablet, desktop)

**Visual Elements:**
```
┌─────────────────────────────────────────────────────┐
│  🎵 CONSEARCH - Live Concert Experience             │ ← Header
├─────────────────────────────────────────────────────┤
│                                                      │
│  ╔═════════════════════════════════════════════╗   │
│  ║     ✨ Featured Concert Slider ✨           ║   │ ← Main Content
│  ║  [  Concert 1  ] [ Concert 2 - ACTIVE ] [ Concert 3 ]   │
│  ║  ✓ Scale effects on hover                  ║   │
│  ║  ✓ Glassmorphic cards with blur            ║   │
│  ╚═════════════════════════════════════════════╝   │
│                                                      │
│  📅 Calendar Grid untuk memilih dates              │
│  🔍 Search Bar untuk cari konser                   │
│                                                      │
│  ⭐ Sidebar (Mobile) untuk menu                    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

### **2. Login Page**
- **Deskripsi**: Form login dengan authentication
- **Fields**:
  - Email/Username input
  - Password input
  - "Remember me" checkbox
  - "Forgot password?" link
  - Login button
  - Register link

- **Desain**:
  - Glassmorphic container (blur effect)
  - Dark gradient background (purple-dark theme)
  - Smooth form animations
  - 450px max width (centered)

**Visual:**
```
┌──────────────────────────────────────┐
│  🎵 CONSEARCH                        │
│  ───────────────────────────────────│
│                                      │
│  📧 Email Address                   │
│  [_________________________]         │
│                                      │
│  🔒 Password                         │
│  [_________________________]         │
│                                      │
│  ☑ Remember me                       │
│  [SIGN IN]                           │
│                                      │
│  Forgot password? | Create account   │
│                                      │
└──────────────────────────────────────┘
```

---

### **3. Register Page**
- **Deskripsi**: Form registrasi untuk user baru
- **Fields**:
  - Full Name input
  - Email input
  - Password input
  - Confirm Password input
  - Terms checkbox
  - Register button
  - Login link

- **Desain**: Sama seperti login page (konsisten)

**Visual:**
```
┌──────────────────────────────────────┐
│  🎵 CONSEARCH                        │
│  Create Your Account                 │
│  Join millions in discovering events │
│                                      │
│  👤 Full Name                        │
│  [_________________________]         │
│                                      │
│  📧 Email Address                    │
│  [_________________________]         │
│                                      │
│  🔒 Password                         │
│  [_________________________]         │
│                                      │
│  🔒 Confirm Password                 │
│  [_________________________]         │
│                                      │
│  ☑ I agree to Terms & Conditions    │
│  [CREATE ACCOUNT]                    │
│                                      │
│  Already have account? Sign in       │
│                                      │
└──────────────────────────────────────┘
```

---

## 🎨 Design System

### **Color Palette**
```
Primary Purple:    #8b5cf6 (accent/gradient start)
Secondary Pink:    #ec4899 (accent/gradient end)
Dark BG:           #000000 (main background)
Dark Card:         #0f0f1e (card background)
Darkest:           #1e1e2e (alternative bg)
Glass Effect:      rgba(255,255,255, 0.08)
Text Primary:      #ffffff (white)
Text Secondary:    rgba(255,255,255, 0.6) (light gray)
```

### **Typography**
```
Font Family: Plus Jakarta Sans (Google Fonts)
Font Weights: 300, 500, 700, 800

Headings: Weight 800
Body Text: Weight 500
Labels: Weight 500
Small Text: Weight 300
```

### **Effects & Animations**
```
✨ Glassmorphism
   - Background: rgba(255,255,255, 0.08)
   - Backdrop-filter: blur(16px-20px)
   - Border: 1px solid rgba(255,255,255, 0.1-0.12)
   - Box-shadow: 0 40px 80px rgba(0,0,0, 0.5)

🎬 Animations
   - Smooth transitions (0.3s - 1.2s)
   - Cubic bezier easing
   - Scale transforms on hover
   - Fade in/out effects
   - Blur effects

🌈 Gradients
   - Background: radial gradient (purple to black)
   - Text: linear gradient (purple to pink)
   - Overlay gradients for depth
```

---

## 🎯 Key Features

### **Home Page Features**
- ✅ **Carousel Slider**: Horizontal scroll with snap points
  - Active card scales to 1.35x
  - Blur effect on non-active cards
  - Smooth transitions
  
- ✅ **Search**: Real-time concert search
  
- ✅ **Calendar**: Date-based event filtering
  
- ✅ **Sidebar Navigation**: Mobile-friendly menu
  
- ✅ **Modal/Dialogs**: For concert details, booking

### **Authentication Pages**
- ✅ **Login Form**: With email & password validation
  
- ✅ **Register Form**: New account creation
  
- ✅ **Remember Me**: Session persistence
  
- ✅ **Password Reset**: Forgot password flow

---

## 📲 Responsive Design

### **Breakpoints**
```
Mobile:    < 768px
Tablet:    768px - 1024px
Desktop:   > 1024px

Slide Card Width:
- Mobile:    40%
- Tablet:    42%
- Desktop:   35%
```

---

## 🎭 Interactive Elements

### **Hover States**
- Navigation icons: Scale 1.15x
- Cards: Scale up/down with smooth animation
- Buttons: Transform & shadow effects
- Links: Color transitions

### **Modal Interactions**
- Overlay fade in (0.4s)
- Content slide up (0.5s)
- Background blur when modal open
- Click outside to close

---

## 📊 Page Structure

### **index.html** (Main Page)
```
├── Header
│   ├── Logo
│   ├── Navigation Menu
│   └── Mobile Hamburger
├── Main Content
│   ├── Slider Container (Carousel)
│   │   ├── Concert Card 1
│   │   ├── Concert Card 2 (Active)
│   │   └── Concert Card 3
│   ├── Calendar Grid
│   ├── Search Bar
│   └── Concert List/Grid
├── Sidebar (Mobile)
│   ├── Menu Items
│   └── User Profile
└── Footer
```

### **login.html**
```
├── Background (Gradient)
└── Login Container
    ├── Logo
    ├── Email Field
    ├── Password Field
    ├── Remember Me Checkbox
    ├── Login Button
    ├── Links (Forgot Password, Register)
    └── Optional: OAuth buttons (Google, GitHub)
```

### **register.html**
```
├── Background (Gradient)
└── Register Container
    ├── Logo
    ├── Full Name Field
    ├── Email Field
    ├── Password Field
    ├── Confirm Password Field
    ├── Terms Checkbox
    ├── Register Button
    └── Login Link
```

---

## 🎨 Animation Examples

### **Slider Card Animation**
```
Normal:     scale(0.65) blur(5px) opacity(0.3)
Hover:      scale(0.72) blur(4px)
Active:     scale(1.35) blur(0) opacity(1) [SHADOW EFFECT]
Transition: cubic-bezier(0.34, 1.56, 0.64, 1) - 0.8s
```

### **Modal Animation**
```
Overlay:    fadeInOverlay (0.4s ease-out)
Content:    slideUpModal (0.5s cubic-bezier)
Background: blur(12px) brightness(0.7)
```

---

## 🔐 Authentication Flow

```
User visits site
    ↓
On Home Page? → Yes → Show Dashboard
    ↓ No
Redirect to Login
    ↓
User enters credentials
    ↓
Submit login form
    ↓
Backend validates (JWT)
    ↓
Success? → Yes → Store token + Redirect to Home
    ↓ No
Show error message
```

---

## 📱 Mobile Experience

- **Responsive Grid**: Adapts to screen size
- **Touch-friendly**: Larger tap targets
- **Sidebar Navigation**: Hamburger menu
- **Modal Optimization**: Full screen on mobile
- **Slide Cards**: Horizontal scroll optimized
- **Form Fields**: Full width on mobile

---

## 🚀 Starting the App

### **Option 1: Docker Compose**
```bash
# Deploy & access at:
# Frontend: http://localhost:80
```

### **Option 2: Direct with Node.js**
```bash
npm install
npm start

# Access at:
# http://localhost:3000
# Login: http://localhost:3000/login
# Register: http://localhost:3000/register
```

---

## 📸 Visual Summary

**Color Theme**: Dark mode dengan purple-pink gradients
**Layout**: Modern glassmorphic design dengan blur effects
**Typography**: Plus Jakarta Sans (elegant & modern)
**Animation**: Smooth cubic-bezier transitions
**Responsiveness**: Mobile-first design approach
**Accessibility**: High contrast, readable fonts, clear CTAs

---

Aplikasi Anda adalah **premium concert discovery platform** dengan desain modern dan animasi yang smooth! 🎵✨

Untuk melihat langsung, jalankan:
```bash
bash deploy.sh docker-compose
# Buka: http://localhost
```
