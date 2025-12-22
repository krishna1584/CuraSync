const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
// Option 1: Use CLOUDINARY_URL if available (most convenient)
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
    secure: true
  });
} else {
  // Option 2: Use individual credentials
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

// Upload file to Cloudinary
const uploadToCloudinary = async (fileBuffer, fileName, folder = 'medical-reports') => {
  try {
    return new Promise((resolve, reject) => {
      // Determine resource type based on file
      const isPdf = fileName.toLowerCase().endsWith('.pdf');
      const resourceType = isPdf ? 'raw' : 'image';
      
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: resourceType,
          public_id: `${Date.now()}-${fileName.replace(/\.[^/.]+$/, '')}`, // Remove extension from public_id
          access_mode: 'public',
          invalidate: true
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

// Delete file from Cloudinary
const deleteFromCloudinary = async (publicId, resourceType = 'raw') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    throw new Error(`Cloudinary delete failed: ${error.message}`);
  }
};

// Get file URL with transformations
const getOptimizedUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    ...options
  });
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  getOptimizedUrl
};
