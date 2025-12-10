// Vercel Serverless Function: 上传文件到 Cloudflare R2
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

module.exports = async (req, res) => {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, fileContent, fileSize } = req.body;

    if (!fileName || !fileContent) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${fileName}`;

    // 解析 base64 文件内容
    const buffer = Buffer.from(fileContent, 'base64');

    // 上传到 R2
    await r2Client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: uniqueFileName,
      Body: buffer,
      ContentType: 'text/csv',
    }));

    // 生成公共访问 URL
    const r2Url = `${process.env.R2_PUBLIC_URL}/${uniqueFileName}`;

    // 返回历史记录对象
    const record = {
      id: timestamp.toString(),
      fileName: fileName,
      fileSize: fileSize || buffer.length,
      uploadTime: new Date().toISOString(),
      r2Url: r2Url,
    };

    res.status(200).json({
      success: true,
      record: record,
    });

  } catch (error) {
    console.error('R2 上传失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'R2 上传失败',
    });
  }
};
