// Vercel Serverless Function: 获取上传历史（从 localStorage + R2 同步）
module.exports = async (req, res) => {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // 客户端已通过 localStorage 管理历史记录
    // 这个端点可以用于未来的云端同步功能
    return res.status(200).json({
      success: true,
      history: [], // 暂时返回空数组，客户端使用 localStorage
      message: '使用客户端 localStorage 存储'
    });
  }

  if (req.method === 'DELETE') {
    // 删除历史记录（可以扩展为同时删除 R2 文件）
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: '缺少记录 ID'
      });
    }

    // TODO: 实现从 R2 删除文件的逻辑
    // const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

    return res.status(200).json({
      success: true,
      message: '记录已删除'
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
