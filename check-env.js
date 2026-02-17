const fs = require('fs');
const path = require('path');

console.log('🔍 Checking .env files...\n');

// Check backend .env
const backendEnvPath = path.join(__dirname, 'backend', '.env');
if (fs.existsSync(backendEnvPath)) {
  const backendEnv = fs.readFileSync(backendEnvPath, 'utf8');
  console.log('Backend .env content:');
  console.log(backendEnv);
  console.log('---');
} else {
  console.log('❌ Backend .env file not found');
}

// Check frontend .env
const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
if (fs.existsSync(frontendEnvPath)) {
  const frontendEnv = fs.readFileSync(frontendEnvPath, 'utf8');
  console.log('Frontend .env content:');
  console.log(frontendEnv);
  console.log('---');
} else {
  console.log('❌ Frontend .env file not found');
}
