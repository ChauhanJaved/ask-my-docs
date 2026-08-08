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
    const pageText = await page.getTextContent();
    const strings = pageText.items.map((item: any) => item.str);
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