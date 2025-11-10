# 💰 Personal Finance Tracker (React & PHP/MySQL)

This is a **full-stack web application** built using **React** (for the frontend user interface) and a **PHP/MySQL API** (for the backend). It is designed for comprehensive **personal finance management**.

The application allows users to monitor their income, expenses, and savings through intuitive charts and a powerful transaction log.

### Key Features:

* **Dynamic Budgeting:** Supports custom budget rules, such as the **50/30/20 rule**, helping users balance **Needs**, **Wants**, and **Savings**.
* **Recurring Transactions:** Enables the scheduling of recurring income (e.g., salary) and recurring expenses (e.g., subscriptions) for accurate forecasting.
* **Customizable Categories:** Users can define and edit their own spending categories and allocation types.
* **Visual Analytics:** Intuitive graphs (Pie and Doughnut charts) provide a visual breakdown of spending habits and budget adherence.
* **Transaction Management:** A filterable and paginated table for managing all past and present transactions, including edit and delete functionality.

## 🛠️ Tech Stack

* **Frontend:** React, React Router, Chart.js, React-Bootstrap
* **Backend:** PHP, MySQL
* **Development:** Git, XAMPP (Apache)

## 📸 Application Preview

![Financial Tracker Dashboard Screenshot](https://github.com/user-attachments/assets/b5f0a0f1-d752-47d3-a86d-8efb6dc4fad0)
![Transaction Screenshot](https://github.com/user-attachments/assets/725e95cd-18bf-4df7-946b-4fc33f6cee4a)
![Budgeting Screenshot](https://github.com/user-attachments/assets/eb5110f5-fcbb-48ff-b034-e6e377f9df07)
![Categories Screenshot](https://github.com/user-attachments/assets/21ef189f-219a-4f38-aad1-1772ac106109)

## 🚀 Local Setup Guide

To run this project locally, you need a running web server (like XAMPP/MAMP) and Node.js installed.

### 1. Backend (PHP API & Database)

1.  Place the contents of the **`/api`** folder inside your XAMPP web root (e.g., `C:\xampp\htdocs\financial-tracker`).
2.  Start the **Apache** and **MySQL** services in your XAMPP Control Panel.
3.  Go to `http://localhost/phpmyadmin` and create a new database named **`financial_tracker`**.
4.  Select the new database and go to the **"Import"** tab. Import the `database.sql` file (included in the `/api` folder) to set up all the tables.

### 2. Frontend (React)

1.  Open your terminal/command prompt and navigate to the project root:
    ```bash
    cd financial-tracker-repo
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm start
    ```
4.  Access the app at `http://localhost:3000` (or the port indicated in the console).