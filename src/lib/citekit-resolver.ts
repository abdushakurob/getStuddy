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

    // 0. Noise Cleaning: Strip [PDF Page ...] prefix immediately
    // This ensures cache keys are clean and bypasses any old "dirty" cache entries.
    const cleanNodeId = nodeId.replace(/\[PDF Page.*?\]\s*/gi, '').trim();
    if (cleanNodeId !== nodeId) {
        console.log(`[CiteKit] Cleaned Node ID: '${nodeId}' -> '${cleanNodeId}'`);
    }

    // 1. Check Cloud Cache (using CLEAN ID)
    const cachedNode = await ResolvedNode.findOne({
        resourceId,
        nodeId: cleanNodeId
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
    // Use 'citekit_temp' to match gemini.ts and avoid ENOENT issues (library default?)
    const tempDir = path.join(baseDir, "citekit_temp");

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
        const mapsDir = path.join(baseDir, ".resource_maps");
        if (!fs.existsSync(mapsDir)) fs.mkdirSync(mapsDir, { recursive: true });

        // AUTO-HEALING: If Map is missing, generate it NOW.
        let mapToUse = resource.citeKitMap;

        if (!mapToUse) {
            console.log(`[CiteKit] AUTO-MAP: Resource ${resourceId} has no map. Generating on the fly...`);
            const ckType = resource.type === 'video' ? 'video' :
                (resource.type === 'audio' ? 'audio' :
                    (resource.type === 'image' ? 'image' : 'document'));

            // Ingest to generate map with Retries
            let ingestSuccess = false;
            let lastError: any = null;
            for (let i = 1; i <= 3; i++) {
                try {
                    console.log(`[CiteKit] Auto-Ingest Attempt ${i}...`);
                    await client.ingest(sourcePath, ckType, { resourceId });
                    ingestSuccess = true;
                    break;
                } catch (ingestErr) {
                    lastError = ingestErr;
                    console.warn(`[CiteKit] Auto-Ingest Attempt ${i} failed:`, ingestErr);
                    if (i < 3) await new Promise(r => setTimeout(r, 1000 * i)); // Backoff
                }
            }

            if (!ingestSuccess) {
                console.error("[CiteKit] Auto-Ingest Failed. Proceeding with Text-Only.");
                throw new Error(`AUTO_INGEST_FAILED: ${lastError?.message || 'Unknown Error'}`);
            }

            mapToUse = client.getMap(resourceId);

            // Save to DB for future speed
            await Resource.findByIdAndUpdate(resourceId, { citeKitMap: mapToUse });
            console.log(`[CiteKit] Map generated and saved: ${mapToUse.nodes?.length || 0} nodes`);
        } else {
            // Just write the existing map to disk for CiteKit to use
            const mapPath = path.join(mapsDir, `${resourceId}.json`);
            fs.writeFileSync(mapPath, JSON.stringify(mapToUse));
        }

        // FUZZY MATCHING: Handle "Gaussian" vs "UUID"
        let targetNodeId = nodeId;
        const exactMatch = mapToUse.nodes.find((n: any) => n.id === nodeId);

        if (!exactMatch) {


            // Try lenient case-insensitive match on Label
            const fuzzyMatch = mapToUse.nodes.find((n: any) =>
                (n.label && n.label.toLowerCase().includes(cleanNodeId.toLowerCase())) ||
                (n.title && n.title.toLowerCase().includes(cleanNodeId.toLowerCase()))
            );

            if (fuzzyMatch) {
                console.log(`[CiteKit] Fuzzy Match: '${nodeId}' -> '${fuzzyMatch.label}' (${fuzzyMatch.id})`);
                targetNodeId = fuzzyMatch.id;
            } else {
                console.warn(`[CiteKit] Node '${nodeId}' not found in map (Exact or Fuzzy). Defaulting to first node.`);
                // Fallback to first node if completely lost, better than crashing
                if (mapToUse.nodes.length > 0) targetNodeId = mapToUse.nodes[0].id;
            }
        }

        // Perform Resolution
        console.log(`[CiteKit] Slicing node ${targetNodeId} (${resource.type})...`);
        const evidence = await client.resolve(resourceId, targetNodeId);

        // Zero-Byte Safety Check: Ensure the sliced file isn't empty
        const stats = fs.statSync(evidence.output_path);
        if (stats.size === 0) {
            console.error(`[CiteKit] Slicing failed: ${evidence.output_path} is empty.`);
            throw new Error("Resolved node yielded zero bytes. Resolution failed.");
        }

        // Detect MimeType for Upload
        const resultMimeType = resource.type === 'video' ? 'video/mp4' :
            (resource.type === 'audio' ? 'audio/mpeg' :
                (resource.type === 'image' ? 'image/png' : 'application/pdf'));

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
        // Cache the CLEAN ID result
        await ResolvedNode.create({
            resourceId,
            nodeId: cleanNodeId,
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
