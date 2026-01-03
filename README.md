# Cashier Network-Based Web Application

This project is a network-based cashier web application built to simulate a real point-of-sale (POS) system used in small retail environments such as cafés, shops and kiosks.

The goal of this project is to demonstrate practical web development skills through a real-world use case. It focuses on cashier workflow, cart management and clear user interaction, rather than simple UI demos.

The application is built using JavaScript, HTML and CSS, with a structure that allows future expansion for multi-device use, backend integration and persistent data storage. It reflects how a real cashier system behaves, including item selection, quantity control and transaction handling.


## ✨ Key Features

- Add items to cart with quantity control
- Prevent invalid quantities (cannot go below 1)
- Logical handling of out-of-stock items
- Real-time cart updates
- Clear and simple cashier interface
- Network-ready architecture for multi-device use

## 🛠️ Tech Stack

- **JavaScript (ES6+)** – application logic
- **HTML5** – semantic structure
- **CSS3** – layout and styling
- **Node.js** – backend server and runtime environment
- **MariaDB** – relational database for persistent data storage


## 📂 Project Structure

📦 cashier-network-based

```
├── node_modules/ # Installed dependencies
├── src/ # Source code (UI + app logic)
├── .gitignore
├── package.json # Project manifest
└── README.md
```

## 🛠️ Getting Started

This project depends on a separate backend server.  
Please set up the **frontend first**, then clone and run the **backend server**, and finally start the frontend app.

---

### 1️⃣ Clone this repository (Frontend)

```
git clone https://github.com/JustinWangsa/cashier-network-based.git
```
Install frontend dependencies:
```
npm install
```

### 2️⃣ Clone and run the backend server
```
git clone https://github.com/JustinWangsa/network-based.git
cd network-based/server/server
```

Install backend dependencies:
```
npm install
```

Set up the database

1. Run the table creation script:
```
/server/init/createTable.sql
```
This will create the required tables for the application.

2. After the tables are created, run the data seed script:
```
/server/Ztesting/populate.sql
```
3. Start the backend server
```
npm run start
```

### 3️⃣ Start the frontend application
 

