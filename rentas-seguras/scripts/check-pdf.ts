import { contractMarkdownToPdf } from "../src/lib/pdf";

async function main() {
  const markdown = `# CONTRATO DE ARRENDAMIENTO

## Comparecencia

**PRIMERA.** El arrendador entrega el inmueble sito en Pachuca, Hidalgo.

- Renta: $8,500.00 MXN
- Fianza: $8,500.00 MXN
`;

  const pdf = await contractMarkdownToPdf(markdown);
  if (pdf.slice(0, 4).toString() !== "%PDF") {
    console.error("not a pdf", pdf.slice(0, 16));
    process.exit(1);
  }
  console.log(`pdf-ok bytes=${pdf.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});