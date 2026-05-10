---
type: "incident"
tags: ["incident", "tradewitness", "documentation"]
last_modified: "2026-05-10"
---

# Incident 001: Outage Report


Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

TradeWitness leverages this concept heavily to ensure high performance and reliability across its distributed microservices architecture. When dealing with high-frequency trading data, milliseconds matter. Our backend services are optimized using Rust and Node.js to provide seamless data ingestion and querying.

### System Architecture Overview

The system is composed of several decoupled layers. At the edge, Cloudflare Workers route traffic and handle preliminary rate-limiting. The application tier is primarily Next.js deployed on Vercel, which interacts with our Supabase Postgres database. Drizzle ORM acts as the bridge, providing type-safe queries without the overhead of heavy abstractions like Prisma.

### Data Flow and Processing

1. **Ingestion**: Trading data is ingested either manually or via CSV uploads.
2. **Validation**: Zod schemas validate the incoming payload against our strict trading definitions.
3. **Storage**: Validated data is persisted in Postgres. Screenshots are hashed and uploaded to Cloudflare R2 using `aws4fetch` to avoid the bloated AWS SDK.
4. **Analysis**: Asynchronous background jobs compute Equity Curves, Maximum Adverse Excursion (MAE), and Maximum Favorable Excursion (MFE).

### Scalability and Future Proofing

To accommodate a growing user base of day traders, we have architected the system to scale horizontally. Turborepo caches our builds, enabling rapid CI/CD pipelines. We use feature flags extensively to decouple deployment from release, allowing us to test features like `stripe_billing_v1` in production with a subset of users before a global rollout.



Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

TradeWitness leverages this concept heavily to ensure high performance and reliability across its distributed microservices architecture. When dealing with high-frequency trading data, milliseconds matter. Our backend services are optimized using Rust and Node.js to provide seamless data ingestion and querying.

### System Architecture Overview

The system is composed of several decoupled layers. At the edge, Cloudflare Workers route traffic and handle preliminary rate-limiting. The application tier is primarily Next.js deployed on Vercel, which interacts with our Supabase Postgres database. Drizzle ORM acts as the bridge, providing type-safe queries without the overhead of heavy abstractions like Prisma.

### Data Flow and Processing

1. **Ingestion**: Trading data is ingested either manually or via CSV uploads.
2. **Validation**: Zod schemas validate the incoming payload against our strict trading definitions.
3. **Storage**: Validated data is persisted in Postgres. Screenshots are hashed and uploaded to Cloudflare R2 using `aws4fetch` to avoid the bloated AWS SDK.
4. **Analysis**: Asynchronous background jobs compute Equity Curves, Maximum Adverse Excursion (MAE), and Maximum Favorable Excursion (MFE).

### Scalability and Future Proofing

To accommodate a growing user base of day traders, we have architected the system to scale horizontally. Turborepo caches our builds, enabling rapid CI/CD pipelines. We use feature flags extensively to decouple deployment from release, allowing us to test features like `stripe_billing_v1` in production with a subset of users before a global rollout.



Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

TradeWitness leverages this concept heavily to ensure high performance and reliability across its distributed microservices architecture. When dealing with high-frequency trading data, milliseconds matter. Our backend services are optimized using Rust and Node.js to provide seamless data ingestion and querying.

### System Architecture Overview

The system is composed of several decoupled layers. At the edge, Cloudflare Workers route traffic and handle preliminary rate-limiting. The application tier is primarily Next.js deployed on Vercel, which interacts with our Supabase Postgres database. Drizzle ORM acts as the bridge, providing type-safe queries without the overhead of heavy abstractions like Prisma.

### Data Flow and Processing

1. **Ingestion**: Trading data is ingested either manually or via CSV uploads.
2. **Validation**: Zod schemas validate the incoming payload against our strict trading definitions.
3. **Storage**: Validated data is persisted in Postgres. Screenshots are hashed and uploaded to Cloudflare R2 using `aws4fetch` to avoid the bloated AWS SDK.
4. **Analysis**: Asynchronous background jobs compute Equity Curves, Maximum Adverse Excursion (MAE), and Maximum Favorable Excursion (MFE).

### Scalability and Future Proofing

To accommodate a growing user base of day traders, we have architected the system to scale horizontally. Turborepo caches our builds, enabling rapid CI/CD pipelines. We use feature flags extensively to decouple deployment from release, allowing us to test features like `stripe_billing_v1` in production with a subset of users before a global rollout.



Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

TradeWitness leverages this concept heavily to ensure high performance and reliability across its distributed microservices architecture. When dealing with high-frequency trading data, milliseconds matter. Our backend services are optimized using Rust and Node.js to provide seamless data ingestion and querying.

### System Architecture Overview

