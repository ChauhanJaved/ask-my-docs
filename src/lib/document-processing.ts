import { PDFDocument } from 'pdf-lib';
import mammoth from 'mammoth';
import { marked } from 'marked';

// Text extraction functions
export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();
  let text = '';

  for (const page of pages) {
    // @ts-expect-error getTextContent method exists but isn't properly typed in pdf-lib - needed for PDF text extraction
    const pageText = await page.getTextContent();
    const strings = pageText.items.map((item: { str: string }) => item.str);
    text += strings.join(' ') + '\n';
  }

  return text;
}

export async function extractTextFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

export async function extractTextFromTxt(file: File): Promise<string> {
  return file.text();
}

export async function extractTextFromMd(file: File): Promise<string> {
  const text = await file.text();
  // Convert markdown to plain text (basic conversion)
  return marked(text);
}

export async function extractTextFromFile(file: File): Promise<string> {
  switch (file.type) {
    case 'application/pdf':
      return extractTextFromPdf(file);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return extractTextFromDocx(file);
    case 'text/plain':
      return extractTextFromTxt(file);
    case 'text/markdown':
      return extractTextFromMd(file);
    default:
      throw new Error(`Unsupported file type: ${file.type}`);
  }
}

// Text chunking functions
interface ChunkingOptions {
  chunkSize?: number;
  overlap?: number;
}

export function chunkText(
  text: string,
  options: ChunkingOptions = {}
): { content: string; tokenCount: number }[] {
  const { chunkSize = 1000, overlap = 200 } = options;

  // Simple word-based chunking (can be improved with sentence boundaries)
  const words = text.split(/\s+/);
  const chunks: { content: string; tokenCount: number }[] = [];

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunkWords = words.slice(i, i + chunkSize);
    const content = chunkWords.join(' ');

    // Rough token count estimation (1 token ≈ 0.75 words for English)
    const tokenCount = Math.round(chunkWords.length / 0.75);

    chunks.push({ content, tokenCount });

    // Break if we've processed all words
    if (i + chunkSize >= words.length) break;
  }

  return chunks;
}

// More sophisticated chunking that respects sentence boundaries
export function chunkTextBySentences(
  text: string,
  options: ChunkingOptions = {}
): { content: string; tokenCount: number }[] {
  const { chunkSize = 1000, overlap = 200 } = options;

  // Split by sentences (basic regex)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  const chunks: { content: string; tokenCount: number }[] = [];
  let currentChunk = '';
  let currentWordCount = 0;

  for (const sentence of sentences) {
    const sentenceWords = sentence.trim().split(/\s+/);
    const sentenceWordCount = sentenceWords.length;

    // If adding this sentence would exceed chunk size, finalize current chunk
    if (currentWordCount + sentenceWordCount > chunkSize && currentChunk) {
      // Rough token count estimation
      const tokenCount = Math.round(currentWordCount / 0.75);
      chunks.push({ content: currentChunk.trim(), tokenCount });

      // Start new chunk with overlap
      const overlapWords = currentChunk.split(/\s+/).slice(-overlap);
      currentChunk = overlapWords.join(' ') + ' ' + sentence.trim();
      currentWordCount = overlapWords.length + sentenceWordCount;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence.trim();
      currentWordCount += sentenceWordCount;
    }
  }

  // Add the last chunk
  if (currentChunk.trim()) {
    const tokenCount = Math.round(currentWordCount / 0.75);
    chunks.push({ content: currentChunk.trim(), tokenCount });
  }

  return chunks;
}

export { chunkText as chunkTextByWords };

// �� 🔑 NEW: NVIDIA NIM Embedding Function
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!process.env.NVIDIA_NIM_API_KEY) {
    throw new Error('NVIDIA_NIM_API_KEY is not configured');
  }

  const response = await fetch("https://integrate.api.nvidia.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.NVIDIA_NIM_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input: [text],
      model: "nvidia/nv-embedqa-e5-v5",
      encoding_format: "float"
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Embedding API error: ${errorData.detail?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding; // Returns 1024-dim float array
}