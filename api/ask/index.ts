import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;

// Debug logging
console.log('Ask API Environment check:', {
  hasSupabaseUrl: !!SUPABASE_URL,
  hasSupabaseKey: !!SUPABASE_SERVICE_ROLE_KEY,
  hasAnthropicKey: !!ANTHROPIC_API_KEY,
  hasVoyageKey: !!VOYAGE_API_KEY
});

// Initialize Supabase client
const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    })
  : null;

// Types
interface Quote {
  text: string;
  document_title: string;
  page: number;
  url: string;
  score: number;
}

interface AskResponse {
  answer: string;
  quotes: Quote[];
  confidence: string;
}

interface RateLimitInfo {
  requests_remaining: number;
  reset_time: string;
  subscription_level: string;
}

// Rate limits by subscription level (requests per day)
const RATE_LIMITS: Record<string, number> = {
  free: 5,
  personal: 100,
  corporate: 1000,
  anonymous: 3
};

/**
 * Check rate limit for user
 */
async function checkRateLimit(userId: string | null): Promise<{ allowed: boolean; info: RateLimitInfo }> {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase not initialized');
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    if (userId) {
      // Check authenticated user
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('subscription_level')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return {
          allowed: false,
          info: {
            requests_remaining: 0,
            reset_time: tomorrowStart.toISOString(),
            subscription_level: 'unknown'
          }
        };
      }

      const subscriptionLevel = profile?.subscription_level || 'free';
      const limit = RATE_LIMITS[subscriptionLevel] || RATE_LIMITS.free;

      // Count today's requests
      const { count, error: countError } = await supabaseAdmin
        .from('query_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', todayStart.toISOString());

      if (countError) {
        console.error('Error counting requests:', countError);
        return {
          allowed: true, // Allow on error
          info: {
            requests_remaining: limit,
            reset_time: tomorrowStart.toISOString(),
            subscription_level: subscriptionLevel
          }
        };
      }

      const requestsToday = count || 0;
      const remaining = Math.max(0, limit - requestsToday);

      return {
        allowed: requestsToday < limit,
        info: {
          requests_remaining: remaining,
          reset_time: tomorrowStart.toISOString(),
          subscription_level: subscriptionLevel
        }
      };
    } else {
      // Anonymous user - very limited
      return {
        allowed: true, // For now, allow anonymous (can add IP-based limiting later)
        info: {
          requests_remaining: RATE_LIMITS.anonymous,
          reset_time: tomorrowStart.toISOString(),
          subscription_level: 'anonymous'
        }
      };
    }
  } catch (error) {
    console.error('Rate limit check error:', error);
    return {
      allowed: true, // Allow on error
      info: {
        requests_remaining: 5,
        reset_time: new Date().toISOString(),
        subscription_level: 'unknown'
      }
    };
  }
}

/**
 * Generate embedding using Voyage AI
 */
async function generateEmbedding(question: string): Promise<number[]> {
  if (!VOYAGE_API_KEY) {
    throw new Error('VOYAGE_API_KEY not configured');
  }

  console.log('[VOYAGE] Generating embedding for question');

  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VOYAGE_API_KEY}`
    },
    body: JSON.stringify({
      input: [question],
      model: 'voyage-law-2',
      input_type: 'query'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[VOYAGE] Error:', error);
    throw new Error(`Voyage AI error: ${response.status}`);
  }

  const data = await response.json();
  console.log('[VOYAGE] ✅ Embedding generated');
  return data.data[0].embedding;
}

/**
 * Search for similar vectors in Supabase
 */
async function searchSimilarVectors(
  embedding: number[],
  limit: number = 8,
  threshold: number = 0.3,
  townId: string | null = null
): Promise<any[]> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not initialized');
  }

  console.log('[SEARCH] Searching for similar vectors');

  // Call Supabase RPC function for vector similarity search
  const { data, error } = await supabaseAdmin.rpc('match_document_chunks', {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: limit,
    filter_town_id: townId
  });

  if (error) {
    console.error('[SEARCH] Error:', error);
    throw new Error(`Vector search error: ${error.message}`);
  }

  console.log(`[SEARCH] Found ${data?.length || 0} chunks`);
  return data || [];
}

/**
 * Generate response using Anthropic Claude
 */
async function generateClaudeResponse(
  question: string,
  chunks: any[],
  locale: string
): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  console.log('[CLAUDE] Generating response');

  // Build context from chunks
  const context = chunks.map((chunk, i) => {
    const docTitle = chunk.document_title || 'Document';
    const page = chunk.page_number || '?';
    const content = chunk.content || '';
    const similarity = chunk.similarity || 0;
    return `[Fragment ${i + 1} - ${docTitle}, pàg. ${page}, similaritat: ${similarity.toFixed(3)}]\n${content}`;
  }).join('\n\n---\n\n');

  const systemPrompt = `Ets ArquiNorma — un expert assistent tècnic per a arquitectes que treballen amb el Codi Tècnic d'Edificació (CTE) i normatives de Catalunya.

NORMA CRÍTICA: NOMÉS pots utilitzar informació dels fragments de documents proporcionats. 
- Si el context està BUIT o NO conté informació rellevant → Di EXACTAMENT: "No he trobat informació específica sobre aquesta qüestió a la base de dades de documents. Si us plau reformula la teva pregunta."
- MAI utilitzis el teu coneixement general sobre normatives
- SEMPRE cita els documents exactes d'on prové la informació

