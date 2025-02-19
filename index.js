const express = require('express')

const fs = require('fs');
const createError = require('http-errors');
const morgan = require('morgan');
const { Client } = require('whatsapp-web.js');
require('dotenv').config();

const app = express();

const SESSION_FILE_PATH = './session.json';
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
  sessionCfg = require(SESSION_FILE_PATH);
}

const client = new Client({
  puppeteer: { headless: false }, // Make headless true or remove to run browser in background
  session: sessionCfg,
});

client.initialize();

// Add this after express code but before starting the server
const qrcode = require('qrcode-terminal')
client.on('qr', qr => {
    // NOTE: This event will not be fired if a session is specified.
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, { small: true }); // Add this line
    app.get('/getqr', (req, res, next) => {
      res.send({ qr });
    });
  });
  
  client.on('authenticated', session => {
    console.log('AUTHENTICATED', session);
    sessionCfg = session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
      if (err) {
        console.error(err);
      }
    });
  });
  
  client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessfull
    console.error('AUTHENTICATION FAILURE', msg);
  });
  
  client.on('ready', () => {
    console.log('READY');
  });

  app.post('/sendmessage', async (req, res, next) => {
    try {
      const { number, message } = req.body; // Get the body
      const msg = await client.sendMessage(`${number}@c.us`, message); // Send the message
      res.send({ msg }); // Send the response
    } catch (error) {
      next(error);
    }
  });
  
  
  // Listening for the server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀 @ http://localhost:${PORT}`));
  