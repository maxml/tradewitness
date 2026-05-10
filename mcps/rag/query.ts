import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env.local' });
dotenv.config({ path: '../../.env' }); // Fallback

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'tradewitness_m3_docs';
const EMBEDDING_PROVIDER = process.env.EMBEDDING_PROVIDER || 'bge-m3';

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

async function search(query: string, limit: number = 3) {
  console.log(`\n--- Query: "${query}" ---`);
  const vector = await getEmbedding(query);
  console.log('Embedding generated. Searching Qdrant...');
  
  const results = await client.search(COLLECTION_NAME, {
    vector,
    limit,
    with_payload: true
  });

  results.forEach((result, idx) => {
    const p = result.payload as any;
    console.log(`\nResult ${idx + 1} (Score: ${result.score.toFixed(4)})`);
    console.log(`Source: ${p.source_file}`);
    console.log(`Type: ${p.type}`);
    console.log(`Summary: ${p.summary}`);
    console.log(`Headings: ${p.parent_headings?.join(' > ')}`);
  });
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    const query = args.join(' ');
    await search(query, 5);
  } else {
    console.log("Running mandatory test queries...");
    await search("What database does TradeWitness use and why was it chosen?", 3);
    await search("Which TradeWitness features depend on stripe_billing_v1?", 3);
    await search("What happened in the latest incident involving screenshot upload?", 3);
  }
}

main().catch(console.error);
