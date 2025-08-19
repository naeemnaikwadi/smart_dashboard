const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'doglr9qsr',
  api_key: '887485676163634',
  api_secret: '6X1WfjDDCYZw_GI9C7yjPmjoT6g'
});

module.exports = cloudinary;
