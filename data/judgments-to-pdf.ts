import fs from 'fs'
import path from 'path'
import PDFDocument from 'pdfkit'

const sampleDir = path.join(__dirname, 'sample-judgments')
const pdfDir = path.join(sampleDir, 'pdfs')

if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir, { recursive: true })
}

const files = fs.readdirSync(sampleDir).filter(f => f.endsWith('.txt'))

console.log(`Converting ${files.length} judgment text files to PDF...`)

for (const file of files) {
  const txtPath = path.join(sampleDir, file)
  const pdfPath = path.join(pdfDir, file.replace('.txt', '.pdf'))
  
  const text = fs.readFileSync(txtPath, 'utf-8')
  
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  })
  
  doc.pipe(fs.createWriteStream(pdfPath))
  
  doc.fontSize(12)
  doc.font('Courier')
  doc.text(text, {
    width: 500,
    align: 'left'
  })
  
  doc.end()
  
  console.log(`✓ Created ${pdfPath}`)
}

console.log('Done! PDFs created in', pdfDir)
