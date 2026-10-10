import { pipeline } from '@xenova/transformers';

let extractor = null;
const documentStore = [];

export async function initRAG() {
  if (!extractor) {
    console.log("Loading Xenova embedding model for RAG...");
    // We use a small, lightweight model for fast embeddings
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true,
    });
    console.log("Embedding model loaded successfully.");
  }
}

export async function indexFiles(files) {
  try {
    await initRAG();
    
    // Clear previous index to keep it bound to the current workspace
    documentStore.length = 0;
    
    let totalChunks = 0;
    
    for (const file of files) {
      if (!file.content) continue;
      
      // Simple chunking: split by double newlines or max length
      const chunks = chunkText(file.content, 1000, 200);
      
      for (const chunk of chunks) {
        if (!chunk.trim()) continue;
        const output = await extractor(chunk, { pooling: 'mean', normalize: true });
        const embedding = Array.from(output.data);
        
        documentStore.push({
          fileName: file.name,
          content: chunk,
          embedding
        });
        totalChunks++;
      }
    }
    
    console.log(`Indexed ${files.length} files into ${totalChunks} chunks.`);
    return { success: true, chunks: totalChunks };
  } catch (err) {
    console.error("Failed to index files:", err);
    return { success: false, error: err.message };
  }
}

function chunkText(text, maxLen = 1000, overlap = 200) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.substring(i, i + maxLen));
    i += (maxLen - overlap);
  }
  return chunks;
}

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function searchRAG(query, topK = 5) {
  if (documentStore.length === 0) return [];
  await initRAG();

  try {
    const queryOutput = await extractor(query, { pooling: 'mean', normalize: true });
    const queryEmbedding = Array.from(queryOutput.data);

    const scoredDocs = documentStore.map(doc => ({
      ...doc,
      score: cosineSimilarity(queryEmbedding, doc.embedding)
    }));

    scoredDocs.sort((a, b) => b.score - a.score);
    return scoredDocs.slice(0, topK);
  } catch (err) {
    console.error("RAG search failed:", err);
    return [];
  }
}
