const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Doubt = require('../models/Doubt');
require('dotenv').config();

// Configure Cloudinary directly in the script
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create a simple upload function for migration
const uploadToCloudinary = async (fileBuffer, fileInfo, folder = 'smart-learning') => {
  try {
    const { Readable } = require('stream');
    const stream = Readable.from(fileBuffer);
    
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: folder,
          public_id: `${Date.now()}-${Math.round(Math.random() * 1E9)}`,
          overwrite: false
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      stream.pipe(uploadStream);
    });

    return {
      cloudinaryId: result.public_id,
      cloudinaryUrl: result.secure_url,
      cloudinaryVersion: result.version
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
};

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

/**
 * Migrate doubt files to Cloudinary
 */
async function migrateDoubtFiles() {
  try {
    console.log('❓ Starting doubt files migration to Cloudinary...\n');
    
    let totalFiles = 0;
    let migratedFiles = 0;
    let failedFiles = 0;
    
    // Find all doubts
    const doubts = await Doubt.find({});
    console.log(`Found ${doubts.length} doubts`);
    
    for (const doubt of doubts) {
      console.log(`\nProcessing doubt: ${doubt.title}`);
      
      // 1. Migrate doubt images
      if (doubt.images && doubt.images.length > 0) {
        for (let i = 0; i < doubt.images.length; i++) {
          const image = doubt.images[i];
          totalFiles++;
          
          // Skip if already migrated
          if (image.url.includes('cloudinary')) {
            console.log(`  - Doubt image already migrated: ${image.fileName}`);
            continue;
          }
          
          try {
            console.log(`  - Migrating doubt image: ${image.fileName}`);
            
            // Find local file
            const localPath = await findLocalFile(image.fileName, 'uploads/doubts');
            
            if (localPath) {
              const fileBuffer = fs.readFileSync(localPath);
              const cloudinaryResult = await uploadToCloudinary(
                fileBuffer, 
                { originalname: image.fileName }, 
                'smart-learning/doubts'
              );
              
              // Update doubt image
              doubt.images[i].url = cloudinaryResult.cloudinaryUrl;
              doubt.images[i].cloudinaryId = cloudinaryResult.cloudinaryId;
              doubt.images[i].cloudinaryUrl = cloudinaryResult.cloudinaryUrl;
              
              migratedFiles++;
              console.log(`    ✅ Successfully migrated doubt image`);
            } else {
              console.log(`    ⚠️  Local file not found: ${image.fileName}`);
            }
          } catch (error) {
            console.error(`    ❌ Failed to migrate doubt image:`, error.message);
            failedFiles++;
          }
        }
      }
      
      // 2. Migrate answer attachments
      if (doubt.answer && doubt.answer.attachments && doubt.answer.attachments.length > 0) {
        for (let i = 0; i < doubt.answer.attachments.length; i++) {
          const attachment = doubt.answer.attachments[i];
          totalFiles++;
          
          // Skip if already migrated
          if (attachment.url.includes('cloudinary')) {
            console.log(`  - Answer attachment already migrated: ${attachment.fileName}`);
            continue;
          }
          
          try {
            console.log(`  - Migrating answer attachment: ${attachment.fileName}`);
            
            // Find local file
            const localPath = await findLocalFile(attachment.fileName, 'uploads/doubts/answers');
            
            if (localPath) {
              const fileBuffer = fs.readFileSync(localPath);
              const cloudinaryResult = await uploadToCloudinary(
                fileBuffer, 
                { originalname: attachment.fileName }, 
                'smart-learning/doubts/answers'
              );
              
              // Update answer attachment
              doubt.answer.attachments[i].url = cloudinaryResult.cloudinaryUrl;
              doubt.answer.attachments[i].cloudinaryId = cloudinaryResult.cloudinaryId;
              doubt.answer.attachments[i].cloudinaryUrl = cloudinaryResult.cloudinaryUrl;
              
              migratedFiles++;
              console.log(`    ✅ Successfully migrated answer attachment`);
            } else {
              console.log(`    ⚠️  Local file not found: ${attachment.fileName}`);
            }
          } catch (error) {
            console.error(`    ❌ Failed to migrate answer attachment:`, error.message);
            failedFiles++;
          }
        }
      }
      
      // Save the updated doubt
      await doubt.save();
      console.log(`  ✓ Doubt "${doubt.title}" updated and saved`);
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 DOUBT MIGRATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total files processed: ${totalFiles}`);
    console.log(`Successfully migrated: ${migratedFiles}`);
    console.log(`Failed migrations: ${failedFiles}`);
    console.log('='.repeat(50));
    
    if (failedFiles > 0) {
      console.log('\n⚠️  Some files failed to migrate. Check the logs above for details.');
    }
    
    console.log('\n🎉 Doubt files migration completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

/**
 * Find local file by searching in upload directories
 */
async function findLocalFile(fileName, searchDir) {
  const uploadPath = path.join(__dirname, '..', searchDir);
  
  if (!fs.existsSync(uploadPath)) {
    return null;
  }
  
  // Try exact match first
  const exactPath = path.join(uploadPath, fileName);
  if (fs.existsSync(exactPath)) {
    return exactPath;
  }
  
  // Try to find file with timestamp prefix
  const files = fs.readdirSync(uploadPath);
  const matchingFile = files.find(file => file.includes(fileName));
  
  if (matchingFile) {
    return path.join(uploadPath, matchingFile);
  }
  
  return null;
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateDoubtFiles();
}

module.exports = { migrateDoubtFiles };
