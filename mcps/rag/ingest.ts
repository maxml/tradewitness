import { QdrantClient } from '@qdrant/js-client-rest';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { glob } from 'glob';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env.local' });
dotenv.config({ path: '../../.env' }); // Fallback

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'tradewitness_m3_docs';
const EMBEDDING_PROVIDER = process.env.EMBEDDING_PROVIDER || 'bge-m3';
const VECTOR_SIZE = EMBEDDING_PROVIDER === 'openai' ? 1536 : 1024;
const CORPUS_DIR = path.resolve(process.cwd(), '../../docs/m3-corpus');
const CHUNKS_FILE = path.join(process.cwd(), 'chunks.jsonl');
const CHUNK_SIZE = 1800;
const CHUNK_OVERLAP = 200;

const client = new QdrantClient({ url: QDRANT_URL, apiKey: QDRANT_API_KEY });

let bgeEmbedderPromise: Promise<any> | undefined;

async function getBgeEmbedder() {
  if (!bgeEmbedderPromise) {
    const { pipeline } = await import('@xenova/transformers');
    bgeEmbedderPromise = pipeline('feature-extraction', 'Xenova/bge-m3');
  }
  return bgeEmbedderPromise;
}

async function getEmbedding(text: string): Promise<number[]> {
  if (EMBEDDING_PROVIDER === 'openai') {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  } else {
    const embedder = await getBgeEmbedder();
    const output = await embedder(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }
}

type HeadingAnchor = { offset: number; path: string[] };

/**
 * Індекс "зміщення в документі -> ІЄРАРХІЧНИЙ шлях заголовків".
 *
 * Було: extractHeadings() збирав УСІ заголовки файлу в плаский масив, і той самий масив
 * чіплявся до кожного чанка. Чанк із 5-ї секції ніс усі 12 заголовків документа, зокрема
 * ті, до яких не має стосунку — тобто замість своєї адреси отримував усю мапу.
 */
function buildHeadingIndex(content: string): HeadingAnchor[] {
  const anchors: HeadingAnchor[] = [];
  const stack: { level: number; text: string }[] = [];
  const re = /^(#{1,6})\s+(.*)$/gm;
  let m: RegExpExecArray | null;

  while ((m = re.exec(content)) !== null) {
    const level = m[1].length;
    // Заголовок того ж або вищого рівня закриває попередні гілки.
    while (stack.length > 0 && stack[stack.length - 1].level >= level) stack.pop();
    stack.push({ level, text: m[2].trim() });
    anchors.push({ offset: m.index, path: stack.map((s) => s.text) });
  }
  return anchors;
}

/** Шлях заголовків, у межах якого лежить це зміщення. */
function headingPathAt(anchors: HeadingAnchor[], offset: number): string[] {
  let path: string[] = [];
  for (const anchor of anchors) {
    if (anchor.offset > offset) break;
    path = anchor.path;
  }
  return path;
}

/** Перше речення ЦЬОГО чанка — а не перші 100 символів файлу. */
function firstSentence(text: string, max = 160): string {
  const clean = text.replace(/^#{1,6}\s+.*$/gm, '').replace(/\s+/g, ' ').trim();
  const end = clean.search(/[.!?]\s/);
  const sentence = end === -1 ? clean : clean.slice(0, end + 1);
  return sentence.length > max ? `${sentence.slice(0, max)}…` : sentence;
}

async function processDocument(filePath: string, splitter: RecursiveCharacterTextSplitter) {
  const rawContent = await fs.readFile(filePath, 'utf-8');
  const { data, content } = matter(rawContent);
  const relativePath = path.relative(path.resolve(process.cwd(), '../../'), filePath);

  const anchors = buildHeadingIndex(content);

  const chunks = await splitter.createDocuments([content], [{
    source_file: relativePath,
    type: data.type || 'document',
    tags: data.tags || [],
    last_modified: data.last_modified || new Date().toISOString(),
    keywords: data.tags || []
  }]);

  // Метадані ПОЧАНКОВО. Ідемо по документу курсором, бо чанки йдуть послідовно
  // й перекриваються — шукаємо трохи позаду поточної позиції.
  let cursor = 0;
  for (const chunk of chunks) {
    const found = content.indexOf(chunk.pageContent, Math.max(0, cursor - CHUNK_OVERLAP - 50));
    const offset = found === -1 ? cursor : found;
    cursor = offset + chunk.pageContent.length;

    const headingPath = headingPathAt(anchors, offset);
    chunk.metadata.parent_headings = headingPath;
    chunk.metadata.summary = firstSentence(chunk.pageContent);
    // Рядок, який поїде В ЕМБЕДИНГ разом із текстом (contextual retrieval).
    chunk.metadata.context = headingPath.length > 0
      ? `Документ: ${relativePath}. Розділ: ${headingPath.join(' > ')}.`
      : `Документ: ${relativePath}.`;
  }

  return chunks;
}

async function main() {
  console.log(`Starting ingestion pipeline using ${EMBEDDING_PROVIDER} provider...`);
  
  try {
    await client.deleteCollection(COLLECTION_NAME);
    console.log(`Deleted collection ${COLLECTION_NAME}`);
  } catch (e) {
    console.log(`Collection ${COLLECTION_NAME} might not exist. Proceeding...`);
  }

  await client.createCollection(COLLECTION_NAME, {
    vectors: { size: VECTOR_SIZE, distance: 'Cosine' }
  });
  console.log(`Created collection ${COLLECTION_NAME} with vector size ${VECTOR_SIZE}`);

  const files = await glob('**/*.md', { cwd: CORPUS_DIR, absolute: true });
  console.log(`Found ${files.length} markdown files in corpus.`);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    separators: ["\n## ", "\n### ", "\n#### ", "\n", " ", ""]
  });

  const allChunks = [];
  for (const file of files) {
    const docChunks = await processDocument(file, splitter);
    allChunks.push(...docChunks);
  }

  console.log(`Created ${allChunks.length} chunks. Generating embeddings...`);
  
  // Clear chunks file
  await fs.writeFile(CHUNKS_FILE, '');

  const points = [];
  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i];

    // ── CONTEXTUAL RETRIEVAL ──────────────────────────────────────────────
    // Контекст приклеюється до тексту ПЕРЕД ембедингом.
    //
    // Було: getEmbedding(chunk.pageContent) — самий лише текст чанка.
    // parent_headings і summary лежали в payload Qdrant, але ембединг їх не
    // бачив, тож векторний пошук ними НЕ користувався взагалі: вони впливали
    // лише на те, що друкує query.ts. Тобто вся робота з метаданими не давала
    // жодного приросту якості пошуку.
    //
    // Тепер чанк «виручка зросла на 3%» стає:
    //   "Документ: docs/....md. Розділ: Billing > Revenue.\n\nвиручка зросла..."
    // і знаходиться за запитом про Billing, навіть якщо слова "Billing" у
    // самому тексті чанка немає.
    //
    // Це спрощена (детермінована) версія техніки Anthropic: у повній версії
    // контекст на кожен чанк генерує LLM. Заголовки дають більшу частину
    // ефекту безкоштовно. https://www.anthropic.com/engineering/contextual-retrieval
    const textToEmbed = `${chunk.metadata.context}\n\n${chunk.pageContent}`;
    const vector = await getEmbedding(textToEmbed);
    const id = uuidv4();
    
    const record = {
      id,
      vector,
      payload: {
        ...chunk.metadata,
        content: chunk.pageContent
      }
    };
    points.push(record);
    
    // Write to chunks.jsonl
    await fs.appendFile(CHUNKS_FILE, JSON.stringify({
      chunk_id: id,
      source_file: chunk.metadata.source_file,
      type: chunk.metadata.type,
      parent_headings: chunk.metadata.parent_headings,
      keywords: chunk.metadata.keywords,
      summary: chunk.metadata.summary,
      context: chunk.metadata.context,
      content: chunk.pageContent
    }) + '\n');
    
    if (i % 10 === 0) console.log(`Processed ${i}/${allChunks.length} chunks...`);
  }

  // Batch upsert to avoid payload limits
  const batchSize = 100;
  for (let i = 0; i < points.length; i += batchSize) {
    const batch = points.slice(i, i + batchSize);
    await client.upsert(COLLECTION_NAME, { points: batch });
    console.log(`Upserted batch ${i / batchSize + 1} of Math.ceil(${points.length} / ${batchSize})`);
  }

  console.log('Ingestion complete!');
}

main().catch(console.error);
