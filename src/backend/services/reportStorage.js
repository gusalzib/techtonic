const { PutObjectCommand } = require("@aws-sdk/client-s3");
const r2 = require("./r2Client");

const BUCKET = process.env.R2_BUCKET_NAME;

exports.uploadReportPdf = async ({
  userId,
  buffer,
  filename,
}) => {
  const key = `reports/${userId}/${filename}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: "application/pdf",
  });

  await r2.send(command);

  return {
    key,
    url: `${process.env.R2_PUBLIC_BASE_URL}/${BUCKET}/${key}`,
  };
};
