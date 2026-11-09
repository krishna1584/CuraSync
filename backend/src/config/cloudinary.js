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

// Medical files are stored as "authenticated" assets: they can only be fetched
// through a URL signed with our API secret, so they cannot be guessed or enumerated.
const PRIVATE_DELIVERY_TYPE = 'authenticated';

const sanitizeName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

// Upload file to Cloudinary as a private (authenticated) asset
const uploadToCloudinary = (fileBuffer, fileName, folder = 'medical-reports') => {
  const isPdf = fileName.toLowerCase().endsWith('.pdf');
  const resourceType = isPdf ? 'raw' : 'image';
  const safeName = sanitizeName(fileName);
  // Raw files keep their extension in the public ID (Cloudinary adds none for raw).
  const publicId = `${Date.now()}-${isPdf ? safeName : safeName.replace(/\.[^/.]+$/, '')}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        type: PRIVATE_DELIVERY_TYPE,
        public_id: publicId,
        invalidate: true
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

// Build a signed delivery URL for a stored asset.
const getSignedFileUrl = ({ publicId, resourceType = 'image', deliveryType = PRIVATE_DELIVERY_TYPE, format }) => (
  cloudinary.url(publicId, {
    resource_type: resourceType,
    type: deliveryType,
    sign_url: true,
    secure: true,
    ...(resourceType !== 'raw' && format ? { format } : {})
  })
);

// Delete file from Cloudinary
const deleteFromCloudinary = async (publicId, resourceType = 'raw', deliveryType = PRIVATE_DELIVERY_TYPE) => {
  try {
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      type: deliveryType,
      invalidate: true
    });
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
  PRIVATE_DELIVERY_TYPE,
  uploadToCloudinary,
  getSignedFileUrl,
  deleteFromCloudinary,
  getOptimizedUrl
};
