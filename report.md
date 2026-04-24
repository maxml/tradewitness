# M2 — Report

## IDE
- Primary: **Gemini CLI** (Rules generated in `GEMINI.md`).
- Secondary: None.

## Rules diff (what was added manually)
- **Turborepo cache rule:** Added a strict instruction to always whitelist new environment variables in `turbo.json`'s `globalEnv`, otherwise Next.js builds get permanently stuck with stale cache.
- **Tailwind segregation rule:** Explicitly told the AI NOT to attempt merging Tailwind configs across the monorepo due to the v3/v4 breaking changes between the two cloned applications.
- **Drizzle migration rule:** Added a rule forbidding the use of `db:push` to prevent state drift, enforcing `db:migrate` instead.

## 3 Questions
- **How long would this take manually?** Roughly 6-8 hours just to analyze the codebases, write the ADRs, craft the Mermaid diagram, find IDOR vulnerabilities, and write the extensive local setup guides. With Gemini CLI, it was orchestrated effectively.
- **The most magic IDE feature:** The ability of the CLI to recursively read nested `package.json` files and dependencies to correctly map out the Monorepo structure, and generating the complex C4 Mermaid diagram based on recent architectural decisions.
- **Where AI broke things and how it was fixed:** Initially, the plan suggested using `@aws-sdk/client-s3` for Cloudflare R2, which bloated the serverless function. We corrected this by forcing the AI to use native `fetch` + `aws4fetch`. When writing the fetch implementation, the AI initially passed a raw `Blob/File` body to the AWS signer, which crashed because the signer requires an `ArrayBuffer` to hash the payload. I pointed it out, and the AI correctly rewrote the implementation.