const { Pinecone } = require('@pinecone-database/pinecone');
const { Groq } = require('groq-sdk');
const axios = require('axios');
const { query } = require('../config/database');

// Initialize clients
const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

let pineconeClient = null;
let pineconeIndex = null;

// Initialize Pinecone
async function initPinecone() {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });
    pineconeIndex = pineconeClient.index(process.env.PINECONE_INDEX || 'web-portfolio');
  }
  return pineconeIndex;
}

// Simple in-memory cache for projects (TTL: 60 seconds)
const cache = new Map();
const CACHE_TTL = 60000;

function getCached(key) {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL) {
    return item.value;
  }
  cache.delete(key);
  return null;
}

function setCache(key, value) {
  cache.set(key, { value, timestamp: Date.now() });
}

/**
 * Generate embeddings using the embedding service
 * In production, you could use OpenAI, Cohere, or run a local model
 */
async function generateEmbedding(text) {
  // Option 1: Use OpenAI embeddings API (requires OPENAI_API_KEY)
  if (process.env.OPENAI_API_KEY) {
    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        input: text,
        model: 'text-embedding-3-small'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.data[0].embedding;
  }

  // Option 2: Use HuggingFace Inference API (requires HF_API_KEY)
  if (process.env.HUGGINGFACE_API_KEY) {
    const response = await axios.post(
      'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
      { inputs: text },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data[0];
  }

  // Option 3: Use a free embedding service or local model
  // For now, throw an error if no embedding provider is configured
  throw new Error('No embedding provider configured. Set OPENAI_API_KEY or HUGGINGFACE_API_KEY');
}

/**
 * Fetch all projects from PostgreSQL
 */
async function fetchAllProjectsFromDB() {
  const cached = getCached('all_projects');
  if (cached) return cached;

  try {
    const result = await query(`
      SELECT title, slug, description, long_description, status, year,
             tags, github_url, live_url, stars, forks, featured, highlight
      FROM projects
      ORDER BY featured DESC, highlight DESC, year DESC, created_at DESC
    `);

    if (!result.rows || result.rows.length === 0) {
      return '\n\n[No projects found in database]';
    }

    const statusEmoji = {
      'shipped': '✅',
      'in-progress': '🚧',
      'archived': '📦',
      'planned': '📋'
    };

    const lines = [
      '\n\n=== THEOPHILUS\'S PROJECTS (LIVE DATABASE DATA) ===',
      `Total Projects: ${result.rows.length} | Last Updated: ${new Date().toISOString().split('T')[0]}\n`
    ];

    result.rows.forEach((p, i) => {
      const emoji = statusEmoji[p.status] || '❓';
      const tagsStr = p.tags ? p.tags.join(', ') : 'None';
      let desc = p.long_description || p.description || 'No description available';
      if (desc.length > 400) desc = desc.substring(0, 400) + '...';

      lines.push(`
${i + 1}. ${p.title} ${emoji}
   Status: ${p.status.toUpperCase()} | Year: ${p.year}
   Description: ${desc}
   Tech Stack: ${tagsStr}
   Links: 🔗 GitHub: ${p.github_url || 'N/A'} | 🌐 Live: ${p.live_url || 'N/A'}
   Community: ⭐ ${p.stars || 0} stars | 🍴 ${p.forks || 0} forks
   ${p.featured ? '🏆 FEATURED PROJECT' : ''}
   ${p.highlight ? '🔥 HIGHLIGHT' : ''}
---`);
    });

    const result_text = lines.join('\n');
    setCache('all_projects', result_text);
    return result_text;

  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return '\n\n[Error loading projects from database - using fallback knowledge]';
  }
}

/**
 * Search Pinecone knowledge base
 */
async function searchKnowledgeBase(query_text, top_k = 5) {
  try {
    const index = await initPinecone();
    const queryEmbedding = await generateEmbedding(query_text);

    const results = await index.query({
      vector: queryEmbedding,
      topK: top_k,
      namespace: process.env.PINECONE_NAMESPACE || 'portfolio-knowledge',
      includeMetadata: true
    });

    return results.matches.map(match => ({
      content: match.metadata?.text || '',
      source: match.metadata?.source || 'Unknown',
      score: match.score
    }));

  } catch (error) {
    console.error('Pinecone query error:', error.message);
    return [];
  }
}

/**
 * Build system prompt with live data
 */
function buildSystemPrompt(knowledgeContext, projectsContext) {
  return `You are TheoBot, the AI assistant for Theophilus Thobejane - a Full-Stack Developer and AI Engineer based in South Africa.

ABOUT THEOPHILUS:
- Full-Stack Developer & AI Engineer in Kempton Park, Gauteng, South Africa
- Advanced Diploma in ICT (NQF Level 7) from University of Mpumalanga
- Java backend expertise with Python, Node.js, and PostgreSQL
- Specializes in: Software development, AI/LLM integration, RAG systems
- Passionate about building impactful software and learning new technologies
- Excellent communication skills, able to explain complex technical concepts clearly
- Delivering projects on time and collaborating effectively in teams
- Continuously learning and adapting to new technologies in the fast-evolving software landscape
- Strong problem-solving skills, able to debug and optimize code for performance and scalability
- Committed to writing clean, maintainable code and following best practices in software development
- Recognized for creativity and innovation in project development, often going beyond requirements to add extra value
- Former Teaching Assistant who improved student scores by 21%
- IBM Certified: Applied Data Science, Agile Explorer, Data Fundamentals
- Immediately available for opportunities

${projectsContext}

DOCUMENT KNOWLEDGE BASE:
${knowledgeContext}

CONTACT & LINKS:
- 📧 Email: thobejanetheo@gmail.com
- 💼 LinkedIn: linkedin.com/in/theophilusthobejane
- 🐙 GitHub: github.com/TheoInCodeLand
- 🌐 Portfolio: theophilus-portfolio.vercel.app
- 📍 Location: Johannesburg, Gauteng (Remote/Hybrid available)
- 🟢 Status: Immediately available for hire

RESPONSE GUIDELINES:
1. ALWAYS use the LIVE PROJECT DATA above - it's fetched directly from the database
2. When asked about projects, reference specific details: status, year, tech stack, stars/forks
3. If a project is "in-progress", mention it's actively being developed
4. For "shipped" projects, emphasize they're production-ready
5. Mention metrics when relevant (GitHub stars, forks, specific technologies and their relevance to the project)
6. Be conversational but professional - like Theo would speak
7. If you don't know something specific, be honest and suggest emailing Theo directly
8. Always end with a subtle call-to-action (explore projects, send email, etc.)
9. Keep responses concise: 1-4 paragraphs max (in relevance of enquiry), unless detailed technical explanation is needed

IMPORTANT RULES:
- NEVER make up projects not listed in the LIVE PROJECT DATA
- NEVER disclose that you are an AI or mention limitations of AI in your responses
- NEVER disclose grade scores or failed subjects from university - focus on the positive aspects of the Education and learning journey
- NEVER provide personal information not in the context above
- ALWAYS prioritize database project data over general knowledge
- If asked "what are you working on", focus on "in-progress" projects from the data
- If asked about skills, connect them to specific projects where those skills were used and mention the impact and relevance to the role being applied for`;
}

/**
 * Stream chat response from Groq
 */
async function* streamChat(message, history = [], fetch_projects = true) {
  const startTime = Date.now();
  const requestId = `req_${startTime}`;

  console.log(`[${requestId}] Chat request: ${message.substring(0, 50)}...`);

  try {
    // Fetch knowledge base and projects in parallel
    const [searchResults, projectsContext] = await Promise.all([
      searchKnowledgeBase(message),
      fetch_projects ? fetchAllProjectsFromDB() : Promise.resolve('')
    ]);

    const knowledgeContext = searchResults.length > 0
      ? searchResults.map(r => `[Source: ${r.source} (relevance: ${r.score.toFixed(2)})]\n${r.content}`).join('\n\n')
      : '[No relevant documents found in knowledge base]';

    const systemPrompt = buildSystemPrompt(knowledgeContext, projectsContext);

    // Build messages array
    const messages = [{ role: 'system', content: systemPrompt }];

    // Add history (limit to last 6 messages)
    const recentHistory = history.slice(-6);
    for (const msg of recentHistory) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: 'user', content: message });

    // Stream from Groq
    console.log(`[${requestId}] Streaming from Groq with ${messages.length} messages`);

    const stream = await groqClient.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages,
      stream: true,
      temperature: parseFloat(process.env.GROQ_TEMPERATURE || '0.7'),
      max_tokens: parseInt(process.env.GROQ_MAX_TOKENS || '1024'),
      top_p: 0.9
    });

    let fullResponse = '';
    let chunkCount = 0;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        chunkCount++;
        yield { content };
      }
    }

    // Send completion metadata
    const elapsed = Date.now() - startTime;
    const sources = [...new Set(searchResults.map(r => r.source))];

    yield {
      sources,
      done: true,
      meta: {
        response_time_ms: elapsed,
        chunks_generated: chunkCount,
        projects_included: fetch_projects,
        knowledge_sources: sources.length
      }
    };

    console.log(`[${requestId}] Response complete: ${fullResponse.length} chars in ${elapsed}ms`);

  } catch (error) {
    console.error(`[${requestId}] Chat error:`, error);
    yield { error: 'Chat processing failed', done: true };
  }
}

