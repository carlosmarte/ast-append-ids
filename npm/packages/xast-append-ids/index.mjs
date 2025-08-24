import { selectAll } from 'xast-util-select';
import { visit } from 'unist-util-visit';
import { generateId } from '@thinkeloquent/id-generator';

/**
 * XAST plugin to append deterministic IDs to XML elements
 * 
 * @param {Object} options - Plugin configuration
 * @param {String} options.selector - CSS selector for target elements (default: '*:not([id])')
 * @param {String} options.attr - Attribute name for ID (default: 'data-ast-id')
 * @param {String} options.strategy - ID generation strategy: 'hash', 'slug', 'path' (default: 'hash')
 * @param {String} options.prefix - ID prefix (default: 'el-')
 * @param {Boolean} options.overwrite - Overwrite existing IDs (default: false)
 * @param {String} options.namespace - XML namespace for ID attribute (optional)
 * @returns {Function} Transformer function
 */
function xastAppendIds(options = {}) {
  const {
    selector = '*:not([id])',
    attr = 'data-ast-id',
    strategy = 'hash',
    prefix = 'el-',
    overwrite = false,
    namespace = null
  } = options;

  return function transformer(tree, file) {
    const usedIds = new Set();
    const pathStack = [];
    
    // Parse attribute name for namespace support
    let attrNamespace = null;
    let attrLocalName = attr;
    
    if (attr.includes(':')) {
      const parts = attr.split(':');
      attrNamespace = parts[0];
      attrLocalName = parts[1];
    }
    
    // First pass: collect existing IDs if not overwriting
    if (!overwrite) {
      visit(tree, 'element', (node) => {
        if (node.attributes) {
          // Check for existing ID in target attribute
          const existingId = findAttribute(node, attrLocalName, attrNamespace);
          if (existingId) {
            usedIds.add(existingId);
          }
          
          // Also track standard id and xml:id attributes
          const standardId = findAttribute(node, 'id');
          if (standardId) {
            usedIds.add(standardId);
          }
          
          const xmlId = findAttribute(node, 'id', 'xml');
          if (xmlId) {
            usedIds.add(xmlId);
          }
        }
      });
    }
    
    // Second pass: apply IDs to selected elements
    const selectedNodes = selectAll(selector, tree);
    
    selectedNodes.forEach((node) => {
      // Skip if attribute exists and not overwriting
      if (!overwrite) {
        const existing = findAttribute(node, attrLocalName, attrNamespace);
        if (existing) {
          return;
        }
      }
      
      // Build path for this node
      const path = buildNodePath(node, tree);
      
      // Generate unique ID
      const id = generateId(node, {
        strategy,
        prefix,
        format: 'colon'
      }, path, usedIds);
      
      // Set the ID attribute with namespace support
      setAttribute(node, attrLocalName, id, attrNamespace || namespace);
    });
    
    return tree;
  };
}

/**
 * Find an attribute by name and optional namespace
 * @param {Object} node - XAST element node
 * @param {String} localName - Local name of attribute
 * @param {String} namespace - Optional namespace prefix
 * @returns {String|null} Attribute value or null
 */
function findAttribute(node, localName, namespace = null) {
  if (!node.attributes) return null;
  
  const attrName = namespace ? `${namespace}:${localName}` : localName;
  return node.attributes[attrName] || null;
}

/**
 * Set an attribute on a node with namespace support
 * @param {Object} node - XAST element node
 * @param {String} localName - Local name of attribute
 * @param {String} value - Attribute value
 * @param {String} namespace - Optional namespace prefix
 */
function setAttribute(node, localName, value, namespace = null) {
  // Initialize attributes as object if not present
  if (!node.attributes) {
    node.attributes = {};
  }
  
  // Create attribute name
  const attrName = namespace ? `${namespace}:${localName}` : localName;
  
  // Set the attribute value directly (fromXml uses simple key-value pairs)
  node.attributes[attrName] = value;
}

/**
 * Build path indices for a node in the tree
 * @param {Object} targetNode - Target node
 * @param {Object} tree - Root tree
 * @returns {Array} Path indices
 */
function buildNodePath(targetNode, tree) {
  const path = [];
  
  visit(tree, 'element', (node, index, parent) => {
    if (node === targetNode && parent && parent.children) {
      const nodeIndex = parent.children.indexOf(node);
      if (nodeIndex !== -1) {
        path.unshift(nodeIndex);
      }
      
      // Recursively build path up to root
      let currentParent = parent;
      while (currentParent && currentParent !== tree) {
        visit(tree, 'element', (ancestorNode, ancestorIndex, ancestorParent) => {
          if (ancestorNode === currentParent && ancestorParent && ancestorParent.children) {
            const parentIndex = ancestorParent.children.indexOf(currentParent);
            if (parentIndex !== -1) {
              path.unshift(parentIndex);
            }
            currentParent = ancestorParent;
            return false;
          }
        });
      }
      
      return false; // Stop visiting
    }
  });
  
  return path;
}

export default xastAppendIds;