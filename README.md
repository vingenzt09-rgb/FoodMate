# 🍔 FoodMate - Android Recipe App

FoodMate is a full-stack mobile application built with **React Native (Expo)** and a **PHP/MySQL** backend. It allows users to discover delicious recipes, search by category, view detailed cooking instructions, and save their favorite meals.

## ✨ Features

- **User Authentication:** Secure Register and Login using PHP `password_hash()` and `password_verify()`.
- **Recipe Discovery:** Browse a list of recipes fetched dynamically from a MySQL database.
- **Search & Filter:** Search recipes by name and filter by categories (Breakfast, Lunch, Dinner, Dessert).
- **Recipe Details:** View prep/cook times, servings, ingredients, and step-by-step instructions.
- **Favorites:** Save recipes to a personal favorites list (stored in the database).
- **Explore Tab:** View all recipes and your personal favorites in one place.
- **Modern UI:** Clean, responsive design with a warm orange/cream theme.

## 🛠️ Tech Stack

**Frontend (Mobile App):**
- React Native (Expo)
- TypeScript
- Expo Router (File-based routing)
- React Hooks (useState, useEffect, useMemo, useCallback)
- AsyncStorage (Local session management)

**Backend (API):**
- PHP
- MySQL (MariaDB via XAMPP)
- JSON REST API
- Prepared Statements (Security against SQL Injection)

## 🚀 How to Run Locally

### 1. Backend Setup (XAMPP)
1. Install [XAMPP](https://www.apachefriends.org/) and start **Apache** and **MySQL**.
2. Copy the `backend` folder into `C:\xampp\htdocs\` and rename it to `foodmate-api`.
3. Open phpMyAdmin (or MySQL CLI) and create a database named `foodmate_db`.
4. Create the required tables (users, recipes, favorites) using SQL commands.
5. Update `backend/db.php` with your MySQL username and password.

### 2. Frontend Setup (Expo)
1. Clone this repository.
2. Run `npm install` to install dependencies.
3. Open `src/constants/api.ts` and update the `API_URL` to your computer's local IPv4 address (e.g., `http://192.168.1.100/foodmate-api`).
4. Run `npx expo start` and scan the QR code with the Expo Go app on your Android device.

## 👨‍💻 Developer
**Vinuka Wathsara Hettiarachchi**
[LinkedIn Profile](www.linkedin.com/in/vinuka-hettiarachchi-b70109435)


---
*Built with ❤️ for food lovers.*