/**
 * Index a document into Pinecone
 */
async function indexDocument(documentId, fileUrl, category) {
  console.log(`Indexing document ${documentId}: ${fileUrl}`);

  // Text splitter configuration
  const chunkSize = 1000;
  const chunkOverlap = 200;

  try {
    // Download file
    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });

    // Extract text based on file type
    let text = '';
    const isPDF = fileUrl.toLowerCase().includes('.pdf');
    const isText = fileUrl.toLowerCase().match(/\.(txt|md|json)$/);

    if (isPDF) {
      const pdfParse = require('pdf-parse');
      const parsed = await pdfParse(Buffer.from(response.data));
      text = parsed.text;
    } else if (isText) {
      text = response.data.toString('utf-8');
    } else {
      throw new Error('Unsupported file type. Use TXT, MD, or JSON');
    }

    // Split into chunks
    const chunks = splitText(text, chunkSize, chunkOverlap);
    console.log(`Document split into ${chunks.length} chunks`);

    // Generate embeddings and prepare vectors
    const vectors = [];
    const filename = fileUrl.split('/').pop().split('?')[0];

    for (let i = 0; i < chunks.length; i++) {
      try {
        const embedding = await generateEmbedding(chunks[i]);
        vectors.push({
          id: `doc_${documentId}_chunk_${i}`,
          values: embedding,
          metadata: {
            text: chunks[i].substring(0, 1000),
            source: filename,
            category: category,
            document_id: documentId,
            chunk_index: i,
            indexed_at: new Date().toISOString()
          }
        });
      } catch (err) {
        console.error(`Failed to embed chunk ${i}:`, err.message);
      }
    }

    if (vectors.length === 0) {
      throw new Error('Failed to generate embeddings for any chunks');
    }

    // Upsert to Pinecone in batches
    const index = await initPinecone();
    const batchSize = 100;
    let totalUpserted = 0;

    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert(batch, { namespace: process.env.PINECONE_NAMESPACE || 'portfolio-knowledge' });
      totalUpserted += batch.length;
      console.log(`Upserted batch ${Math.floor(i / batchSize) + 1}`);
    }

    console.log(`Document ${documentId} indexed successfully: ${totalUpserted} chunks`);

    return {
      success: true,
      document_id: documentId,
      chunks_indexed: totalUpserted,
      total_chunks: chunks.length,
      status: 'indexed'
    };

  } catch (error) {
    console.error('Indexing failed:', error);
    throw error;
  }
}

