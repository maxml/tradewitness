import fs from 'fs/promises';
import path from 'path';

const CORPUS_DIR = path.join(process.cwd(), 'docs/m3-corpus');

const templates = {
  architecture: [
    { name: "state-management.md", title: "Redux Toolkit State Management" },
    { name: "auth-flow.md", title: "Clerk Authentication Flow" },
    { name: "r2-storage.md", title: "Cloudflare R2 Object Storage" },
    { name: "db-schema.md", title: "Drizzle & Supabase Relational Schema" },
    { name: "turborepo.md", title: "Turborepo Monorepo Setup" }
  ],
  features: [
    { name: "journal-engine.md", title: "Trading Journal Core Engine" },
    { name: "statistics-mae-mfe.md", title: "Statistics: MAE & MFE Calculations" },
    { name: "mentor-views.md", title: "Mentor Public Profile Views" },
    { name: "ai-ocr.md", title: "AI Screenshot OCR Integration" },
    { name: "billing-stripe.md", title: "Stripe Billing & Subscriptions" }
  ],
  incidents: Array.from({length: 10}, (_, i) => ({ name: `incident-00${i+1}.md`, title: `Incident 00${i+1}: Outage Report` })),
  adrs: Array.from({length: 10}, (_, i) => ({ name: `adr-00${i+1}.md`, title: `ADR 00${i+1}: Architectural Decision` })),
  runbooks: [
    { name: "db-migrations.md", title: "Runbook: Database Migrations" },
    { name: "asset-optimization.md", title: "Runbook: Asset Optimization" },
    { name: "auth-troubleshooting.md", title: "Runbook: Auth Troubleshooting" }
  ]
};

const fillerText = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

TradeWitness leverages this concept heavily to ensure high performance and reliability across its distributed microservices architecture. When dealing with high-frequency trading data, milliseconds matter. Our backend services are optimized using Rust and Node.js to provide seamless data ingestion and querying.

### System Architecture Overview

The system is composed of several decoupled layers. At the edge, Cloudflare Workers route traffic and handle preliminary rate-limiting. The application tier is primarily Next.js deployed on Vercel, which interacts with our Supabase Postgres database. Drizzle ORM acts as the bridge, providing type-safe queries without the overhead of heavy abstractions like Prisma.

### Data Flow and Processing

1. **Ingestion**: Trading data is ingested either manually or via CSV uploads.
2. **Validation**: Zod schemas validate the incoming payload against our strict trading definitions.
3. **Storage**: Validated data is persisted in Postgres. Screenshots are hashed and uploaded to Cloudflare R2 using \`aws4fetch\` to avoid the bloated AWS SDK.
4. **Analysis**: Asynchronous background jobs compute Equity Curves, Maximum Adverse Excursion (MAE), and Maximum Favorable Excursion (MFE).

### Scalability and Future Proofing

To accommodate a growing user base of day traders, we have architected the system to scale horizontally. Turborepo caches our builds, enabling rapid CI/CD pipelines. We use feature flags extensively to decouple deployment from release, allowing us to test features like \`stripe_billing_v1\` in production with a subset of users before a global rollout.
`;

const generateContent = (type: string, title: string) => {
  // Generate ~1000 words per file by repeating the filler text
  const body = Array(10).fill(fillerText).join('\n\n');
  
  return `---
type: "${type}"
tags: ["${type}", "tradewitness", "documentation"]
last_modified: "${new Date().toISOString().split('T')[0]}"
---

# ${title}

${body}

## Conclusion
This document covers the core aspects of the ${title} within the TradeWitness ecosystem.
`;
}

async function main() {
  for (const [dir, files] of Object.entries(templates)) {
    for (const file of files) {
      const filePath = path.join(CORPUS_DIR, dir, file.name);
      await fs.writeFile(filePath, generateContent(dir.slice(0, -1), file.title), 'utf-8');
      console.log(`Generated ${filePath}`);
    }
  }
}

main().catch(console.error);
