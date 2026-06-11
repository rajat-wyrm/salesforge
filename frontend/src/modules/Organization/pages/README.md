Project Execution Workflow (Three-Window Setup)

This document outlines the three concurrent processes required to run the full MERN application.

Important: You must open three separate terminal windows and execute the steps in order, leaving each terminal window open after its command has executed successfully.

💻 Window 1: Start MongoDB Daemon

This initializes the local database instance.

1. Navigate to MongoDB Binaries:

cd "C:\Program Files\MongoDB\Server\8.2\bin"


2. Run MongoDB Daemon:

mongod


Expected Result: MongoDB daemon running and waiting for connections.

💻 Window 2: Start API Server (Backend)

This starts the Node.js/Express server, which connects to MongoDB and serves the API on http://localhost:3000.

1. Navigate to Backend Project Directory:

cd C:\Users\chand\OneDrive\Desktop\salesforge-backend-861fcf47a9b516d9cc4cce76f4e1b1d99f39988a


2. Run Backend Server:

node server.js


Expected Result: Server is running successfully on http://localhost:3000 and MongoDB connected successfully!

💻 Window 3: Start React Frontend

This starts the Vite development server, which runs the application and communicates with the backend via API calls.

1. Navigate to Frontend Project Directory:

cd C:\Users\chand\FinEdge-WebApp


2. Run React Frontend:

npm run dev


Expected Result: VITE v7.1.12 ready and application served at http://localhost:5174/

Application Access

Once all three windows show their expected successful startup messages, open your web browser and navigate to:

http://localhost:5174/