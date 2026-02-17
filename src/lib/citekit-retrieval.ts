/**
 * CiteKit-based intelligent retrieval for dynamic context assembly
 * 
 * Instead of sending ALL resource content to the LLM, this module:
 * 1. Searches the CiteKit map for nodes relevant to the current topic/milestone
 * 2. Returns only the top-K most relevant nodes
 * 3. Dramatically reduces token usage and latency
 */

import Resource from '@/models/Resource';

/**
 * Configuration
 */
const TOP_K_NODES = 5; // Maximum nodes to retrieve per query
const MIN_RELEVANCE_SCORE = 0.3; // Threshold for semantic matching

/**
 * Represents a node from the CiteKit map with relevance score
 */
interface RankedNode {
  nodeId: string;
  title?: string;
  label?: string;
  summary?: string;
  page?: number;
  timestamp?: number;
  score: number; // 0-1 relevance score
  resourceId: string;
  resourceName: string;
}

/**
 * Search query context
 */
interface SearchContext {
  milestone?: string;
  currentTopic?: string;
  userQuery?: string;
  keywords?: string[];
}

/**
 * Searches CiteKit maps across resources for nodes relevant to the search context
 * 
 * @param resourceIds - Array of resource IDs to search within
 * @param searchContext - Context containing milestone, topic, user query, etc.
 * @returns Top-K ranked nodes with metadata
 */
export async function searchRelevantNodes(
  resourceIds: string[],
  searchContext: SearchContext
): Promise<RankedNode[]> {
  if (!resourceIds.length) {
    return [];
  }

  // Fetch resources with CiteKit maps
  const resources = await Resource.find({
    _id: { $in: resourceIds },
    status: 'ready',
    citeKitMap: { $exists: true, $ne: null }
  }).select('_id name type citeKitMap').lean();

  if (!resources.length) {
    return [];
  }

  // Extract all nodes with resource context
  const allNodes: Array<{
    node: any;
    resourceId: string;
    resourceName: string;
  }> = [];

  for (const resource of resources) {
    const map = resource.citeKitMap as any;
    if (!map?.nodes || !Array.isArray(map.nodes)) {
      continue;
    }

    for (const node of map.nodes) {
      allNodes.push({
        node,
        resourceId: resource._id.toString(),
        resourceName: resource.name
      });
    }
  }

  if (!allNodes.length) {
    return [];
  }

  // Build search query from context
  const queryText = buildSearchQuery(searchContext);
  const keywords = extractKeywords(queryText);

  // Score each node against the search context
  const rankedNodes: RankedNode[] = allNodes
    .map(({ node, resourceId, resourceName }) => ({
      nodeId: node.id || node.nodeId || '',
      title: node.title,
      label: node.label,
      summary: node.summary,
      page: node.page,
      timestamp: node.timestamp,
      score: calculateRelevance(node, keywords, queryText),
      resourceId,
      resourceName
    }))
    .filter(node => node.score >= MIN_RELEVANCE_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K_NODES);

  return rankedNodes;
}

/**
 * Builds a search query string from the search context
 */
function buildSearchQuery(context: SearchContext): string {
  const parts: string[] = [];

  if (context.milestone) {
    parts.push(context.milestone);
  }
  if (context.currentTopic) {
    parts.push(context.currentTopic);
  }
  if (context.userQuery) {
    parts.push(context.userQuery);
  }
  if (context.keywords?.length) {
    parts.push(...context.keywords);
  }

  return parts.join(' ').toLowerCase();
}

/**
 * Extracts meaningful keywords from text (simple implementation)
 */
function extractKeywords(text: string): string[] {
  // Remove common stop words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'should', 'could', 'can', 'may', 'might', 'must', 'shall',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who',
    'when', 'where', 'why', 'how', 'this', 'that', 'these', 'those'
  ]);

  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

/**
 * Calculates relevance score for a node (0-1)
 * Uses simple keyword matching + semantic heuristics
 */
function calculateRelevance(
  node: any,
  keywords: string[],
  fullQuery: string
): number {
  let score = 0;
  const weights = {
    title: 0.4,
    label: 0.3,
    summary: 0.2,
    exact: 0.1
  };

  // Prepare searchable text from node
  const title = (node.title || '').toLowerCase();
  const label = (node.label || '').toLowerCase();
  const summary = (node.summary || '').toLowerCase();
  const combined = `${title} ${label} ${summary}`;

  // Exact phrase match (highest signal)
  if (fullQuery && combined.includes(fullQuery)) {
    score += weights.exact;
  }

  // Keyword matching in different fields
  for (const keyword of keywords) {
    if (title.includes(keyword)) {
      score += weights.title / keywords.length;
    }
    if (label.includes(keyword)) {
      score += weights.label / keywords.length;
    }
    if (summary.includes(keyword)) {
      score += weights.summary / keywords.length;
    }
  }

  // Normalize to 0-1
  return Math.min(score, 1);
}

/**
 * Formats ranked nodes into a compact context string for LLM
 * 
 * @param rankedNodes - Nodes to format
 * @returns Formatted context block
 */
export function formatNodesForContext(rankedNodes: RankedNode[]): string {
  if (!rankedNodes.length) {
    return '';
  }

  const sections = rankedNodes.map((node, idx) => {
    const parts = [
      `[${idx + 1}] ${node.resourceName}`,
      node.page !== undefined ? `Page ${node.page}` : '',
      node.timestamp !== undefined ? `Time ${formatTimestamp(node.timestamp)}` : '',
      node.title || node.label || 'Untitled',
      node.summary || ''
    ].filter(Boolean);

    return parts.join(' | ');
  });

  return `## Relevant Content Nodes\n\n${sections.join('\n\n')}`;
}

/**
 * Formats timestamp in seconds to MM:SS or HH:MM:SS
 */
function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

/**
 * Retrieves node IDs that the LLM has explicitly requested
 * This is used when the agent uses a hypothetical retrieve_nodes tool
 * 
 * @param nodeIds - Array of node IDs to retrieve
 * @param resourceIds - Array of resource IDs to search within
 * @returns Array of nodes with full metadata
 */
export async function retrieveNodesByIds(
  nodeIds: string[],
  resourceIds: string[]
): Promise<RankedNode[]> {
  if (!nodeIds.length || !resourceIds.length) {
    return [];
  }

  const resources = await Resource.find({
    _id: { $in: resourceIds },
    status: 'ready',
    citeKitMap: { $exists: true, $ne: null }
  }).select('_id name citeKitMap').lean();

  const results: RankedNode[] = [];

  for (const resource of resources) {
    const map = resource.citeKitMap as any;
    if (!map?.nodes || !Array.isArray(map.nodes)) {
      continue;
    }

    for (const node of map.nodes) {
      const nodeId = node.id || node.nodeId;
      if (nodeIds.includes(nodeId)) {
        results.push({
          nodeId,
          title: node.title,
          label: node.label,
          summary: node.summary,
          page: node.page,
          timestamp: node.timestamp,
          score: 1.0, // Explicitly requested, so perfect relevance
          resourceId: resource._id.toString(),
          resourceName: resource.name
        });
      }
    }
  }

  return results;
}
