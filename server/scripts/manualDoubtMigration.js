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
 * Manual migration script for specific doubt files
 */
async function manualDoubtMigration() {
  try {
    console.log('🔧 Starting manual doubt files migration to Cloudinary...\n');
    
    let migratedFiles = 0;
    let failedFiles = 0;
    
    // Manual mapping of files
    const fileMappings = [
      {
        originalName: 'IMG-20250723-WA0013.jpg',
        actualFile: 'answer-1755351261162-865217390.jpg',
        folder: 'uploads/doubts/answers',
        type: 'answer_attachment'
      },
      {
        originalName: 'IMG-20250723-WA0014.jpg',
        actualFile: 'answer-1755351261162-138445847.jpg',
        folder: 'uploads/doubts/answers',
        type: 'answer_attachment'
      }
    ];
    
    console.log('📋 File mappings to migrate:');
    fileMappings.forEach(mapping => {
      console.log(`  - ${mapping.originalName} → ${mapping.actualFile}`);
    });
    console.log('');
    
    // Migrate each file
    for (const mapping of fileMappings) {
      try {
        console.log(`🔄 Migrating ${mapping.originalName}...`);
        
        // Read the actual file
        const filePath = path.join(__dirname, '..', mapping.folder, mapping.actualFile);
        
        if (!fs.existsSync(filePath)) {
          console.log(`  ❌ File not found: ${mapping.actualFile}`);
          failedFiles++;
          continue;
        }
        
        console.log(`  📁 Found file: ${mapping.actualFile}`);
        
        // Upload to Cloudinary
        const fileBuffer = fs.readFileSync(filePath);
        const stats = fs.statSync(filePath);
        
        const cloudinaryResult = await uploadToCloudinary(
          fileBuffer,
          { 
            originalname: mapping.originalName,
            size: stats.size
          },
          'smart-learning/doubts/answers'
        );
        
        console.log(`  ✅ Successfully uploaded to Cloudinary`);
        console.log(`  🔗 Cloudinary URL: ${cloudinaryResult.cloudinaryUrl}`);
        
        // Now update the database records
        await updateDoubtRecords(mapping.originalName, cloudinaryResult);
        
        migratedFiles++;
        console.log(`  💾 Database updated for ${mapping.originalName}`);
        
      } catch (error) {
        console.error(`  ❌ Failed to migrate ${mapping.originalName}:`, error.message);
        failedFiles++;
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 MANUAL DOUBT MIGRATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Successfully migrated: ${migratedFiles}`);
    console.log(`Failed migrations: ${failedFiles}`);
    console.log('='.repeat(50));
    
    if (failedFiles > 0) {
      console.log('\n⚠️  Some files failed to migrate. Check the logs above for details.');
    }
    
    console.log('\n🎉 Manual doubt files migration completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

/**
 * Update doubt records in database with Cloudinary URLs
 */
async function updateDoubtRecords(originalFileName, cloudinaryResult) {
  try {
    // Find doubts that have this file as an answer attachment
    const doubts = await Doubt.find({
      'answer.attachments.fileName': originalFileName
    });
    
    if (doubts.length === 0) {
      console.log(`    ⚠️  No doubt records found for ${originalFileName}`);
      return;
    }
    
    console.log(`    📝 Found ${doubts.length} doubt record(s) to update`);
    
    for (const doubt of doubts) {
      // Update the answer attachment
      if (doubt.answer && doubt.answer.attachments) {
        for (let i = 0; i < doubt.answer.attachments.length; i++) {
          const attachment = doubt.answer.attachments[i];
          if (attachment.fileName === originalFileName) {
            doubt.answer.attachments[i].url = cloudinaryResult.cloudinaryUrl;
            doubt.answer.attachments[i].cloudinaryId = cloudinaryResult.cloudinaryId;
            doubt.answer.attachments[i].cloudinaryUrl = cloudinaryResult.cloudinaryUrl;
            console.log(`      ✅ Updated attachment in doubt: ${doubt.title}`);
          }
        }
      }
      
      await doubt.save();
    }
    
  } catch (error) {
    console.error(`    ❌ Error updating doubt records:`, error.message);
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  manualDoubtMigration();
}

module.exports = { manualDoubtMigration };
