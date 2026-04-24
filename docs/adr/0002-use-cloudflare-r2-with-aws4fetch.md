# Architecture Decisions Record

## 1. Context

The TradeWitness Desktop Collector will frequently upload screenshots of users' trades for OCR processing and portfolio display. We needed a robust Object Storage solution that integrates seamlessly with our Next.js backend while keeping egress costs to an absolute minimum.

## 2. Decision

We chose **Cloudflare R2** as our object storage provider, interacting with it via the lightweight **aws4fetch** library instead of the official AWS SDK.

## 3. Alternatives Considered

- **Amazon S3:** Industry standard, but carries notorious egress fees ($0.09 per GB) which can become prohibitively expensive for an image-heavy application.
- **Supabase Storage:** Convenient since we already use Supabase for the database. However, the free tier limits (1GB) would be exhausted quickly, and their bandwidth costs are higher than Cloudflare.
- **AWS SDK (`@aws-sdk/client-s3`):** The standard way to talk to S3/R2 in Node.js. It was rejected because it adds massive bundle size overhead to Next.js serverless functions.

## 4. Consequences

- **Positive:** Egress bandwidth is completely free. The free tier allows 10GB of storage and millions of requests. By using `aws4fetch` (5KB), our server-side bundle size remains minuscule, leading to faster cold starts.
- **Negative:** We lose the convenience of AWS SDK's high-level abstractions (like built-in stream handling and multipart uploads). `aws4fetch` requires us to buffer the entire file into an `ArrayBuffer` in memory to calculate the SHA-256 signature, which is fine for small screenshots (100KB-500KB) but would be dangerous for large video files.