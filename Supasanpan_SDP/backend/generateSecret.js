const crypto = require('crypto');

// Generate a random 32-byte string
const secret = crypto.randomBytes(32).toString('hex');
console.log('Generated JWT Secret Key:');
console.log(secret); 