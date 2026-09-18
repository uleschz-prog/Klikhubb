import PDFDocument from "pdfkit";
import { APP_NAME } from "@/lib/constants";

function markdownToPdfBlocks(markdown: string) {
  return markdown
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => {
      const heading = /^(#{1,3})\s+(.*)$/.exec(line);
      if (heading) {
        return {
          type: "heading" as const,
          level: heading[1].length,
          text: heading[2].replace(/\*\*/g, "").trim(),
        };
      }
      if (/^\s*[-*]\s+/.test(line)) {
        return {
          type: "bullet" as const,
          text: line.replace(/^\s*[-*]\s+/, "").replace(/\*\*/g, "").trim(),
        };
      }
      return {
        type: "paragraph" as const,
        text: line.replace(/\*\*/g, "").replace(/`/g, ""),
      };
    });
}

export function contractMarkdownToPdf(markdown: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 56, bottom: 56, left: 64, right: 64 },
      info: {
        Title: "Contrato de arrendamiento",
        Author: APP_NAME,
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(9).fillColor("#7c2d1a").text(APP_NAME.toUpperCase(), {
      align: "right",
    });
    doc.moveDown(0.6);
    doc.fillColor("#14110f");

    for (const block of markdownToPdfBlocks(markdown)) {
      if (block.type === "heading") {
        const size = block.level === 1 ? 16 : block.level === 2 ? 13 : 11;
        doc.moveDown(0.5);
        doc.font("Times-Bold").fontSize(size).text(block.text, {
          align: block.level === 1 ? "center" : "left",
        });
        doc.moveDown(0.25);
        continue;
      }

      if (block.type === "bullet") {
        doc.font("Times-Roman").fontSize(11).text(`• ${block.text}`, {
          align: "justify",
        });
        continue;
      }

      if (!block.text.trim()) {
        doc.moveDown(0.25);
        continue;
      }

      doc.font("Times-Roman").fontSize(11).text(block.text, { align: "justify" });
    }

    doc.end();
  });
}
