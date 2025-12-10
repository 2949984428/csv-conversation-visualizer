const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// 初始化 R2 客户端
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * API 路由：生成预签名上传 URL
 *
 * 请求示例：
 * POST /api/get-upload-url
 * {
 *   "fileName": "export-2025-12-08.csv",
 *   "fileSize": 10485760,
 *   "contentType": "text/csv"
 * }
 *
 * 响应示例：
 * {
 *   "uploadUrl": "https://...presigned-url...",
 *   "publicUrl": "https://pub-xxx.r2.dev/123456-export-2025-12-08.csv",
 *   "key": "123456-export-2025-12-08.csv"
 * }
 */
module.exports = async (req, res) => {
  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, fileSize, contentType = 'text/csv' } = req.body;

    // 验证参数
    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' });
    }

    // 生成唯一文件名（时间戳 + 原文件名）
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${fileName}`;

    // 创建 PutObject 命令
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: uniqueFileName,
      ContentType: contentType,
      // 可选：添加元数据
      Metadata: {
        'original-name': fileName,
        'upload-timestamp': timestamp.toString(),
        'file-size': (fileSize || 0).toString(),
      },
    });

    // 生成预签名 URL（15 分钟有效期）
    const uploadUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 900, // 15 分钟
    });

    // 构建公共访问 URL
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${uniqueFileName}`;

    console.log('[get-upload-url] Generated presigned URL:', {
      fileName: uniqueFileName,
      fileSize,
      expiresIn: '15 minutes',
    });

    // 返回签名 URL 和公共 URL
    res.status(200).json({
      success: true,
      uploadUrl: uploadUrl,
      publicUrl: publicUrl,
      key: uniqueFileName,
      expiresIn: 900,
    });

  } catch (error) {
    console.error('[get-upload-url] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate upload URL',
    });
  }
};