The system is composed of several decoupled layers. At the edge, Cloudflare Workers route traffic and handle preliminary rate-limiting. The application tier is primarily Next.js deployed on Vercel, which interacts with our Supabase Postgres database. Drizzle ORM acts as the bridge, providing type-safe queries without the overhead of heavy abstractions like Prisma.

### Data Flow and Processing

1. **Ingestion**: Trading data is ingested either manually or via CSV uploads.
2. **Validation**: Zod schemas validate the incoming payload against our strict trading definitions.
3. **Storage**: Validated data is persisted in Postgres. Screenshots are hashed and uploaded to Cloudflare R2 using `aws4fetch` to avoid the bloated AWS SDK.
4. **Analysis**: Asynchronous background jobs compute Equity Curves, Maximum Adverse Excursion (MAE), and Maximum Favorable Excursion (MFE).

### Scalability and Future Proofing

To accommodate a growing user base of day traders, we have architected the system to scale horizontally. Turborepo caches our builds, enabling rapid CI/CD pipelines. We use feature flags extensively to decouple deployment from release, allowing us to test features like `stripe_billing_v1` in production with a subset of users before a global rollout.



Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

TradeWitness leverages this concept heavily to ensure high performance and reliability across its distributed microservices architecture. When dealing with high-frequency trading data, milliseconds matter. Our backend services are optimized using Rust and Node.js to provide seamless data ingestion and querying.

### System Architecture Overview

The system is composed of several decoupled layers. At the edge, Cloudflare Workers route traffic and handle preliminary rate-limiting. The application tier is primarily Next.js deployed on Vercel, which interacts with our Supabase Postgres database. Drizzle ORM acts as the bridge, providing type-safe queries without the overhead of heavy abstractions like Prisma.

### Data Flow and Processing

1. **Ingestion**: Trading data is ingested either manually or via CSV uploads.
2. **Validation**: Zod schemas validate the incoming payload against our strict trading definitions.
3. **Storage**: Validated data is persisted in Postgres. Screenshots are hashed and uploaded to Cloudflare R2 using `aws4fetch` to avoid the bloated AWS SDK.
4. **Analysis**: Asynchronous background jobs compute Equity Curves, Maximum Adverse Excursion (MAE), and Maximum Favorable Excursion (MFE).

### Scalability and Future Proofing

To accommodate a growing user base of day traders, we have architected the system to scale horizontally. Turborepo caches our builds, enabling rapid CI/CD pipelines. We use feature flags extensively to decouple deployment from release, allowing us to test features like `stripe_billing_v1` in production with a subset of users before a global rollout.



Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

TradeWitness leverages this concept heavily to ensure high performance and reliability across its distributed microservices architecture. When dealing with high-frequency trading data, milliseconds matter. Our backend services are optimized using Rust and Node.js to provide seamless data ingestion and querying.

### System Architecture Overview

The system is composed of several decoupled layers. At the edge, Cloudflare Workers route traffic and handle preliminary rate-limiting. The application tier is primarily Next.js deployed on Vercel, which interacts with our Supabase Postgres database. Drizzle ORM acts as the bridge, providing type-safe queries without the overhead of heavy abstractions like Prisma.

### Data Flow and Processing

1. **Ingestion**: Trading data is ingested either manually or via CSV uploads.
2. **Validation**: Zod schemas validate the incoming payload against our strict trading definitions.
3. **Storage**: Validated data is persisted in Postgres. Screenshots are hashed and uploaded to Cloudflare R2 using `aws4fetch` to avoid the bloated AWS SDK.
4. **Analysis**: Asynchronous background jobs compute Equity Curves, Maximum Adverse Excursion (MAE), and Maximum Favorable Excursion (MFE).

### Scalability and Future Proofing

To accommodate a growing user base of day traders, we have architected the system to scale horizontally. Turborepo caches our builds, enabling rapid CI/CD pipelines. We use feature flags extensively to decouple deployment from release, allowing us to test features like `stripe_billing_v1` in production with a subset of users before a global rollout.



Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

TradeWitness leverages this concept heavily to ensure high performance and reliability across its distributed microservices architecture. When dealing with high-frequency trading data, milliseconds matter. Our backend services are optimized using Rust and Node.js to provide seamless data ingestion and querying.

### System Architecture Overview

The system is composed of several decoupled layers. At the edge, Cloudflare Workers route traffic and handle preliminary rate-limiting. The application tier is primarily Next.js deployed on Vercel, which interacts with our Supabase Postgres database. Drizzle ORM acts as the bridge, providing type-safe queries without the overhead of heavy abstractions like Prisma.

### Data Flow and Processing

1. **Ingestion**: Trading data is ingested either manually or via CSV uploads.
2. **Validation**: Zod schemas validate the incoming payload against our strict trading definitions.
3. **Storage**: Validated data is persisted in Postgres. Screenshots are hashed and uploaded to Cloudflare R2 using `aws4fetch` to avoid the bloated AWS SDK.
4. **Analysis**: Asynchronous background jobs compute Equity Curves, Maximum Adverse Excursion (MAE), and Maximum Favorable Excursion (MFE).

