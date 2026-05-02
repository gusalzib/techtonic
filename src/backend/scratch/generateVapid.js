const webpush = require('web-push');
const vapidKeys = webpush.generateVAPIDKeys();

// remove uneccessary prints later
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
