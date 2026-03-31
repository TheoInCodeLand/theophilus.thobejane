from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import json
import asyncio
from datetime import datetime
import groq
from pinecone import Pinecone
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
import psycopg2
from psycopg2.extras import RealDictCursor


# Load env vars manually (more reliable than python-dotenv)
from pathlib import Path

def load_env_file():
    """Load .env file manually with proper encoding handling."""
    env_path = Path(__file__).parent / '.env'
    if not env_path.exists():
        print(f"Warning: .env file not found at {env_path}")
        return
    
    # Try multiple encodings
    encodings = ['utf-8-sig', 'utf-8', 'utf-16', 'utf-16-le', 'utf-16-be', 'latin-1']
    
    for encoding in encodings:
        try:
            with open(env_path, 'r', encoding=encoding) as f:
                content = f.read()
                print(f"Successfully loaded .env with encoding: {encoding}")
                
                for line in content.splitlines():
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        key = key.strip()
                        value = value.strip()
                        # Remove quotes if present
                        if (value.startswith('"') and value.endswith('"')) or \
                           (value.startswith("'") and value.endswith("'")):
                            value = value[1:-1]
                        os.environ.setdefault(key, value)
                return  # Success, exit function
        except Exception as e:
            continue
    
    print("Warning: Could not read .env file with any encoding")

load_env_file()

# Debug output
print(f"DEBUG: GROQ_API_KEY exists: {bool(os.getenv('GROQ_API_KEY'))}")
print(f"DEBUG: PINECONE_API_KEY exists: {bool(os.getenv('PINECONE_API_KEY'))}")
print(f"DEBUG: DATABASE_URL exists: {bool(os.getenv('DATABASE_URL'))}")

app = FastAPI(title="Theophilus Portfolio Chatbot API")

# Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT", "us-east1-gcp")
PINECONE_INDEX = os.getenv("PINECONE_INDEX", "theophilus-portfolio")
PINECONE_NAMESPACE = os.getenv("PINECONE_NAMESPACE", "portfolio-knowledge")
DB_URL = os.getenv("DATABASE_URL")

# Validate required env vars
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not set in environment")
if not PINECONE_API_KEY:
    raise ValueError("PINECONE_API_KEY not set in environment")
if not DB_URL:
    raise ValueError("DATABASE_URL not set in environment")

# Initialize clients
groq_client = groq.Groq(api_key=GROQ_API_KEY)
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index("web-portfolio")

# Embedding model (local, free)
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-roberta-large-v1",
    model_kwargs={'device': 'cpu'}
)

# Text splitter for chunking
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
    separators=["\n\n", "\n", ". ", " ", ""]
)

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    history: Optional[List[Dict[str, str]]] = []
    fetch_projects: Optional[bool] = False

class DocumentIndexRequest(BaseModel):
    document_id: int
    file_path: str
    category: str

class SearchResult(BaseModel):
    content: str
    source: str
    score: float

def get_db_connection():
    return psycopg2.connect(DB_URL, cursor_factory=RealDictCursor)

def get_embedding(text: str) -> List[float]:
    """Generate embedding for text."""
    return embeddings.embed_query(text)

def search_knowledge_base(query: str, top_k: int = 5) -> List[SearchResult]:
    """Search Pinecone for relevant context."""
    query_embedding = get_embedding(query)
    
    results = index.query(
        vector=query_embedding,
        top_k=top_k,
        namespace=PINECONE_NAMESPACE,
        include_metadata=True
    )
    
    return [
        SearchResult(
            content=match.metadata.get('text', ''),
            source=match.metadata.get('source', 'Unknown'),
            score=match.score
        )
        for match in results.matches
    ]

def fetch_projects_from_db(query_terms: List[str]) -> str:
    """Fetch relevant projects from PostgreSQL."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Search projects by tags or description
        search_pattern = f"%{'%'.join(query_terms)}%"
        
        cur.execute("""
            SELECT title, description, status, tags, github_url, live_url 
            FROM projects 
            WHERE title ILIKE %s 
               OR description ILIKE %s 
               OR EXISTS (SELECT 1 FROM unnest(tags) tag WHERE tag ILIKE %s)
            ORDER BY featured DESC, year DESC
            LIMIT 5
        """, (search_pattern, search_pattern, f"%{query_terms[0]}%"))
        
        projects = cur.fetchall()
        cur.close()
        conn.close()
        
        if not projects:
            return ""
        
        project_text = "\n\nRELEVANT PROJECTS FROM DATABASE:\n"
        for p in projects:
            tags = ', '.join(p['tags']) if p['tags'] else 'None'
            project_text += f"""
Project: {p['title']}
Status: {p['status']}
Description: {p['description']}
Tags: {tags}
Links: GitHub: {p['github_url'] or 'N/A'}, Live: {p['live_url'] or 'N/A'}
---"""
        return project_text
    except Exception as e:
        print(f"Error fetching projects: {e}")
        return ""

def build_system_prompt(context: str, projects_context: str = "") -> str:
    """Build the system prompt with context."""
    return f"""You are TheoBot, an AI assistant representing Theophilus Thobejane, a Full-Stack Developer and AI Engineer.

YOUR ROLE:
- Answer questions about Theophilus's skills, experience, projects, and background
- Be professional yet conversational, like Theo would speak
- If you don't know something specific, be honest and suggest contacting Theo directly
- Always encourage recruiters and collaborators to reach out