### Scalability and Future Proofing

To accommodate a growing user base of day traders, we have architected the system to scale horizontally. Turborepo caches our builds, enabling rapid CI/CD pipelines. We use feature flags extensively to decouple deployment from release, allowing us to test features like `stripe_billing_v1` in production with a subset of users before a global rollout.



Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

TradeWitness leverages this concept heavily to ensure high performance and reliability across its distributed microservices architecture. When dealing with high-frequency trading data, milliseconds matter. Our backend services are optimized using Rust and Node.js to provide seamless data ingestion and querying.

### System Architecture Overview

The system is composed of several decoupled layers. At the edge, Cloudflare Workers route traffic and handle preliminary rate-limiting. The application tier is primarily Next.js deployed on Vercel, which interacts with our Supabase Postgres database. Drizzle ORM acts as the bridge, providing type-safe queries without the overhead of heavy abstractions like Prisma.

### Data Flow and Processing

1. **Ingestion**: Trading data is ingested either manually or via CSV uploads.
2. **Validation**: Zod schemas validate the incoming payload against our strict trading definitions.
3. **Storage**: Validated data is persisted in Postgres. Screenshots are hashed and uploaded to Cloudflare R2 using `aws4fetch` to avoid the bloated AWS SDK.
4. **Analysis**: Asynchronous background jobs compute Equity Curves, Maximum Adverse Excursion (MAE), and Maximum Favorable Excursion (MFE).

### Scalability and Future Proofing

To accommodate a growing user base of day traders, we have architected the system to scale horizontally. Turborepo caches our builds, enabling rapid CI/CD pipelines. We use feature flags extensively to decouple deployment from release, allowing us to test features like `stripe_billing_v1` in production with a subset of users before a global rollout.



Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

TradeWitness leverages this concept heavily to ensure high performance and reliability across its distributed microservices architecture. When dealing with high-frequency trading data, milliseconds matter. Our backend services are optimized using Rust and Node.js to provide seamless data ingestion and querying.

### System Architecture Overview

The system is composed of several decoupled layers. At the edge, Cloudflare Workers route traffic and handle preliminary rate-limiting. The application tier is primarily Next.js deployed on Vercel, which interacts with our Supabase Postgres database. Drizzle ORM acts as the bridge, providing type-safe queries without the overhead of heavy abstractions like Prisma.

### Data Flow and Processing

1. **Ingestion**: Trading data is ingested either manually or via CSV uploads.
2. **Validation**: Zod schemas validate the incoming payload against our strict trading definitions.
3. **Storage**: Validated data is persisted in Postgres. Screenshots are hashed and uploaded to Cloudflare R2 using `aws4fetch` to avoid the bloated AWS SDK.
4. **Analysis**: Asynchronous background jobs compute Equity Curves, Maximum Adverse Excursion (MAE), and Maximum Favorable Excursion (MFE).

### Scalability and Future Proofing

To accommodate a growing user base of day traders, we have architected the system to scale horizontally. Turborepo caches our builds, enabling rapid CI/CD pipelines. We use feature flags extensively to decouple deployment from release, allowing us to test features like `stripe_billing_v1` in production with a subset of users before a global rollout.



Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

TradeWitness leverages this concept heavily to ensure high performance and reliability across its distributed microservices architecture. When dealing with high-frequency trading data, milliseconds matter. Our backend services are optimized using Rust and Node.js to provide seamless data ingestion and querying.

### System Architecture Overview

The system is composed of several decoupled layers. At the edge, Cloudflare Workers route traffic and handle preliminary rate-limiting. The application tier is primarily Next.js deployed on Vercel, which interacts with our Supabase Postgres database. Drizzle ORM acts as the bridge, providing type-safe queries without the overhead of heavy abstractions like Prisma.

### Data Flow and Processing

1. **Ingestion**: Trading data is ingested either manually or via CSV uploads.
2. **Validation**: Zod schemas validate the incoming payload against our strict trading definitions.
3. **Storage**: Validated data is persisted in Postgres. Screenshots are hashed and uploaded to Cloudflare R2 using `aws4fetch` to avoid the bloated AWS SDK.
4. **Analysis**: Asynchronous background jobs compute Equity Curves, Maximum Adverse Excursion (MAE), and Maximum Favorable Excursion (MFE).

### Scalability and Future Proofing

To accommodate a growing user base of day traders, we have architected the system to scale horizontally. Turborepo caches our builds, enabling rapid CI/CD pipelines. We use feature flags extensively to decouple deployment from release, allowing us to test features like `stripe_billing_v1` in production with a subset of users before a global rollout.


## Conclusion
This document covers the core aspects of the Incident 001: Outage Report within the TradeWitness ecosystem.
