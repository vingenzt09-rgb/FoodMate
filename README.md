# 🍔 FoodMate - Full-Stack Recipe & Community App

FoodMate is a comprehensive mobile application built with **React Native (Expo)** and a **PHP/MySQL** backend. It allows users to discover recipes, track their daily nutrition, manage grocery lists, share food creations with a community, and much more.

## ✨ Key Features

- **User Authentication:** Secure Register, Login, and Logout using PHP `password_hash()` and `password_verify()`.
- **Biometric Login & Session Management:** Integrated `expo-local-authentication` for Fingerprint/Face ID login. Includes a "Remember Me" feature and a 24-hour Session Timeout for enhanced security.
- **Recipe Discovery:** Browse recipes fetched dynamically from a MySQL database with Search and Category filtering.
- **Advanced Recipe Details:** View prep/cook times, ingredients, and step-by-step instructions. Includes a **Smart Serving Adjuster** that automatically scales ingredients and nutritional values based on the desired number of servings.
- **Favorites:** Save and manage your favorite recipes.
- **Smart Pantry Matching:** Add ingredients you have at home and find recipes you can cook right now (with match percentage).
- **Grocery List:** Automatically generate a grocery list from a recipe or add items manually. Includes a "Clear All" feature.
- **Nutrition Tracker:** Log your daily meals and track your Calorie, Protein, Carbs, and Fat intake.
- **Community Feed:** Share your food creations with images and captions. Like and comment on other users' posts.
- **Image Uploads:** Integrated `expo-image-picker` to allow users to take photos or choose from the gallery for recipes and community posts.
- **Admin Panel:** A dedicated dashboard for admins to view statistics, manage users, and moderate (delete) inappropriate community posts. (Role-based access control).
- **Global Dark Mode:** A complete Dark/Light theme system implemented using React Context API.
- **Modern UI/UX:** Smooth animations, custom App Icon, Splash Screen, slide transitions, auto-suggest search, and a responsive layout.

## 🛠️ Tech Stack

**Frontend (Mobile App):**
- React Native (Expo)
- TypeScript
- Expo Router (File-based routing)
- React Context API (Theme management)
- Expo Image Picker (Camera & Gallery access)
- Expo Local Authentication (Biometrics)
- AsyncStorage (Local session management)

**Backend (API):**
- PHP
- MySQL (MariaDB via XAMPP)
- JSON REST API
- Prepared Statements (Security against SQL Injection)

## 📂 Project Structure

- FoodMate/
- ├── src/ (React Native Frontend)
- │   ├── app/ (Screens & Routing)
- │   ├── components/ (Reusable UI)
- │   ├── constants/ (API URL)
- │   └── context/ (Dark Mode Context)
- ├── backend/ (PHP API & Database)
- │   ├── db.php (Database connection)
- │   ├── register.php (Auth)
- │   ├── login.php (Auth)
- │   ├── profile.php (User profile & Role)
- │   ├── recipes.php (Recipe CRUD)
- │   ├── favorites.php (Favorites)
- │   ├── ingredients.php (Pantry)
- │   ├── matching.php (Recipe matching)
- │   ├── grocery.php (Grocery list)
- │   ├── nutrition.php (Food logging)
- │   ├── community.php (Posts & Comments)
- │   ├── admin.php (Admin management)
- │   └── upload.php (Image upload handler)
- └── README.md

## 🚀 How to Run Locally

### 1. Backend Setup (XAMPP)
1. Install [XAMPP](https://www.apachefriends.org/) and start **Apache** and **MySQL**.
2. Copy the `backend` folder into `C:\xampp\htdocs\` and rename it to `foodmate-api`.
3. Create an `uploads` folder inside `foodmate-api` (for image uploads).
4. Open phpMyAdmin (or MySQL CLI) and create a database named `foodmate_db`.
5. Create the required tables (users, recipes, favorites, pantry_items, grocery_lists, food_logs, posts, comments, etc.). 
6. Update `backend/db.php` with your MySQL username and password.

### 2. Frontend Setup (Expo)
1. Clone this repository.
2. Run `npm install` to install dependencies.
3. Open `src/constants/api.ts` and update the `API_URL` to your computer's local IPv4 address (e.g., `http://192.168.1.100/foodmate-api`).
4. Run `npx expo start -c` and scan the QR code with the Expo Go app on your Android device.

## 🔮 Future Enhancements
- [ ] Implement JWT (JSON Web Token) for secure API authentication instead of basic session handling.
- [ ] Add push notifications for community interactions and meal reminders.
- [ ] Add a rating and review system for recipes.
- [ ] Deploy the backend to a production server (e.g., AWS, DigitalOcean, or shared hosting).

## 👨‍💻 Developer
**Vinuka**
- [LinkedIn Profile](https://www.linkedin.com/in/vinuka-hettiarachchi-b70109435/)


---
*Built with ❤️ for food lovers.*