IMPORTANT: Proporciona respostes COMPLETES i DETALLADES basades exclusivament en els fragments proporcionats.

CRÍTIC: NO incloguis cap capçalera com "Resposta basada en normativa:" o similar. Comença directament amb el contingut de la resposta.

ESTRUCTURA DE LA RESPOSTA:
1) **Resposta directa**: Dona una explicació clara i pràctica (2-5 frases) que respongui directament la pregunta.

2) **Articles i Clàusules completes**: 
   - Cita els articles COMPLETS del document original
   - Inclou el número d'article, secció i títol si estan disponibles
   - Copia el text EXACTE tal com apareix al document (no parafrasegis)

3) **Referències amb enllaços**:
   Per cada article citat, proporciona:
   - 📄 Nom del document
   - 📖 Número de pàgina
   - 🔗 Enllaç directe

4) **Confiança**: Alta (resposta completa i directa) / Mitjana (resposta parcial) / Baixa (informació limitada)`;

  const noInfoMessage = 'No he trobat informació específica sobre aquesta qüestió a la base de dades de documents. Si us plau reformula la teva pregunta.';

  const contextMessage = (!context || context.trim() === '' || chunks.length === 0)
    ? '[NO DOCUMENT CONTEXT AVAILABLE - You MUST say you don\'t have information]'
    : context;

  const userMessage = `You must answer the SPECIFIC question using ONLY the provided context.

IMPORTANT: You MUST ALWAYS respond in CATALAN, regardless of the language of the question.

CRITICAL: DO NOT include any header like "Resposta basada en normativa:" or similar. Start directly with the content of your answer.

Context from documents:
${contextMessage}

SPECIFIC QUESTION TO ANSWER:
${question}

CRITICAL: If the context is empty or doesn't contain relevant information, you MUST respond with EXACTLY this message in Catalan: "${noInfoMessage}" NEVER use your general knowledge. ALWAYS respond in Catalan.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      temperature: 0.3,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[CLAUDE] Error:', error);
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const answer = data.content[0].text;
  console.log('[CLAUDE] ✅ Response generated');
  return answer;
}

/**
 * Format response with quotes
 */
function formatResponse(answer: string, chunks: any[]): AskResponse {
  // Extract quotes from top chunks
  const quotes: Quote[] = chunks.slice(0, 3).map(chunk => ({
    text: (chunk.content || '').substring(0, 200) + '...',
    document_title: chunk.document_title || 'Document',
    page: chunk.page_number || 1,
    url: chunk.document_url || '#',
    score: chunk.similarity || 0
  }));

  // Determine confidence based on chunk similarities
  let confidence = 'Low';
  if (chunks.length > 0) {
    const topSimilarity = chunks[0].similarity || 0;
    if (topSimilarity > 0.7) confidence = 'High';
    else if (topSimilarity > 0.5) confidence = 'Medium';
  }

  return {
    answer,
    quotes,
    confidence
  };
}

/**
 * Log query to database
 */
async function logQuery(userId: string | null, question: string, response: string): Promise<void> {
  if (!supabaseAdmin) return;

  try {
    await supabaseAdmin.from('query_logs').insert({
      user_id: userId,
      question: question.substring(0, 500),
      response_summary: response.substring(0, 500),
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log query:', error);
  }
}

/**
 * Main handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // CORS headers
    const origin = req.headers.origin || '';
    const allowedOrigins = [
      'https://www.arquinorma.cat',
      'https://arquinorma.cat',
      'https://arquinorma-frontend.vercel.app'
    ];

    const isAllowedOrigin = allowedOrigins.includes(origin) || 
      origin.startsWith('http://localhost') || 
      origin.startsWith('http://127.0.0.1');

    if (isAllowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).json({ success: true });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Check environment
    if (!supabaseAdmin) {
      console.error('Supabase not initialized');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    if (!ANTHROPIC_API_KEY || !VOYAGE_API_KEY) {
      console.error('AI services not configured');
      return res.status(500).json({ error: 'AI services not configured' });
    }

    // Parse request
    const { question, locale = 'ca', user_id = null, town_id = null } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length < 5) {
      return res.status(400).json({ error: 'Question must be at least 5 characters' });
    }

    console.log(`Processing question from user ${user_id}: ${question.substring(0, 50)}...`);

    // Check rate limit
    const { allowed, info } = await checkRateLimit(user_id);
    if (!allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        requests_remaining: info.requests_remaining,
        reset_time: info.reset_time,
        subscription_level: info.subscription_level,
        upgrade_message: 'Upgrade your subscription for more questions per day'
      });
    }

    // Process question
    const embedding = await generateEmbedding(question);
    const chunks = await searchSimilarVectors(embedding, 8, 0.3, town_id);
    const answer = await generateClaudeResponse(question, chunks, locale);
    const response = formatResponse(answer, chunks);

    // Log query
    await logQuery(user_id, question, `Confidence: ${response.confidence}, Quotes: ${response.quotes.length}`);

    console.log(`✅ Question processed successfully, confidence: ${response.confidence}`);

    return res.status(200).json(response);

  } catch (error: any) {
    console.error('Error processing question:', error);
    return res.status(500).json({
      error: 'Failed to process question',
      message: error.message || 'Unknown error'
    });
  }
}

