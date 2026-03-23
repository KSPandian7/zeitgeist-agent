const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const crypto = require('crypto');

// Hardcoded credentials — works without .env
const CLOUD_NAME = 'dk1aqd6vf';
const API_KEY = '887548794248599';
const API_SECRET = process.env.CLOUDINARY_SECRET || 'h1teKL7gcnaf84AD-GlGyxVLZP4';

async function uploadImage(imagePath) {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const str = `folder=zeitgeist&timestamp=${timestamp}${API_SECRET}`;
    const signature = crypto.createHash('sha1').update(str).digest('hex');

    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath));
    form.append('api_key', API_KEY);
    form.append('timestamp', String(timestamp));
    form.append('signature', signature);
    form.append('folder', 'zeitgeist');

    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      form,
      { headers: form.getHeaders(), maxContentLength: Infinity, maxBodyLength: Infinity }
    );

    console.log('Uploaded to Cloudinary:', res.data.secure_url);
    return res.data.secure_url;
  } catch (err) {
    console.error('Cloudinary upload failed:', err.response?.data || err.message);
    return null;
  }
}

module.exports = { uploadImage };
