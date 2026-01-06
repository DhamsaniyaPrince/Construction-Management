const fs = require('fs').promises;
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '../uploads/reports');

// Ensure upload directory exists
const ensureUploadDir = async () => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', error);
  }
};

// Save file locally and return URL
const saveFile = async (file, folder = 'reports') => {
  await ensureUploadDir();
  
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileExtension = path.extname(file.originalname);
  const fileName = `${timestamp}-${randomString}${fileExtension}`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  await fs.writeFile(filePath, file.buffer);

  // Return relative URL path
  return {
    url: `/uploads/reports/${fileName}`,
    filename: fileName,
    path: filePath,
  };
};

// Delete file
const deleteFile = async (filePath) => {
  try {
    const fullPath = path.join(__dirname, '../', filePath);
    await fs.unlink(fullPath);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

module.exports = { saveFile, deleteFile, ensureUploadDir };

