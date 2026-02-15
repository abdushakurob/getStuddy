import { CiteKitClient } from "citekit";
import { UTApi } from "uploadthing/server";
import dbConnect from "./db";
import Resource from "@/models/Resource";
import { ResolvedNode } from "@/models/ResolvedNode";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { v4 as uuidv4 } from 'uuid';

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

    const resource = await Resource.findById(resourceId).select('+citeKitMap');
    if (!resource) throw new Error("Resource not found");
    if (!resource.fileUrl) throw new Error("Resource has no file URL");

    const baseDir = os.tmpdir();
    const tempDir = path.join(baseDir, "citekit_resolve");

    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    // Download original file
    // SAFE EXTENSION LOGIC: Do not trust URL splitting for UploadThing URLs (which might not have extensions)
    const ext = resource.type === 'video' ? 'mp4' : (resource.type === 'image' ? 'png' : 'pdf');
    const sourcePath = path.join(tempDir, `${resourceId}.${ext}`);

    console.log(`[CiteKit] Downloading source: ${resource.fileUrl}`);
    const res = await fetch(resource.fileUrl);
    if (!res.ok) throw new Error(`Failed to download resource: ${res.statusText}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(sourcePath, buffer);

    try {
        // Initialize CiteKit Client (v0.1.3+)
        const client = new CiteKitClient({
            baseDir: baseDir,
            apiKey: process.env.GEMINI_API_KEY
        });

        // CiteKit needs the map to be in its internal storage to resolve nodes.
        // We ensure it's there before resolving.
        // The default storage for maps in v0.1.3 is [baseDir]/.resource_maps
        const mapsDir = path.join(baseDir, ".resource_maps");
        if (!fs.existsSync(mapsDir)) fs.mkdirSync(mapsDir, { recursive: true });

        if (resource.citeKitMap) {
            const mapPath = path.join(mapsDir, `${resourceId}.json`);
            fs.writeFileSync(mapPath, JSON.stringify(resource.citeKitMap));
        } else {
            throw new Error("Resource has no CiteKit map.");
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
