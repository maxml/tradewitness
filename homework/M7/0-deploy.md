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

## ФАКТ (заполнить после прогона)

- Путь: **A — Ollama локально**
- Модель + **фактический тег**: `__________`
- Квант: `__________`
- Endpoint: `http://localhost:11434/v1`
- tokens/sec **до** тюнинга: `____` · **после**: `____`
- `ollama ps` PROCESSOR: `____% GPU`
- Presidio: endpoint `http://localhost:5002`, health: `____`
- Лог рабочего вызова (с tool-call) — вставить ниже:

```
<сюда лог curl/скрин>
```
