// import { CiteKitClient } from "citekit"; // Removed for Vercel build fix (DOMMatrix issue)
import { UTApi } from "uploadthing/server";
import dbConnect from "./db";
import Resource from "@/models/Resource";
import { ResolvedNode } from "@/models/ResolvedNode";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { v4 as uuidv4 } from 'uuid';

// VERCEL STABILITY: In-memory browser polyfills for PDF libraries
if (typeof globalThis !== 'undefined') {
    const g = globalThis as any;
    if (!g.DOMMatrix) {
        g.DOMMatrix = class DOMMatrix {
            a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
            constructor(init?: any) {
                if (Array.isArray(init)) {
                    this.a = init[0]; this.b = init[1]; this.c = init[2];
                    this.d = init[3]; this.e = init[4]; this.f = init[5];
                } else if (typeof init === 'string') {
                    // Basic parsing for "matrix(a, b, c, d, e, f)"
                    const match = init.match(/matrix\(([^,]+),([^,]+),([^,]+),([^,]+),([^,]+),([^)]+)\)/);
                    if (match) {
                        this.a = parseFloat(match[1]);
                        this.b = parseFloat(match[2]);
                        this.c = parseFloat(match[3]);
                        this.d = parseFloat(match[4]);
                        this.e = parseFloat(match[5]);
                        this.f = parseFloat(match[6]);
                    }
                }
            }
            multiply(other: DOMMatrix) {
                // Simplified multiplication for 2D affine transformation
                // (a b e)   (a' b' e')
                // (c d f) x (c' d' f')
                // (0 0 1)   (0  0  1 )
                const a = this.a * other.a + this.c * other.b;
                const b = this.b * other.a + this.d * other.b;
                const c = this.a * other.c + this.c * other.d;
                const d = this.b * other.c + this.d * other.d;
                const e = this.a * other.e + this.c * other.f + this.e;
                const f = this.b * other.e + this.d * other.f + this.f;
                return new DOMMatrix([a, b, c, d, e, f]);
            }
            toString() { return `matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.e}, ${this.f})`; }
        };
    }
    if (!g.ImageData) g.ImageData = class ImageData { width = 0; height = 0; data = new Uint8ClampedArray(0); };
    if (!g.Path2D) g.Path2D = class Path2D { };
}

// Initialize UploadThing API client
const utapi = new UTApi();

/**
 * Resolves a CiteKit node within a resource, with cloud-based caching in UploadThing.
 */
export async function resolveResourceNode(resourceId: string, nodeId: string) {
    await dbConnect();

    // 1. Check Cloud Cache
    const cachedNode = await ResolvedNode.findOne({
        resourceId,
        nodeId
    });

    if (cachedNode) {
        console.log(`[CiteKit] Cache HIT for ${resourceId}/${nodeId}: ${cachedNode.url}`);
        return cachedNode.url;
    }

    // 2. Cache MISS: Proceed with Resolution
    console.log(`[CiteKit] Cache MISS for ${resourceId}/${nodeId}. Resolving...`);

    const resource = await Resource.findById(resourceId);
    if (!resource) throw new Error("Resource not found");
    if (!resource.fileUrl) throw new Error("Resource has no file URL");

    const tempDir = path.join(os.tmpdir(), "citekit_resolve");
    const outputDir = path.join(os.tmpdir(), "citekit_output");
    const mapsDir = path.join(os.tmpdir(), "citekit_maps");

    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    if (!fs.existsSync(mapsDir)) fs.mkdirSync(mapsDir, { recursive: true });

    // Download original file
    const ext = resource.fileUrl.split('.').pop() || 'pdf';
    const sourcePath = path.join(tempDir, `${resourceId}.${ext}`);

    console.log(`[CiteKit] Downloading source: ${resource.fileUrl}`);
    const res = await fetch(resource.fileUrl);
    if (!res.ok) throw new Error(`Failed to download resource: ${res.statusText}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(sourcePath, buffer);

    try {
        // Initialize CiteKit Client
        const { CiteKitClient } = await import('citekit'); // Dynamic import
        const client = new CiteKitClient({
            storageDir: mapsDir,
            outputDir: outputDir,
            apiKey: process.env.GEMINI_API_KEY
        });

        // Ensure CiteKit has the map locally
        if (resource.citeKitMap) {
            const mapPath = path.join(mapsDir, `${resourceId}.json`);
            fs.writeFileSync(mapPath, JSON.stringify(resource.citeKitMap));
        } else {
            throw new Error("Resource has no CiteKit map. Ingestion must be performed first.");
        }

        // Perform Resolution
        console.log(`[CiteKit] Slicing node ${nodeId} (${resource.type})...`);
        const evidence = await client.resolve(resourceId, nodeId);

        // Detect MimeType for Upload
        const resultMimeType = resource.type === 'video' ? 'video/mp4' :
            (resource.type === 'image' ? 'image/png' : 'application/pdf');

        // Upload Resolved Segment to UploadThing
        console.log(`[CiteKit] Uploading resolved segment to UploadThing...`);
        const uploadResult = await utapi.uploadFiles(
            new File([fs.readFileSync(evidence.output_path)], path.basename(evidence.output_path), {
                type: resultMimeType
            })
        );

        if (uploadResult.error) {
            throw new Error(`UploadThing failed: ${uploadResult.error.message}`);
        }

        const uploadedUrl = uploadResult.data.url;

        // Cache the URL
        await ResolvedNode.create({
            resourceId,
            nodeId,
            url: uploadedUrl,
            mimeType: resultMimeType,
            metadata: {
                location: evidence.node.location,
                originalAddress: evidence.address
            }
        });

        console.log(`[CiteKit] Node resolved and cached: ${uploadedUrl}`);

        // Cleanup
        try {
            fs.unlinkSync(sourcePath);
            fs.unlinkSync(evidence.output_path);
        } catch (_) { }

        return uploadedUrl;

    } catch (error) {
        console.error(`[CiteKit] Resolution failed:`, error);
        throw error;
    }
}

/**
 * Finds a node ID in a resource's CiteKit map that contains the specified page.
 */
export async function findNodeByPage(resourceId: string, page: number): Promise<string | null> {
    await dbConnect();
    const resource = await Resource.findById(resourceId).select('citeKitMap').lean();
    if (!resource || !resource.citeKitMap || !resource.citeKitMap.nodes) return null;

    for (const node of resource.citeKitMap.nodes) {
        if (node.location && node.location.pages && node.location.pages.includes(page)) {
            return node.id;
        }
    }

    return null;
}

/**
 * Finds a node ID in a resource's CiteKit map that corresponds to a timestamp (in seconds).
 */
export async function findNodeByTimestamp(resourceId: string, seconds: number): Promise<string | null> {
    await dbConnect();
    const resource = await Resource.findById(resourceId).select('citeKitMap').lean();
    if (!resource || !resource.citeKitMap || !resource.citeKitMap.nodes) return null;

    for (const node of resource.citeKitMap.nodes) {
        if (node.location && node.location.modality === 'video') {
            const { start, end } = node.location;
            if (seconds >= start && seconds <= end) {
                return node.id;
            }
        }
    }

    return null;
}
