const fs = require('fs');

// Create backend .env
const backendEnv = `MONGO_URI=mongodb://localhost:27017/construction-management
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
GOOGLE_CLIENT_ID=923806966722-uj02gd7u2quc1vqvocv72dft2s2oqlcj.apps.googleusercontent.com
NODE_ENV=development`;

fs.writeFileSync('backend/.env', backendEnv);
console.log('Created backend/.env');

// Create frontend .env
const frontendEnv = `VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=923806966722-uj02gd7u2quc1vqvocv72dft2s2oqlcj.apps.googleusercontent.com`;

fs.writeFileSync('frontend/.env', frontendEnv);
console.log('Created frontend/.env');

console.log('Environment files created successfully!');
console.log('Please restart both servers.');
