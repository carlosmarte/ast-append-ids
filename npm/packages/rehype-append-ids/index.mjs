import { selectAll } from 'hast-util-select';
import { visit } from 'unist-util-visit';
import { generateId } from '@thinkeloquent/id-generator';

/**
 * Rehype plugin to append deterministic IDs to HTML elements
 * 
 * @param {Object} options - Plugin configuration
 * @param {String} options.selector - CSS selector for target elements (default: '*:not([id])')
 * @param {String} options.attr - Attribute name for ID (default: 'data-ast-id')
 * @param {String} options.strategy - ID generation strategy: 'hash', 'slug', 'path' (default: 'hash')
 * @param {String} options.prefix - ID prefix (default: 'el-')
 * @param {Boolean} options.overwrite - Overwrite existing IDs (default: false)
 * @returns {Function} Transformer function
 */
function rehypeAppendIds(options = {}) {
  const {
    selector = '*:not([id])',
    attr = 'data-ast-id',
    strategy = 'hash',
    prefix = 'el-',
    overwrite = false
  } = options;

  return function transformer(tree, file) {
    const usedIds = new Set();
    const pathStack = [];
    
    // First pass: collect existing IDs if not overwriting
    if (!overwrite) {
      visit(tree, 'element', (node) => {
        if (node.properties) {
          // Check for existing ID in target attribute
          if (node.properties[attr]) {
            usedIds.add(node.properties[attr]);
          }
          // Also track standard id attribute
          if (node.properties.id) {
            usedIds.add(node.properties.id);
          }
        }
      });
    }
    
    // Second pass: apply IDs to selected elements
    const selectedNodes = selectAll(selector, tree);
    
    selectedNodes.forEach((node) => {
      // Skip if attribute exists and not overwriting
      if (!overwrite && node.properties && node.properties[attr]) {
        return;
      }
      
      // Build path for this node
      const nodePath = [];
      let currentNode = node;
      let parent = tree;
      
      // Simple path building (indices in parent)
      const buildPath = (searchNode, searchTree, currentPath = []) => {
        visit(searchTree, 'element', (visitNode, index, visitParent) => {
          if (visitNode === searchNode) {
            if (visitParent && visitParent.children) {
              const nodeIndex = visitParent.children.indexOf(visitNode);
              if (nodeIndex !== -1) {
                currentPath.unshift(nodeIndex);
              }
            }
            return false; // Stop visiting
          }
        });
        return currentPath;
      };
      
      const path = buildPath(node, tree);
      
      // Generate unique ID
      const id = generateId(node, {
        strategy,
        prefix,
        format: 'colon'
      }, path, usedIds);
      
      // Ensure properties object exists
      if (!node.properties) {
        node.properties = {};
      }
      
      // Set the ID attribute
      node.properties[attr] = id;
    });
    
    return tree;
  };
}

export default rehypeAppendIds;