THEOPHILUS'S PROFILE:
- Full-Stack Developer & AI Engineer based in Kempton Park, Gauteng, South Africa
- Advanced Diploma in ICT (NQF Level 7) from University of Mpumalanga
- 4 production apps shipped in 14 months including AI-powered platforms
- Specializes in: Python, Node.js, PostgreSQL, React Native, AI/LLM integration
- Former Teaching Assistant (improved student scores by 21%)
- IBM Certified: Applied Data Science, Agile Explorer, Data Fundamentals

KEY PROJECTS:
1. Axiora AI - Enterprise RAG Chatbot Platform (Python/FastAPI, Pinecone, Groq LLM)
2. Happy Deliveries - Real-time geospatial delivery platform (Node.js, PostGIS, Socket.io)
3. Casalinga Tours - AI-integrated booking ecosystem with ML recommendations
4. JobTrack - AI-powered application tracking with predictive analytics

CONTEXT FROM KNOWLEDGE BASE:
{context}

{projects_context}

CONTACT INFORMATION:
- Email: thobejanetheo@gmail.com
- LinkedIn: linkedin.com/in/theophilusthobejane
- GitHub: github.com/TheoInCodeLand
- Portfolio: theophilus-portfolio.vercel.app
- Location: Kempton Park, Gauteng (Available for remote/hybrid)
- Status: Immediately available

GUIDELINES:
- Keep responses concise but informative (2-4 paragraphs max)
- Mention specific metrics when relevant (94% accuracy, 60% time saved, etc.)
- For technical questions, show depth of knowledge
- For availability/hiring questions, emphasize immediate availability and eagerness
- Always end with a subtle call-to-action (check out projects, send email, etc.)
- If asked about skills not in context, say "While that's not in my primary stack, I'm a rapid learner who taught myself Node.js and AI/ML from scratch"

DO NOT:
- Make up projects or experience not in the context
- Provide personal information not in the context
- Speak in third person about yourself (you ARE TheoBot, representing Theo)"""

@app.post("/chat")
async def chat_stream(request: ChatRequest):
    """Streaming chat endpoint."""
    try:
        # 1. Search knowledge base
        search_results = search_knowledge_base(request.message)
        context = "\n\n".join([f"[Source: {r.source}]\n{r.content}" for r in search_results])
        
        # 2. Check if we need project data
        projects_context = ""
        project_keywords = ['project', 'built', 'shipped', 'portfolio', 'github', 'node', 'python', 'react']
        if any(kw in request.message.lower() for kw in project_keywords) or request.fetch_projects:
            # Extract key terms from query
            terms = [word for word in request.message.lower().split() if len(word) > 3]
            projects_context = fetch_projects_from_db(terms[:3])
        
        # 3. Build messages
        system_prompt = build_system_prompt(context, projects_context)
        
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add history (last 6 messages for context)
        for msg in request.history[-6:]:
            messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })
        
        messages.append({"role": "user", "content": request.message})
        
        # 4. Stream from Groq
        stream = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            stream=True,
            temperature=0.7,
            max_tokens=1024
        )
        
        async def generate():
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield f"data: {json.dumps({'content': chunk.choices[0].delta.content})}\n\n"
            
            # Send sources used
            sources = list(set([r.source for r in search_results]))
            yield f"data: {json.dumps({'sources': sources, 'done': True})}\n\n"
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/index-document")
async def index_document(request: DocumentIndexRequest):
    """Index a PDF/document into the vector database."""
    try:
        # Load document
        if request.file_path.endswith('.pdf'):
            loader = PyPDFLoader(request.file_path)
        else:
            loader = TextLoader(request.file_path)
        
        documents = loader.load()
        
        # Split into chunks
        chunks = text_splitter.split_documents(documents)
        
        # Prepare for Pinecone
        vectors = []
        for i, chunk in enumerate(chunks):
            embedding = get_embedding(chunk.page_content)
            vectors.append({
                'id': f"doc_{request.document_id}_chunk_{i}",
                'values': embedding,
                'metadata': {
                    'text': chunk.page_content,
                    'source': os.path.basename(request.file_path),
                    'category': request.category,
                    'document_id': request.document_id,
                    'chunk_index': i
                }
            })
        
        # Upsert to Pinecone in batches
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            index.upsert(vectors=batch, namespace=PINECONE_NAMESPACE)
        
        # Update database status
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            UPDATE documents 
            SET index_status = 'indexed', 
                is_indexed = true, 
                chunk_count = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING *
        """, (len(chunks), request.document_id))
        result = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "document_id": request.document_id,
            "chunks_indexed": len(chunks),
            "status": "indexed"
        }
        
    except Exception as e:
        # Update error status
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            UPDATE documents 
            SET index_status = 'error', 
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (request.document_id,))
        conn.commit()
        cur.close()
        conn.close()
        
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/delete-document/{document_id}")
async def delete_document_vectors(document_id: int):
    """Delete all vectors for a document."""
    try:
        # Update database
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            UPDATE documents 
            SET index_status = 'pending', 
                is_indexed = false, 
                chunk_count = 0
            WHERE id = %s
        """, (document_id,))
        conn.commit()
        cur.close()
        conn.close()
        
        return {"success": True, "message": "Document vectors marked for deletion"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "pinecone_index": PINECONE_INDEX,
        "namespace": PINECONE_NAMESPACE,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)