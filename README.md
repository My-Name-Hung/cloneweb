# MB Bank Clone

A mobile-only web application that replicates the MB Bank registration and login screens. The application shows a 404 page for desktop users and the main content for mobile users.

## Features

- Mobile detection - Shows content only for mobile devices
- Desktop users see a custom 404 page with animations
- User registration functionality with MongoDB
- User login with session management
- Form validation

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or a remote connection)

## Installation

1. Clone the repository

```
git clone <repository-url>
cd cloneapp
```

2. Install dependencies

```
npm install
```

3. Create a `.env` file in the root directory with the following content:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/mbbank
```

## Running the application

### Development mode

1. Start the MongoDB server (if running locally)

2. Start the development server

```
npm run dev
```

3. In a separate terminal, start the backend server

```
node server.js
```

4. Open your browser and navigate to:

```
http://localhost:5173
```

### Production mode

1. Build the project

```
npm run build
```

2. Start the server

```
npm start
```

3. Open your browser and navigate to:

```
http://localhost:3000
```

## Testing the application

- Access from a desktop browser to see the 404 page
- Access from a mobile device or use responsive mode in browser dev tools to see the registration form
- Create an account and log in to access the home page
