#!/bin/bash

# 需要的信息
ACCOUNT_ID="bc19681f5c65cc1581d746eca6f0c4e6"
BUCKET_NAME="csv-visualizer-uploads"

echo "======================================"
echo "通过 Cloudflare API 设置 R2 桶策略"
echo "======================================"
echo
echo "请提供您的 Cloudflare API Token："
echo "（需要有 R2 编辑权限）"
echo
read -p "API Token: " CF_API_TOKEN

if [ -z "$CF_API_TOKEN" ]; then
    echo "❌ API Token 不能为空"
    exit 1
fi

echo
echo "🔧 设置桶策略..."

# 桶策略 JSON
POLICY_JSON=$(cat << 'POLICY'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPresignedUploads",
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:PutObject"],
      "Resource": "arn:aws:s3:::csv-visualizer-uploads/*"
    },
    {
      "Sid": "AllowPublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::csv-visualizer-uploads/*"
    }
  ]
}
POLICY
)

# 调用 Cloudflare API
RESPONSE=$(curl -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/policy" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${POLICY_JSON}" \
  -w "\nHTTP_CODE: %{http_code}\n" \
  -s)

echo "$RESPONSE"
echo

if echo "$RESPONSE" | grep -q "HTTP_CODE: 200"; then
    echo "✅ 桶策略设置成功!"
    echo
    echo "现在可以测试上传了："
    echo "bash /tmp/test-r2-upload.sh"
else
    echo "❌ 设置失败"
    echo
    echo "可能的原因："
    echo "1. API Token 权限不足"
    echo "2. API Token 格式错误"
    echo "3. 账户 ID 或桶名称错误"
fi

echo
echo "======================================"
