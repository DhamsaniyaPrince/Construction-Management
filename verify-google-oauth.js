// Quick verification script to check Google OAuth setup
// Run with: node verify-google-oauth.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Google OAuth Configuration...\n');

// Check backend .env
const backendEnvPath = path.join(__dirname, 'backend', '.env');
if (fs.existsSync(backendEnvPath)) {
  const backendEnv = fs.readFileSync(backendEnvPath, 'utf8');
  const backendClientId = backendEnv.match(/GOOGLE_CLIENT_ID=(.+)/);
  if (backendClientId && backendClientId[1]) {
    const clientId = backendClientId[1].trim();
    if (clientId === 'your_google_client_id_here' || !clientId) {
      console.log('❌ Backend: GOOGLE_CLIENT_ID is not set (still has placeholder)');
    } else if (clientId.includes('.apps.googleusercontent.com')) {
      console.log('✅ Backend: GOOGLE_CLIENT_ID is set');
      console.log('   Client ID:', clientId.substring(0, 20) + '...');
    } else {
      console.log('⚠️  Backend: GOOGLE_CLIENT_ID format looks incorrect');
      console.log('   Should end with: .apps.googleusercontent.com');
    }
  } else {
    console.log('❌ Backend: GOOGLE_CLIENT_ID not found in .env');
  }
} else {
  console.log('❌ Backend: .env file not found');
}

// Check frontend .env
const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
if (fs.existsSync(frontendEnvPath)) {
  const frontendEnv = fs.readFileSync(frontendEnvPath, 'utf8');
  const frontendClientId = frontendEnv.match(/VITE_GOOGLE_CLIENT_ID=(.+)/);
  if (frontendClientId && frontendClientId[1]) {
    const clientId = frontendClientId[1].trim();
    if (clientId === 'your_google_client_id_here' || !clientId) {
      console.log('❌ Frontend: VITE_GOOGLE_CLIENT_ID is not set (still has placeholder)');
    } else if (clientId.includes('.apps.googleusercontent.com')) {
      console.log('✅ Frontend: VITE_GOOGLE_CLIENT_ID is set');
      console.log('   Client ID:', clientId.substring(0, 20) + '...');
    } else {
      console.log('⚠️  Frontend: VITE_GOOGLE_CLIENT_ID format looks incorrect');
      console.log('   Should end with: .apps.googleusercontent.com');
    }
  } else {
    console.log('❌ Frontend: VITE_GOOGLE_CLIENT_ID not found in .env');
  }
} else {
  console.log('❌ Frontend: .env file not found');
}

console.log('\n📝 Next Steps:');
console.log('1. Make sure you have a Google Client ID from: https://console.cloud.google.com/apis/credentials');
console.log('2. Replace "your_google_client_id_here" in both .env files with your actual Client ID');
console.log('3. Restart both backend and frontend servers');
console.log('4. Make sure the Client ID format is: xxxxx-xxxxx.apps.googleusercontent.com');
console.log('\n💡 Quick Fix Guide: See GOOGLE_OAUTH_QUICK_FIX.md');
console.log('📚 Full Setup Guide: See SETUP_GOOGLE_OAUTH.md');

