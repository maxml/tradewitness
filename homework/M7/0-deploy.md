# Часть 0 — деплой локальной модели + Presidio (runbook + заметка о сдаче)

> Заполни разделы «ФАКТ» после прогона (тег модели, tokens/sec до/после, лог вызова).

## Железо (определено автоматически)

- CPU: Intel **i7-8750H**, 6 ядер / 12 потоков (AVX2)
- RAM: **31 GB**
- GPU: **NVIDIA GTX 1050 Ti, 4 GB VRAM** (дисплей — на Intel UHD 630, вся VRAM свободна под compute)

**Корень прошлых тормозов:** 8B-модель (~6.6 GB) не влезает в 4 GB → partial offload на CPU.
**Лечение:** 3B-модель, целиком в VRAM, + тюнинг офлоада/кэша (ниже).

## 1. Ollama — тюнинг ENV (systemd)

```bash
sudo systemctl edit ollama
```
В секции `[Service]`:
```
Environment="OLLAMA_FLASH_ATTENTION=1"
Environment="OLLAMA_KV_CACHE_TYPE=q8_0"
Environment="OLLAMA_KEEP_ALIVE=30m"
Environment="OLLAMA_NUM_PARALLEL=1"
```
```bash
sudo systemctl daemon-reload && sudo systemctl restart ollama
```
(Если Ollama запускается вручную — экспортируй те же переменные перед `ollama serve`.)

## 2. Pull модели — ПРОВЕРИТЬ тег

```bash
ollama pull qwen2.5:3b-instruct-q5_K_M      # кандидат; если тега нет — подобрать существующий
ollama list
```
> ⚠️ Если тег не тянется — взять ближайший (`ollama show`, registry) и записать ФАКТ ниже.

**Параметры на инференс** (маленький контекст, физ. ядра) — через Modelfile или per-request:
`num_ctx 4096`, `num_thread 6`. Проверить, что всё на GPU:
```bash
ollama ps      # PROCESSOR должен быть 100% GPU
```

## 3. Проверка вызова (OpenAI-совместимый endpoint + tool-call)

```bash
curl -s http://localhost:11434/v1/chat/completions -H 'Content-Type: application/json' -d '{
  "model": "qwen2.5:3b-instruct-q5_K_M",
  "messages": [{"role":"user","content":"Привет! Назови себя одним предложением."}],
  "stream": false
}' | jq -r '.choices[0].message.content'
```
Замер скорости: `ollama run <model> --verbose` → смотреть `eval rate` (tokens/sec).

## 4. Presidio (PII-детект) в Docker

```bash
docker compose up -d presidio-analyzer       # из корня репозитория
curl -s localhost:5002/health                # ожидаем ok
# тест детекта:
curl -s localhost:5002/analyze -H 'Content-Type: application/json' \
  -d '{"text":"My email is john@example.com","language":"en"}' | jq
```

---

## ФАКТ (прогон 2026-06-08)

- Путь: **A — Ollama локально**, версия **0.30.6**
- Модель + **фактический тег**: `qwen2.5:3b-instruct-q5_K_M` (ID `19cf317bd479`, размер на диске 2.2 GB, в VRAM 2.4 GB) — кандидат из плана подтверждён, тег существует в registry.
- Квант: **q5_K_M** (явно, не дефолтный Q4)
- Endpoint: **`http://localhost:11435/v1`** ⚠️ **не 11434** — см. «Сетевой подвох» ниже.
- ENV-тюнинг (§0.1) применён: `OLLAMA_FLASH_ATTENTION=1`, `OLLAMA_KV_CACHE_TYPE=q8_0`, `OLLAMA_KEEP_ALIVE=30m`, `OLLAMA_NUM_PARALLEL=1`; per-request `num_ctx=4096`, `num_thread=6`.
- tokens/sec (тюнинг включён): **prompt_eval ≈ 74 tok/s**, **генерация ≈ 15.4 tok/s** (3B на GTX 1050 Ti — десятки tok/s, как и целились). Отдельный «до тюнинга» замер не делали — модель сразу поднята в тюненом профиле.
- `ollama ps` PROCESSOR: **100% GPU** (context 4096, KEEP_ALIVE 30m) — модель целиком в 4 GB VRAM, partial offload отсутствует.
- Presidio: endpoint `http://localhost:5002` — **поднимается отдельно** (Docker, нужен sudo); статус health: `TODO` (закрывается на шаге demo).

### Сетевой подвох (важно для воспроизведения)

Дефолтный **systemd-сервис `ollama` (порт 11434) не смог тянуть модель**: `ollama pull` стабильно падал на стадии `pulling manifest` с `Error: EOF`, хотя `curl` к тому же registry с этой машины возвращал `HTTP 200`. Диагностика:
1. IPv6 на этой сети битый (`curl -6` к registry → мгновенный отказ `000`); отключили: `sudo sysctl -w net.ipv6.conf.all.disable_ipv6=1` — не помогло.
2. Юнит `ollama.service` без sandbox-ограничений (нет `RestrictAddressFamilies`/`PrivateNetwork`), но процесс **от пользователя `ollama`** всё равно получал EOF к Cloudflare-хосту registry.
3. **Обход:** поднят отдельный `ollama serve` **от пользователя `dell`** (сетевой контекст которого рабочий — там же, где `curl`) на порту **11435** со своим `OLLAMA_MODELS=/home/dell/.ollama-m7/models` и тем же ENV-тюнингом → `pull` прошёл, модель скачалась, tool-calling и 100% GPU работают.

> ⚠️ Для приложения: `OLLAMA_BASE_URL=http://localhost:11435/v1` (рабочий dell-сервер). Гард `assertLocalOllamaUrl` (host=localhost) проходит. Для постоянства dell-сервер стоит оформить как user-systemd-юнит либо починить сетевой контекст системного сервиса и перетянуть модель в его стор.

### Лог рабочего вызова с tool-call (OpenAI-совместимый `/v1`, приёмка Части 0)

Запрос: `tools=[get_my_trades]`, system «…you MUST call get_my_trades», user «Show my last 3 trades.»

```
$ curl -s http://localhost:11435/v1/chat/completions -d '{... tools:[get_my_trades] ...}'
tool_calls: [{"id":"call_qphtd1ig","index":0,"type":"function",
              "function":{"name":"get_my_trades","arguments":"{\"limit\":3}"}}]
finish_reason: tool_calls
```

Заметка: через OpenAI-адаптер `/v1` 3B-модель зовёт тул **надёжно только при жёстком system-промпте + `required`-параметре**; со слабым промптом (особенно на украинском) возвращала пустой ответ без tool_call. Нативный `/api/chat` устойчивее. Вывод для реализации: local-ветке нужен директивный system-промпт «когда спрашивают про данные — ОБЯЗАН вызвать тул».
