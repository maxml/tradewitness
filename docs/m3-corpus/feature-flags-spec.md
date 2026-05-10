---
type: "specification"
tags: ["feature-flags", "architecture", "dependencies"]
last_modified: "2026-05-10"
---

# Feature Flags Specification

This document outlines the 25 feature flags used in TradeWitness to manage rollouts, test new functionality, and provide kill-switches for critical infrastructure.

## Dependency Graph

Feature flags in TradeWitness are highly interdependent. The following dependency graph must be strictly respected when changing state (e.g. from Disabled to Testing or Enabled). A feature cannot be moved to Testing or Enabled if any of its dependencies are currently Disabled.

1. `tokens_purchase_v1` depends on `stripe_billing_v1`.
2. `stripe_webhooks_v1` depends on `stripe_billing_v1`.
3. `stripe_billing_v1` depends on `auth_clerk_v1`.
4. `search_v2` depends on `trade_journal_core_v1`.
5. `mentor_public_profile_v1` depends on `trade_journal_core_v1`.
6. `discipline_score_v1` depends on `trade_journal_core_v1`.
7. `desktop_collector_v1` depends on `screenshots_r2_upload_v1`.
8. `screenshots_r2_upload_v1` depends on `r2_storage_v1` AND `trade_journal_core_v1`.
9. `ai_report_prompt_v1` depends on `trade_journal_core_v1`.
10. `ai_report_followup_v1` depends on `ai_report_prompt_v1`.
11. `custom_trade_fields_v1` depends on `trade_journal_core_v1`.
12. `calendar_analytics_v1` depends on `trade_journal_core_v1`.
13. `history_filters_v1` depends on `trade_journal_core_v1`.
14. `statistics_summary_v1` depends on `trade_journal_core_v1`.
15. `admin_feature_dashboard_v1` depends on `feature_flags_api_v1`.

For all other flags (`supabase_runtime_v1`, `strategies_v1`, `landing_blog_v1`, `landing_i18n_v1`, `landing_pricing_v1`, `rag_docs_index_v1`, `crypto_pairs_support`, `options_trading_support`, `user_avatars`, `two_factor_auth`, `social_login_google`, `social_login_github`, `webhook_integration`, `api_access_v1`, `custom_chart_indicators`, `community_forum`, `live_chat_support`, `trade_replay_v1`, `bulk_import_csv`, `email_notifications`, `sms_notifications`, `affiliate_program`), there are no strict dependencies.

## M3 Feature Flag Hooks

- **`ai_report_prompt_v1`**: Enables the BYOAI prompt generation flow (Task 4).
- **`ai_report_followup_v1`**: Controls the follow-up prompt/chat affordance (Task 4).
- **`landing_blog_v1`**: Public content/blog surface (Task 6).
- **`landing_i18n_v1`**: Localized landing copy (Task 6).
- **`landing_pricing_v1`**: Pricing page visibility (Task 6).
- **`stripe_billing_v1`**: Real paid billing behind the pricing CTA (Task 6).
- **`screenshots_r2_upload_v1`**: Backend screenshot upload path (Task 7).
- **`desktop_collector_v1`**: Desktop capture client rollout (Task 7).
- **`mentor_public_profile_v1`**: Public mentor profile route (Task 8).
- **`discipline_score_v1`**: Score calculation and display (Task 8).

## Contracts and Usage

You MUST use the `feature-flags` MCP server to interact with these flags. Direct edits to `features.json` are prohibited. 
When enabling `stripe_billing_v1`, ensure `auth_clerk_v1` is not Disabled.
When enabling `mentor_public_profile_v1`, ensure `trade_journal_core_v1` is not Disabled.
