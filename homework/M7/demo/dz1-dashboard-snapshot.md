# Снапшот данных дашборда (`/private/admin/chat-logs`) — что отдаёт admin-query

Это РОВНО те поля, что видит админ (`AdminChatLogRow` — только redacted + метаданные;
raw message/response в client-payload НЕ попадают). PII замаскирован и в message, и в response.

| # | route | model | sens | cost $ | lat | red.status (u/a) | redacted message | redacted response | PII |
|---|---|---|---|---|---|---|---|---|---|
| 0 | local | qwen2.5:3b-instruct-q5_K_M | private | 0 | 278 | ok/ok | Мене звати <PERSON>, мій email <EMAIL_ADDRESS | Risk/Reward відноситься до риску та навантаження на один пот | PERSON,EMAIL_ADDRESS |
| 1 | cloud | openai/gpt-4o-mini | private | 0.000074 | 217 | ok/ok | поясни простіше | <PERSON>! Я тут, щоб допомогти тобі з питаннями про трейдинг | PERSON |
| 0 | local | qwen2.5:3b-instruct-q5_K_M | private | 0 | 186 | ok/ok | покажи мої останні трейди | I need you to provide your name or log in as yourself to ret | — |
| 1 | cloud | openai/gpt-4o-mini | private | 0.000165 | 442 | ok/ok | що таке risk/reward? | Risk/reward — це співвідношення потенційного ризику до <LOCA | LOCATION,PERSON |
| 2 | local | qwen2.5:3b-instruct-q5_K_M | private | 0 | 179 | ok/ok | доброго ранку | Здравствуйте! Чем я могу вам помочь сегодня? Положите ли вы  | — |
| 0 | local | qwen2.5:3b-instruct-q5_K_M | private | 0 | 182 | ok/ok | привіт, що там по моєму акаунту? | Здравствуйте, Александр! <PERSON> ваш аккаунт в <PERSON>: << | PERSON,EMAIL_ADDRESS |
| 0 | local | qwen2.5:3b-instruct-q5_K_M | private | 0 | 120 | unavailable/unavailable | <REDACTION_UNAVAILABLE> |  | — |

**Проверки:** local = $0.00 · cloud = реальная стоимость · PII замаскирован (`<PERSON>`/`<EMAIL_ADDRESS>`) ·
строка с `redaction unavailable` → текст скрыт `<REDACTION_UNAVAILABLE>` · raw-поля в этот payload не входят.