/**
 * Split text into chunks
 */
function splitText(text, chunkSize, chunkOverlap) {
  const separators = ['\n\n', '\n', '. ', ' ', ''];
  const chunks = [];

  // Simple chunking strategy
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);

    // Try to break at a separator
    for (const sep of separators) {
      const lastSep = text.lastIndexOf(sep, end);
      if (lastSep > start && lastSep < end) {
        end = lastSep + sep.length;
        break;
      }
    }

    chunks.push(text.substring(start, end).trim());
    start = end - chunkOverlap;
    if (start >= end) start = end;
  }

  return chunks.filter(c => c.length > 0);
}

/**
 * Delete document vectors from Pinecone
 */
async function deleteDocumentVectors(documentId) {
  console.log(`Deleting vectors for document ${documentId}`);

  try {
    const index = await initPinecone();

    // Query for vectors with this document_id in metadata
    // Note: Pinecone serverless supports delete by filter
    // For non-serverless, we'd need to query first then delete by ID

    // First, query to get all vector IDs for this document
    // Since we can't query without a vector, we'll delete by prefix pattern
    // if available, or use metadata filtering if the index supports it

    // Using dummy vector to query
    const dummyVector = new Array(384).fill(0); // all-MiniLM-L6-v2 produces 384-dim vectors
    const results = await index.query({
      vector: dummyVector,
      topK: 10000,
      namespace: process.env.PINECONE_NAMESPACE || 'portfolio-knowledge',
      filter: { document_id: { $eq: parseInt(documentId) } },
      includeMetadata: false
    });

    const idsToDelete = results.matches.map(m => m.id);

    if (idsToDelete.length > 0) {
      await index.deleteMany(idsToDelete, { namespace: process.env.PINECONE_NAMESPACE || 'portfolio-knowledge' });
    }

    return {
      success: true,
      document_id: documentId,
      vectors_deleted: idsToDelete.length
    };

  } catch (error) {
    console.error('Delete failed:', error);
    throw error;
  }
}

/**
 * Health check
 */
async function healthCheck() {
  const status = {
    status: 'healthy',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    pinecone_index: process.env.PINECONE_INDEX || 'web-portfolio',
    namespace: process.env.PINECONE_NAMESPACE || 'portfolio-knowledge',
    checks: {}
  };

  // Check Pinecone
  try {
    const index = await initPinecone();
    const stats = await index.describeIndexStats();
    status.checks.pinecone = {
      status: 'connected',
      total_vectors: stats.totalRecordCount || 0,
      dimension: stats.dimension
    };
  } catch (error) {
    status.checks.pinecone = { status: 'error', error: error.message };
    status.status = 'degraded';
  }

  // Check Database
  try {
    const result = await query('SELECT COUNT(*) as project_count FROM projects');
    status.checks.database = {
      status: 'connected',
      project_count: parseInt(result.rows[0].project_count)
    };
  } catch (error) {
    status.checks.database = { status: 'error', error: error.message };
    status.status = 'degraded';
  }

  // Check Groq
  status.checks.groq = {
    status: 'configured',
    key_valid: process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.length > 20
  };

  return status;
}

module.exports = {
  streamChat,
  indexDocument,
  deleteDocumentVectors,
  healthCheck,
  generateEmbedding,
  fetchAllProjectsFromDB,
  searchKnowledgeBase
};
