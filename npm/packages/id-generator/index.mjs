import crypto from 'crypto';

/**
 * Shared ID generation strategies for AST nodes
 */

/**
 * Generate a deterministic hash ID from node path and content
 * @param {Object} node - AST node
 * @param {Array} path - Path to node in tree
 * @param {String} prefix - ID prefix
 * @returns {String} Generated ID
 */
function generateHashId(node, path, prefix = '') {
  const pathString = path.join(':');
  const content = JSON.stringify({
    type: node?.type || node?.tagName || node?.name || 'unknown',
    position: node?.position || null,
    path: pathString
  });
  
  const hash = crypto
    .createHash('sha256')
    .update(content)
    .digest('hex')
    .substring(0, 8);
  
  return `${prefix}${hash}`;
}

/**
 * Generate a slug ID from node text content
 * @param {Object} node - AST node
 * @param {String} prefix - ID prefix
 * @returns {String} Generated ID
 */
function generateSlugId(node, prefix = '') {
  const text = extractTextContent(node);
  if (!text) {
    return generateHashId(node, [], prefix);
  }
  
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
  
  return `${prefix}${slug}`;
}

/**
 * Generate a path-based ID from node position in tree
 * @param {Object} node - AST node
 * @param {Array} path - Path indices in tree
 * @param {String} prefix - ID prefix
 * @returns {String} Generated ID
 */
function generatePathId(node, path, prefix = '') {
  const tagName = node.tagName || node.name || node.type || 'node';
  const pathString = path.length > 0 ? `-${path.join('-')}` : '';
  return `${prefix}${tagName}${pathString}`;
}

/**
 * Extract text content from a node recursively
 * @param {Object} node - AST node
 * @returns {String} Text content
 */
function extractTextContent(node) {
  if (typeof node === 'string') return node;
  if (node.value !== undefined && node.value !== null) return String(node.value);
  if (node.children) {
    const texts = node.children
      .map(child => extractTextContent(child))
      .filter(text => text); // Filter out empty strings, null, undefined
    
    // Special handling: if any text contains spaces at the start or end,
    // preserve proper spacing between words
    let result = '';
    for (let i = 0; i < texts.length; i++) {
      if (i === 0) {
        result = texts[i];
      } else {
        // Add space between text segments if they don't already have spacing
        const prevEndsWithSpace = result.endsWith(' ');
        const currStartsWithSpace = texts[i].startsWith(' ');
        if (!prevEndsWithSpace && !currStartsWithSpace) {
          result += ' ' + texts[i];
        } else {
          result += texts[i];
        }
      }
    }
    return result.replace(/\s+/g, ' ').trim();
  }
  return '';
}

/**
 * Ensure ID uniqueness by appending counter if needed
 * @param {String} id - Proposed ID
 * @param {Set} usedIds - Set of already used IDs
 * @returns {String} Unique ID
 */
function ensureUniqueId(id, usedIds) {
  if (!usedIds.has(id)) {
    usedIds.add(id);
    return id;
  }
  
  let counter = 2;
  let uniqueId = `${id}-${counter}`;
  while (usedIds.has(uniqueId)) {
    counter++;
    uniqueId = `${id}-${counter}`;
  }
  
  usedIds.add(uniqueId);
  return uniqueId;
}

/**
 * Convert between hyphenated and colon format
 * @param {String} id - ID to convert
 * @param {String} format - Target format ('hyphen' or 'colon')
 * @returns {String} Converted ID
 */
function convertIdFormat(id, format = 'colon') {
  if (format === 'hyphen') {
    return id.replace(/:/g, '-');
  } else {
    return id.replace(/-/g, ':');
  }
}

/**
 * Main ID generator function
 * @param {Object} node - AST node
 * @param {Object} options - Generation options
 * @param {Array} path - Path to node
 * @param {Set} usedIds - Set of used IDs
 * @returns {String} Generated unique ID
 */
function generateId(node, options = {}, path = [], usedIds = new Set()) {
  if (!node) {
    // Generate different types for null vs undefined to ensure different hashes
    node = { type: node === null ? 'null' : 'undefined' };
  }
  
  const {
    strategy = 'hash',
    prefix = '',
    format = 'colon'
  } = options || {};
  
  let id;
  
  switch (strategy) {
    case 'slug':
      id = generateSlugId(node, prefix);
      break;
    case 'path':
      id = generatePathId(node, path, prefix);
      break;
    case 'hash':
    default:
      id = generateHashId(node, path, prefix);
      break;
  }
  
  id = ensureUniqueId(id, usedIds);
  
  if (format === 'hyphen') {
    id = convertIdFormat(id, 'hyphen');
  }
  
  return id;
}

export {
  generateId,
  generateHashId,
  generateSlugId,
  generatePathId,
  ensureUniqueId,
  convertIdFormat,
  extractTextContent
};