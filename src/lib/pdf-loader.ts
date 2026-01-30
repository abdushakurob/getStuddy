import { PDFParse } from 'pdf-parse';

export async function loadPdfFromUrl(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();

        const parser = new PDFParse({ data: arrayBuffer });
        const data = await parser.getText();
        return data.text;
    } catch (error) {
        console.error("Error parsing PDF:", error);
        throw new Error("Failed to parse PDF document");
    }
}
