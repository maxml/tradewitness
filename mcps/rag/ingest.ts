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

const client = new QdrantClient({ url: QDRANT_URL, apiKey: QDRANT_API_KEY });

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
    // bge-m3 via xenova
    const { pipeline } = await import('@xenova/transformers');
    const embedder = await pipeline('feature-extraction', 'Xenova/bge-m3');
    const output = await embedder(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }
}

async function extractHeadings(content: string): Promise<string[]> {
  const headings = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.*)/);
    if (match) {
      headings.push(match[2].trim());
    }
  }
  return headings;
}

async function processDocument(filePath: string, splitter: RecursiveCharacterTextSplitter) {
  const rawContent = await fs.readFile(filePath, 'utf-8');
  const { data, content } = matter(rawContent);
  const relativePath = path.relative(path.resolve(process.cwd(), '../../'), filePath);
  
  const headings = await extractHeadings(content);
  
  const chunks = await splitter.createDocuments([content], [{
    source_file: relativePath,
    type: data.type || 'document',
    tags: data.tags || [],
    last_modified: data.last_modified || new Date().toISOString(),
    parent_headings: headings,
    summary: content.substring(0, 100).replace(/\n/g, ' ') + '...',
    keywords: data.tags || []
  }]);
  
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
    chunkSize: 500,
    chunkOverlap: 100,
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
    const vector = await getEmbedding(chunk.pageContent);
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
