# DZ1 demo — таблица маршрутизации (прогон 2026-06-08)

Реальный прогон: `route()` + Presidio (`/analyze`) + OpenRouter cloud-нога (`openai/gpt-4o-mini`).

- **Утечек private→cloud: 0** ✅ (главный критерий приёмки)
- **Cloud-нога работает:** ✅ (реальных cloud-вызовов: 2)
- **Fail-safe over-local:** 1 (публичные uk-запросы, ложно помеченные PERSON из-за EN-Presidio на кириллице — риск §8; уходят в local = без утечки)

| # | запрос | маршрут | ожид. | verdict | reason | PII | model | cost $ |
|---|---|---|---|---|---|---|---|---|
| pii-email | Скинь звіт на пошту john@example.com | **local** | local | ok ✅ | pii-in-message: LOCATION, EMAIL_ADDRESS | LOCATION,EMAIL_ADDRESS | qwen2.5:3b-instruct-q5_K_M | 0 |
| pii-phone | Телефон для зв'язку +380671234567 | **local** | local | ok ✅ | pii-in-message: PERSON, PHONE_NUMBER | PERSON,PHONE_NUMBER | qwen2.5:3b-instruct-q5_K_M | 0 |
| pii-card | Оплата карткою 4111 1111 1111 1111 | **local** | local | ok ✅ | pii-in-message: CREDIT_CARD | CREDIT_CARD | qwen2.5:3b-instruct-q5_K_M | 0 |
| pii-name-en | My name is John Smith, hello | **local** | local | ok ✅ | pii-in-message: PERSON | PERSON | qwen2.5:3b-instruct-q5_K_M | 0 |
| pii-name-uk | Мене звати Олександр Ковальчук | **local** | local | ok ✅ | pii-in-message: PERSON | PERSON | qwen2.5:3b-instruct-q5_K_M | 0 |
| data-trades | покажи мої останні трейди | **local** | local | ok ✅ | requires user-owned data | — | qwen2.5:3b-instruct-q5_K_M | 0 |
| data-capital | скільки в мене капіталу? | **local** | local | ok ✅ | pii-in-message: PERSON | PERSON | qwen2.5:3b-instruct-q5_K_M | 0 |
| pub-rr-uk | що таке risk/reward? | **cloud** | cloud | ok ✅ | public-intent allowlist | — | openai/gpt-4o-mini | 0.000128 |
| pub-rr-en | what is risk/reward in trading? | **cloud** | cloud | ok ✅ | public-intent allowlist | — | openai/gpt-4o-mini | 0.00012 |
| pub-stop-uk | поясни, що таке стоп-лосс | **local** | cloud | safe (over-local) | pii-in-message: PERSON | PERSON | qwen2.5:3b-instruct-q5_K_M | 0 |
| order-winrate | поясни мій win rate | **local** | local | ok ✅ | requires user-owned data | — | qwen2.5:3b-instruct-q5_K_M | 0 |
| ambiguous | доброго ранку | **local** | local | ok ✅ | ambiguous (default local) | — | qwen2.5:3b-instruct-q5_K_M | 0 |

## Safety-кейсы
- **Presidio down/fallback → local** (reason: pii-detector-unavailable (fail-closed)) — никогда не cloud. ✅
- **Порядок (user-data > public):** "поясни мій win rate" → local ✅

## История НЕ течёт в cloud (правило §2.2)
Ход0 = private (PII → local), Ход1 = public follow-up. Cloud-контекст для Ход1 (фильтр `loadHistory(publicOnly:true)`, persistence.ts:67-76) содержит ТОЛЬКО публичные/redacted ходы — приватный Ход0 отсутствует:
```json
[
  {
    "role": "user",
    "content": "що таке risk/reward?"
  },
  {
    "role": "assistant",
    "content": "Risk/reward — це співвідношення..."
  }
]
```
→ приватный ход0 в cloud-контекст НЕ попал ✅ (2 сообщения, оба из public-хода).

## Стоимость / экономия
- cloud-вызовов (реальных): **2**, суммарная реальная стоимость: **$0.000248**
- local-запросов: **10**, стоимость: **$0.00**
- гипотетическая cloud-цена local-запросов (= сэкономлено, оценка по gpt-4o-mini, ~250 tok out): **~$0.001691**
