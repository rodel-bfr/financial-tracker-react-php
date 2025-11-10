# 💰 Personal Finance Tracker (React & PHP/MySQL)

This is a **full-stack web application** built using **React** (for the frontend user interface) and a **PHP/MySQL API** (for the backend). It is designed for comprehensive **personal finance management**.

The application allows users to monitor their income, expenses, and savings through intuitive charts and a powerful transaction log.

### Key Features:

* **Dynamic Budgeting:** Supports custom budget rules, such as the **50/30/20 rule**, helping users balance **Needs**, **Wants**, and **Savings**.
* **Recurring Transactions:** Enables the scheduling of recurring income (e.g., salary) and recurring expenses (e.g., subscriptions) for accurate forecasting.
* **Customizable Categories:** Users can define and edit their own spending categories and allocation types.
* **Visual Analytics:** Intuitive graphs (Pie and Doughnut charts) provide a visual breakdown of spending habits and budget adherence.
* **Transaction Management:** A filterable and paginated table for managing all past and present transactions, including edit and delete functionality.

## 🚀 Local Setup Guide

To run this project locally, you need a running web server (like XAMPP/MAMP) and Node.js installed.

### 1. Backend (PHP API & Database)
1.  Place the contents of the **`api`** folder inside your XAMPP web root (e.g., `C:\xampp\htdocs\financial-tracker`).
2.  Start the **Apache** and **MySQL** services in your XAMPP Control Panel.
3.  Create the **`financial_tracker`** database and import your SQL file (the one containing tables like `transactions`, `categories`, etc.) using **phpMyAdmin**.

### 2. Frontend (React)
1.  Open your terminal/command prompt and navigate to the project root:
    `cd financial-tracker-repo`
2.  Install dependencies: `npm install`
3.  Start the development server: `npm start`
4.  Access the app at `http://localhost:3000` (or the port indicated in the console).