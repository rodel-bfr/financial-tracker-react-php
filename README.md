# 💰 Personal Finance Tracker (React & PHP/MySQL)

This is a **full-stack web application** built using **React** (for the frontend user interface) and a **PHP/MySQL API** (for the backend). It is designed for comprehensive **personal finance management**.

The application allows users to monitor their income, expenses, and savings through intuitive charts and a powerful transaction log.

---

## ✨ Key Features

* **Dynamic Budgeting:** Supports custom budget rules, such as the **50/30/20 rule**, helping users balance **Needs**, **Wants**, and **Savings**.
* **Recurring Transactions:** Enables the scheduling of recurring income (e.g., salary) and recurring expenses (e.g., subscriptions) for accurate forecasting.
* **Customizable Categories:** Users can define and edit their own spending categories and allocation types.
* **Visual Analytics:** Intuitive graphs (Pie and Doughnut charts) provide a visual breakdown of spending habits and budget adherence.
* **Transaction Management:** A filterable and paginated table for managing all past and present transactions, including edit and delete functionality.

---

## 🛠️ Tech Stack

* **Frontend:** React, React Router, Chart.js, React-Bootstrap
* **Backend:** PHP, MySQL
* **Development:** Git, XAMPP (Apache)

---

## 📸 Application Preview

![Dashboard](https://github.com/user-attachments/assets/b5f0a0f1-d752-47d3-a86d-8efb6dc4fad0)
![Transaction](https://github.com/user-attachments/assets/725e95cd-18bf-4df7-946b-4fc33f6cee4a)
![Budgeting](https://github.com/user-attachments/assets/eb5110f5-fcbb-48ff-b034-e6e377f9df07)
![Categories](https://github.com/user-attachments/assets/21ef189f-219a-4f38-aad1-1772ac106109)

---

## 💾 Database Schema (ERD)

Here is the Entity Relationship Diagram (ERD) for the database, showing the table structures and relationships.

![Database ERD](https://github.com/user-attachments/assets/8a4ca646-7a67-4b80-a300-3db85e0007b6)

---

## 🚀 Local Setup Guide

### 📋 Prerequisites
Before you begin, ensure you have the following installed on your local machine:
* **[Node.js](https://nodejs.org/)** (v14 or higher) – To run the React frontend.
* **[XAMPP](https://www.apachefriends.org/)** (or MAMP/WAMP) – To provide the Apache server and MySQL database.
* **[Composer](https://getcomposer.org/)** – To manage PHP dependencies.
* **[Git](https://git-scm.com/)** – To clone the repository.

### 🔧 Installation

### 1.  **Clone the repository:**
```bash
git clone https://github.com/rodel-bfr/financial-tracker-react-php.git
```

### 2. **Setup Backend (PHP API & Database)**

1.  **Copy API Files:** Place the contents of the **`/api`** folder inside your XAMPP web root (e.g., `C:\xampp\htdocs\financial-tracker-api`).

2.  **Start Server:** Start the **Apache** and **MySQL** services in your XAMPP Control Panel.

3.  **Install PHP Dependencies:** Open your terminal and navigate *inside* the API folder.
    ```bash
    cd C:\xampp\htdocs\financial-tracker-api
    composer install
    ```

4.  **Create Environment File:** In that same `/api` folder, create a new file named `.env`. Copy the following lines into it and fill in your database details (this will be `root` and a blank password for a default XAMPP setup).
    ```
    DB_HOST=localhost
    DB_USER=root
    DB_PASS=
    DB_NAME=financial_tracker
    ```

5.  **Create Database:** Go to `http://localhost/phpmyadmin` and create a new database named **`financial_tracker`**.

6.  **Import Schema:** Select the new database and go to the **"Import"** tab. Import the `database.sql` file (included in the `/api` folder) to set up all the tables and import the sample data.

### 3. Frontend (React)

1.  **Navigate to Project Root:** Open a *separate* terminal window and navigate to the project's root folder (the one containing the React app, *not* the `/api` folder).
    ```bash
    cd path-to-your/financial-tracker-react-php
    ```
2.  **Install Node.js Dependencies:**
    ```bash
    npm install
    ```
3.  **Start the React App:**
    ```bash
    npm start
    ```
4.  **Access the App:** Open your browser to `http://localhost:3000`. The React app will automatically connect to your PHP API running on `localhost`.