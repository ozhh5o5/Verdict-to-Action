export async function extractPdfText(buffer: Buffer): Promise<{ text: string; numpages: number }> {
  // Dynamic import for CommonJS module
  const pdfParse = (await import('pdf-parse' as any)) as any
  const data = await (pdfParse.default || pdfParse)(buffer)
  return { text: data.text, numpages: data.numpages }
}
