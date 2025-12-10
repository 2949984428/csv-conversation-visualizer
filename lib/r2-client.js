// lib/r2-client.js
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload file to R2
 * @param {Buffer} fileBuffer - File content buffer
 * @param {string} fileName - File name with extension
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - Public URL of uploaded file
 */
async function uploadToR2(fileBuffer, fileName, contentType = 'text/csv') {
  const key = `uploads/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  });

  try {
    await r2Client.send(command);
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    console.log(`[R2] File uploaded successfully: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('[R2] Upload error:', error);
    throw new Error(`Failed to upload to R2: ${error.message}`);
  }
}

/**
 * List all files in R2 bucket
 * @param {number} maxKeys - Maximum number of keys to return
 * @returns {Promise<Array>} - Array of file objects
 */
async function listR2Files(maxKeys = 100) {
  const command = new ListObjectsV2Command({
    Bucket: process.env.R2_BUCKET_NAME,
    Prefix: 'uploads/',
    MaxKeys: maxKeys,
  });

  try {
    const response = await r2Client.send(command);
    const files = (response.Contents || []).map(item => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified,
      url: `${process.env.R2_PUBLIC_URL}/${item.Key}`,
    }));
    return files;
  } catch (error) {
    console.error('[R2] List error:', error);
    throw new Error(`Failed to list R2 files: ${error.message}`);
  }
}

/**
 * Delete file from R2
 * @param {string} key - File key (path in bucket)
 * @returns {Promise<void>}
 */
async function deleteFromR2(key) {
  const command = new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  });

  try {
    await r2Client.send(command);
    console.log(`[R2] File deleted successfully: ${key}`);
  } catch (error) {
    console.error('[R2] Delete error:', error);
    throw new Error(`Failed to delete from R2: ${error.message}`);
  }
}

module.exports = {
  r2Client,
  uploadToR2,
  listR2Files,
  deleteFromR2,
};
