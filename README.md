# Orbit Project

This repository contains the code for the Orbit project, which consists of two main folders: `orbitapp` (the client-side mobile app) and `server` (the backend server). Below are the instructions to set up and run the project.

## Project Overview
The Orbit project is a mobile application designed to manage suspicious activity alerts, integrated with a backend server for data storage and push notifications. The app is built using Expo, while the server uses Node.js, Express, and MongoDB.

## Project Structure
- `orbitapp`: Contains the main application code for the mobile app built with Expo.
- `server`: Contains the backend server code built with Node.js and Express.

## Getting Started

### Prerequisites
- Node.js: Install the latest stable version from nodejs.org.
- npm or yarn: Comes with Node.js installation.
- Expo Go App: Install on your mobile device from the App Store or Google Play for testing.
- MongoDB: Use MongoDB Atlas or a local MongoDB instance. Configure the connection string in the .env file.
- Text Editor: Recommended: VS Code or any preferred IDE.

### Installation and Running

#### 1. Client-Side App (orbitapp)
- Navigate to the orbitapp directory: cd orbitapp
- Install dependencies: npm install
- Start the Expo development server: npx expo start
- Use the Expo Go app on your mobile device or a simulator to scan the QR code and run the app.

#### 2. Server-Side (server)
- Navigate to the server directory: cd server
- Install dependencies: npm install
- Start the server: node server.js
- Ensure your MongoDB connection string is correctly set in the .env file (e.g., MONGO_URL).

### Troubleshooting IP Issues
If the IP address does not update automatically (e.g., when using --lan), you can force set the IP address by following these steps:
- Set the environment variable for the hostname (Windows PowerShell): $env:REACT_NATIVE_PACKAGER_HOSTNAME="your-ip-address"
  Replace your-ip-address with the actual IP (e.g., 192.168.1.22).
- Start the Expo server with LAN option: npx expo start --lan
  Note: For macOS/Linux, use export REACT_NATIVE_PACKAGER_HOSTNAME="your-ip-address" instead of the PowerShell syntax.
