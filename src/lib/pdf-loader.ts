export async function loadPdfFromUrl(url: string): Promise<string> {
    try {
        console.log("[pdf-loader] Fetching PDF:", url);
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Dynamic require to avoid ESM static analysis issues
        const pdf = require('pdf-parse');
        const data = await pdf(buffer);
        console.log("[pdf-loader] Parsed successfully. Length:", data.text.length);
        return data.text;
    } catch (error) {
        console.error("Error parsing PDF:", error);
        throw new Error("Failed to parse PDF document");
    }
}
