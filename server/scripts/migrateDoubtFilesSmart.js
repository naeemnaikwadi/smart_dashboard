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
 * Smart migration script for doubt files
 */
async function migrateDoubtFilesSmart() {
  try {
    console.log('❓ Starting smart doubt files migration to Cloudinary...\n');
    
    let totalFiles = 0;
    let migratedFiles = 0;
    let failedFiles = 0;
    
    // Find all doubts
    const doubts = await Doubt.find({});
    console.log(`Found ${doubts.length} doubts`);
    
    // Get all available files in uploads
    const availableFiles = await getAllAvailableFiles();
    console.log(`Available files in uploads:`, availableFiles);
    
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
            console.log(`  - Looking for doubt image: ${image.fileName}`);
            
            // Find local file using smart matching
            const localPath = await findFileSmart(image.fileName, availableFiles.doubts);
            
            if (localPath) {
              console.log(`    Found file: ${path.basename(localPath)}`);
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
            console.log(`  - Looking for answer attachment: ${attachment.fileName}`);
            
            // Find local file using smart matching
            const localPath = await findFileSmart(attachment.fileName, availableFiles.doubtAnswers);
            
            if (localPath) {
              console.log(`    Found file: ${path.basename(localPath)}`);
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
    console.log('📊 SMART DOUBT MIGRATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total files processed: ${totalFiles}`);
    console.log(`Successfully migrated: ${migratedFiles}`);
    console.log(`Failed migrations: ${failedFiles}`);
    console.log('='.repeat(50));
    
    if (failedFiles > 0) {
      console.log('\n⚠️  Some files failed to migrate. Check the logs above for details.');
    }
    
    console.log('\n🎉 Smart doubt files migration completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

/**
 * Get all available files in uploads directory
 */
async function getAllAvailableFiles() {
  const uploadsPath = path.join(__dirname, '..', 'uploads');
  const files = {};
  
  try {
    // Get doubt files
    const doubtsPath = path.join(uploadsPath, 'doubts');
    if (fs.existsSync(doubtsPath)) {
      files.doubts = fs.readdirSync(doubtsPath).map(file => path.join(doubtsPath, file));
    }
    
    // Get doubt answer files
    const doubtAnswersPath = path.join(uploadsPath, 'doubts', 'answers');
    if (fs.existsSync(doubtAnswersPath)) {
      files.doubtAnswers = fs.readdirSync(doubtAnswersPath).map(file => path.join(doubtAnswersPath, file));
    }
    
    // Get profile files
    const profilesPath = path.join(uploadsPath, 'profiles');
    if (fs.existsSync(profilesPath)) {
      files.profiles = fs.readdirSync(profilesPath).map(file => path.join(profilesPath, file));
    }
    
    // Get learning path files
    const learningPathsPath = path.join(uploadsPath, 'learning-paths');
    if (fs.existsSync(learningPathsPath)) {
      files.learningPaths = fs.readdirSync(learningPathsPath).map(file => path.join(learningPathsPath, file));
    }
    
    // Get course material files
    if (fs.existsSync(uploadsPath)) {
      files.courses = fs.readdirSync(uploadsPath)
        .filter(file => !fs.statSync(path.join(uploadsPath, file)).isDirectory())
        .map(file => path.join(uploadsPath, file));
    }
    
  } catch (error) {
    console.error('Error reading uploads directory:', error);
  }
  
  return files;
}

/**
 * Smart file finding - try multiple strategies
 */
async function findFileSmart(fileName, availableFiles) {
  if (!availableFiles || availableFiles.length === 0) {
    return null;
  }
  
  // Strategy 1: Exact match
  const exactMatch = availableFiles.find(file => path.basename(file) === fileName);
  if (exactMatch) {
    return exactMatch;
  }
  
  // Strategy 2: Contains original filename (for timestamped files)
  const containsMatch = availableFiles.find(file => {
    const baseName = path.basename(file);
    return baseName.includes(fileName) || fileName.includes(path.parse(baseName).name);
  });
  if (containsMatch) {
    return containsMatch;
  }
  
  // Strategy 3: Fuzzy match by extension and similar name
  const fileExt = path.extname(fileName).toLowerCase();
  const fileNameWithoutExt = path.parse(fileName).name;
  
  const fuzzyMatch = availableFiles.find(file => {
    const baseName = path.basename(file);
    const baseExt = path.extname(baseName).toLowerCase();
    const baseNameWithoutExt = path.parse(baseName).name;
    
    // Same extension and similar name
    return baseExt === fileExt && 
           (baseNameWithoutExt.includes(fileNameWithoutExt) || 
            fileNameWithoutExt.includes(baseNameWithoutExt));
  });
  
  return fuzzyMatch || null;
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateDoubtFilesSmart();
}

module.exports = { migrateDoubtFilesSmart };
