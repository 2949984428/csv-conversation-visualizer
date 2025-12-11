const { S3Client, PutBucketPolicyCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env.local' });

const bucketPolicy = {
  Version: '2012-10-17',
  Statement: [
    {
      Sid: 'AllowPresignedUploads',
      Effect: 'Allow',
      Principal: '*',
      Action: ['s3:PutObject'],
      Resource: `arn:aws:s3:::${process.env.R2_BUCKET_NAME}/*`
    },
    {
      Sid: 'AllowPublicRead',
      Effect: 'Allow',
      Principal: '*',
      Action: ['s3:GetObject'],
      Resource: `arn:aws:s3:::${process.env.R2_BUCKET_NAME}/*`
    }
  ]
};

async function setBucketPolicy() {
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });

  try {
    console.log('🔧 设置桶策略...');
    console.log('桶名称:', process.env.R2_BUCKET_NAME);
    console.log('账户 ID:', process.env.R2_ACCOUNT_ID);
    console.log('\n策略内容:');
    console.log(JSON.stringify(bucketPolicy, null, 2));

    const command = new PutBucketPolicyCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Policy: JSON.stringify(bucketPolicy),
    });

    const response = await client.send(command);
    console.log('\n✅ 桶策略设置成功!');
    console.log('响应:', response);
    
  } catch (error) {
    console.error('\n❌ 设置失败:', error.message);
    if (error.$metadata) {
      console.error('HTTP 状态码:', error.$metadata.httpStatusCode);
    }
    console.error('错误详情:', error);
    process.exit(1);
  }
}

setBucketPolicy();
