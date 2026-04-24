# Architecture Decisions & Services (WIP)

*Instructions: Write your thoughts or answers next to the "👤 User:" prompts. Save the file and tell me "done" in the chat. I will read it and append my responses next to "🤖 Architect:".*

---

## 1. Database (Relational Data)
*Current State:* App uses Neon (Postgres) via Drizzle. Landing uses Supabase (Postgres) via Supabase Client.
*Options:* Unify everything into Supabase (easier storage integration) OR keep Neon for speed and Supabase for landing.
> **👤 User:**
чим краща drizzle від typeorm? 
і друге питання - накільки це дорого мати тільки supabase і видалити neon? 

> **🤖 Architect:** 
1. **Drizzle vs TypeORM:** TypeORM — це застарілий гігант. Він використовує декоратори (Reflection), які створюють величезні проблеми з Next.js Server Components і часто "ламаються" в Edge-середовищах. Drizzle — це сучасний, супер-легковаговий ORM без декораторів. Він повністю Type-Safe, генерує ідеальний SQL, працює в 10 разів швидше при старті (Cold Starts) і ідеально підходить для Serverless-архітектури. У 2026 році в екосистемі Next.js вибір Drizzle безальтернативний.
2. **Supabase vs Neon:** Видалити Neon і перенести базу в Supabase коштує **$0**. У Supabase є розкішний безкоштовний тариф (Free Tier), який дає 500 МБ бази даних (це мільйони записів про угоди) та 1 ГБ сховища для файлів (Storage). Об'єднавши все в Supabase, ви спрощуєте архітектуру і залишаєтесь у безкоштовному тарифі. **Рішення:** Переносимо все на Supabase.

---

## 2. Authentication (Auth)
*Current State:* App uses Clerk (very fast to build, great UI, but paid at scale).
*Options:* Keep Clerk for MVP speed, or migrate to Supabase Auth/NextAuth for $0 cost forever?
> **👤 User:**
розпиши більше - чому це хороша ідея використати Clerk в проекті? Розпиши його мінуси 
оновив env.local, будь ласка, продивися  

> **🤖 Architect:** 
**Плюси Clerk:** Це абсолютний чемпіон за швидкістю інтеграції. Ви отримуєте готові, красиві React-компоненти для екранів Sign In, Sign Up, Profile Management (зміна пароля, прив'язка Google/Apple), а також готову Next.js Middleware для захисту сторінок. Це економить мінімум 1-2 тижні розробки на старті. Для MVP це ідеально.
**Мінуси Clerk:** 
1. **Vendor Lock-in (Залежність):** Ваші користувачі зберігаються не у вашій базі (Postgres), а на серверах Clerk. Щоб прив'язати їх до ваших угод (Trades), вам доводиться зберігати їхній `clerk_id` у своїй БД як зовнішній ключ.
2. **Ціна при масштабуванні:** Він безкоштовний лише до 10,000 MAU (активних користувачів у місяць). Далі ціни ростуть експоненційно.
**Щодо `.env.local`:** Я перевірив ваші змінні (ключі починаються з `pk_test_` та `sk_test_`). Вони прописані абсолютно правильно! Clerk тепер працюватиме в режимі розробки. **Рішення:** Залишаємо Clerk для швидкого старту.

---

## 3. Object Storage (Screenshots)
*Current State:* Needs a place to store trade screenshots from the desktop app.
*Options:* Supabase Storage (if we choose Supabase), Cloudflare R2 (cheapest, S3 compatible), or AWS S3.
> **👤 User:**
Cloudflare R2, користуємося ним, але треба зрозуміти - в чому перевага paid для цього сервісу. Free достатньо великий. Перевір, будь ласка 

> **🤖 Architect:** 
Free-тариф Cloudflare R2 дійсно величезний: **10 ГБ сховища на місяць, 1 мільйон операцій запису і 10 мільйонів операцій читання безкоштовно**. А головне — у R2 **повністю відсутня плата за вихідний трафік (Egress Fee)**, що робить його вбивцею AWS S3.
**В чому сенс Paid-тарифу R2?** Ви починаєте платити *лише тоді*, коли перевищуєте ці безкоштовні ліміти. І ціни смішні: $0.015 за кожен додатковий ГБ. Для зберігання стиснутих скріншотів (по 100-200 КБ кожен), 10 ГБ вистачить на 50,000-100,000 угод. Тому для MVP та перших тисяч юзерів R2 буде абсолютно безкоштовним. **Рішення:** Cloudflare R2 — ідеальний вибір.

---

## 4. OCR / Screenshot Parsing API
*Current State:* Need to extract Ticker, Price, and Time from images.
*Options:* Local `tesseract.js` in Desktop App (free but heavy/inaccurate) OR Cloud API like GPT-4o-mini Vision / Claude 3.5 Sonnet (costs money per API call, but perfectly parses into JSON).
> **👤 User:**
ми зараз це не будео обговорювати, залиш це для наступних задач. Поки просто заставляємо цей проект працювати 

> **🤖 Architect:** 
Прийнято. Цей пункт виносимо за дужки (Out of Scope) для поточного етапу налаштування інфраструктури. Сфокусуємось виключно на базі даних та бекенді.

---

## 5. AI Trade Reports (LLM)
*Current State:* App currently uses Anthropic (Claude 3.5 Sonnet) for trade analysis.
*Options:* Keep Anthropic, or switch to OpenAI (ChatGPT) if you already have credits/preference there?
> **👤 User:**
це ж будуть API запити, не підписка, праивльно? У мене зараз нема бюджету на API запити, як можна можливстями підписки робити аналіз?  

> **🤖 Architect:** 
Так, ви абсолютно праві: щоб ваш код (додаток) міг автоматично відправляти дані до ШІ і отримувати відповідь, **необхідно використовувати API**, яке тарифікується за кожен токен (копійки, але це не безкоштовно). Звичайна підписка ChatGPT Plus ($20/міс) дає доступ лише до веб-інтерфейсу (браузера), а не до API.
**Як використовувати безкоштовну підписку в додатку (Workaround):**
Якщо немає бюджету на API, ми можемо змінити флоу: замість автоматичного аналізу в додатку, ми генеруємо для користувача красивий блок тексту (промпт + масив його угод у форматі CSV/JSON) з кнопкою *"Скопіювати дані"*. Юзер натискає її, відкриває свій власний ChatGPT у браузері, вставляє текст і ШІ робить йому аналіз безкоштовно. Це називається "Bring Your Own AI". **Рішення:** На етапі MVP вирізаємо виклики платного API Anthropic і замінюємо їх на генерацію промптів для ручного копіювання.
