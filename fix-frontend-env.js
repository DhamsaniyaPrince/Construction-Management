const fs = require('fs');

const frontendEnv = `VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=923806966722-uj02gd7u2quc1vqvocv72dft2s2oqlcj.apps.googleusercontent.com`;

fs.writeFileSync('frontend/.env', frontendEnv);
console.log('Fixed frontend/.env with Google Client ID');
