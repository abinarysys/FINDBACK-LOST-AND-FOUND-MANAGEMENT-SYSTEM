# FINDBACK-LOST-AND-FOUND-SYSTEM
A web-based Lost and Found Item Management System

## PROJECT OVERVIEW
FINDBACK is  a web-based lost and found item management system designed to help users report lost belongings, submit found-item reports, search for missing items, and manage item claims through a centralized platform.

## PLANNED FEATURES

### USER
- User regitration and login
- Report lost item
- Browse and search item listings
- Filter items by category or other relevant details
- Submit item claim requests
- View the status of submitted reports and claims
- Message each other through Chat FindBack

### ADMINISTRATOR FEATURES
- Admin Dashboard
- Manage user accounts
- Review lost and found reports
- Manage item listings
- Review and verify claim requests
- Update item and claim status
- Monitor system records

*Note: These are planned features and may change during development*

## TECHNOLOGIES USED
-  **HTML** - structures the web pages
-  **CSS** - styles the user interfaces
-  **JavaScript** - adds client-side interactivity
-  **Node.js** - runs the server-side JavaScript environment
-  **Express.js** - handles routing and server requests
-  **EJS (Embedded JavaScript)** - renders dynamic web pages using server-side data
-  **MySQL** - stores user account, item reports, claim request, and related records

## INSTALLATION
Install the following before setting up the project
- Node.js
- MySQL
- Code Editor

## SETUP

### 1. CLONE THE REPOSITORY
- git clone https://github.com/abinarysys/FINDBACK-LOST-AND-FOUND-SYSTEM.git
- cd FINDBACK-LOST-AND-FOUND-SYSTEM

### 2. INITIALIZE THE PROJECT
*If package.json does not exist:*
npm init -y

### 3. INSTALL DEPENDENCIES
- npm install express ejs mysql2 express-session socket.io nodemon mutler connect-flash
- *Or you can just check the package.json file to check the dependencies installed*

### 4. EXPORT DATABASE
Look for the file with .sql in the folder

### 5. DATABASE PASSWORD
Look for the /config/db.js file, if you have password, put your password in the db object
