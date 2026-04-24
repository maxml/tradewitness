import { AwsClient } from "aws4fetch";

const r2 = new AwsClient({
  accessKeyId: process.env.R2_ACCESS_KEY_ID!,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  region: "auto",
  service: "s3",
});

const endpoint = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const bucket = process.env.R2_BUCKET_NAME!;
const publicBase = process.env.R2_PUBLIC_URL!;

export async function uploadScreenshot(
  body: ArrayBuffer | Uint8Array | string,
  key: string,
  contentType: string
): Promise<string> {
  const url = `${endpoint}/${bucket}/${key}`;
  const res = await r2.fetch(url, {
    method: "PUT",
    body: body as BodyInit,
    headers: { "Content-Type": contentType },
  });
  if (!res.ok) throw new Error(`R2 upload failed: ${res.status} ${await res.text()}`);
  return `${publicBase}/${key}`;
}

export async function deleteScreenshot(key: string): Promise<void> {
  const url = `${endpoint}/${bucket}/${key}`;
  const res = await r2.fetch(url, { method: "DELETE" });
  if (!res.ok && res.status !== 404) {
    throw new Error(`R2 delete failed: ${res.status}`);
  }
}
