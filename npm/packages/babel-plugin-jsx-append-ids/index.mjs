import crypto from 'crypto';
import { generateId, extractTextContent, ensureUniqueId } from '@thinkeloquent/id-generator';

/**
 * Babel plugin to append deterministic IDs to JSX host elements
 * 
 * Configuration options:
 * @param {String} attr - Attribute name for ID (default: 'data-ast-id')
 * @param {String} strategy - ID generation strategy: 'hash', 'slug', 'path' (default: 'hash')
 * @param {String} prefix - ID prefix (default: 'el-')
 * @param {Boolean} overwrite - Overwrite existing IDs (default: false)
 * @param {Array} include - Array of tag names to include (default: all host elements)
 * @param {Array} exclude - Array of tag names to exclude (default: [])
 */
export default function babelPluginJsxAppendIds(babel) {
  const { types: t } = babel;
  
  return {
    name: 'babel-plugin-jsx-append-ids',
    
    visitor: {
      Program(path, state) {
        // Initialize state for tracking IDs per file
        state.usedIds = new Set();
        state.nodeCounter = 0;
        
        // Get plugin options
        const {
          attr = 'data-ast-id',
          strategy = 'hash',
          prefix = 'el-',
          overwrite = false,
          include = [],
          exclude = []
        } = state.opts || {};
        
        state.pluginOptions = {
          attr,
          strategy,
          prefix,
          overwrite,
          include,
          exclude
        };
      },
      
      JSXOpeningElement(path, state) {
        const { node } = path;
        const { pluginOptions, usedIds } = state;
        
        // Get the element name
        const elementName = getElementName(node.name);
        
        // Skip if not a host element (components start with uppercase)
        if (!isHostElement(elementName)) {
          return;
        }
        
        // Check include/exclude lists
        if (pluginOptions.include.length > 0 && !pluginOptions.include.includes(elementName)) {
          return;
        }
        
        if (pluginOptions.exclude.includes(elementName)) {
          return;
        }
        
        // Check if attribute already exists
        const existingAttr = findAttribute(node, pluginOptions.attr);
        
        if (existingAttr && !pluginOptions.overwrite) {
          // Track existing ID to avoid collisions
          if (existingAttr.value && t.isStringLiteral(existingAttr.value)) {
            usedIds.add(existingAttr.value.value);
          }
          return;
        }
        
        // Generate ID based on strategy
        const id = generateJsxId(
          elementName,
          path,
          state,
          pluginOptions
        );
        
        // Ensure uniqueness
        const uniqueId = ensureUniqueId(id, usedIds);
        
        // Create or update the attribute
        if (existingAttr && pluginOptions.overwrite) {
          // Update existing attribute
          existingAttr.value = t.stringLiteral(uniqueId);
        } else {
          // Add new attribute
          const newAttr = t.jsxAttribute(
            t.jsxIdentifier(pluginOptions.attr),
            t.stringLiteral(uniqueId)
          );
          
          node.attributes.push(newAttr);
        }
      }
    }
  };
}

/**
 * Check if element is a host element (lowercase tag name)
 * @param {String} name - Element name
 * @returns {Boolean}
 */
function isHostElement(name) {
  return name && name[0] === name[0].toLowerCase();
}

/**
 * Get element name from JSX name node
 * @param {Object} nameNode - JSX name node
 * @returns {String}
 */
function getElementName(nameNode) {
  if (nameNode.type === 'JSXIdentifier') {
    return nameNode.name;
  }
  if (nameNode.type === 'JSXMemberExpression') {
    // Handle namespaced elements like <svg:circle>
    return getElementName(nameNode.property);
  }
  return '';
}

/**
 * Find attribute by name
 * @param {Object} node - JSX opening element
 * @param {String} attrName - Attribute name to find
 * @returns {Object|null}
 */
function findAttribute(node, attrName) {
  return node.attributes.find(attr => {
    return attr.type === 'JSXAttribute' &&
           attr.name.type === 'JSXIdentifier' &&
           attr.name.name === attrName;
  });
}

/**
 * Generate ID for JSX element
 * @param {String} elementName - Element name
 * @param {Object} path - Babel path
 * @param {Object} state - Plugin state
 * @param {Object} options - Plugin options
 * @returns {String}
 */
function generateJsxId(elementName, path, state, options) {
  const { strategy, prefix } = options;
  
  switch (strategy) {
    case 'slug':
      return generateSlugId(elementName, path, prefix);
      
    case 'path':
      return generatePathId(elementName, path, state, prefix);
      
    case 'hash':
    default:
      return generateHashId(elementName, path, state, prefix);
  }
}

/**
 * Generate hash-based ID
 * @param {String} elementName - Element name
 * @param {Object} path - Babel path
 * @param {Object} state - Plugin state
 * @param {String} prefix - ID prefix
 * @returns {String}
 */
function generateHashId(elementName, path, state, prefix) {
  // Create path array for consistency with id-generator
  const pathArray = [];
  let currentPath = path;
  while (currentPath && currentPath.parent) {
    if (currentPath.parent.type === 'JSXElement') {
      pathArray.unshift(state.nodeCounter);
    }
    currentPath = currentPath.parentPath;
  }
  state.nodeCounter++;
  
  // Create node object for id-generator
  const node = {
    type: elementName,
    position: path.node.loc ? {
      start: {
        line: path.node.loc.start.line,
        column: path.node.loc.start.column
      }
    } : null
  };
  
  return generateId(node, { strategy: 'hash', prefix }, pathArray, new Set());
}

/**
 * Generate slug-based ID from element text content
 * @param {String} elementName - Element name
 * @param {Object} path - Babel path
 * @param {String} prefix - ID prefix
 * @returns {String}
 */
function generateSlugId(elementName, path, prefix) {
  // Try to extract text content from JSX children
  const textContent = extractJsxTextContent(path);
  
  if (textContent) {
    const slug = textContent
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 30);
    
    return `${prefix}${slug}`;
  }
  
  // Fallback to element name if no text content
  return `${prefix}${elementName}`;
}

/**
 * Generate path-based ID
 * @param {String} elementName - Element name
 * @param {Object} path - Babel path
 * @param {Object} state - Plugin state
 * @param {String} prefix - ID prefix
 * @returns {String}
 */
function generatePathId(elementName, path, state, prefix) {
  // Build path indices
  const indices = [];
  let currentPath = path;
  
  while (currentPath && currentPath.parent) {
    if (currentPath.parent.type === 'JSXElement') {
      const siblings = currentPath.parent.children || [];
      const index = siblings.indexOf(currentPath.node);
      if (index !== -1) {
        indices.unshift(index);
      }
    }
    currentPath = currentPath.parentPath;
  }
  
  const pathString = indices.length > 0 ? `-${indices.join('-')}` : '';
  return `${prefix}${elementName}${pathString}`;
}

/**
 * Extract text content from JSX element
 * @param {Object} path - Babel path
 * @returns {String}
 */
function extractJsxTextContent(path) {
  // Get the parent JSX element to access children
  const parentPath = path.parentPath;
  if (!parentPath || parentPath.node.type !== 'JSXElement') {
    return '';
  }
  
  const children = parentPath.node.children || [];
  const textParts = [];
  
  for (const child of children) {
    if (child.type === 'JSXText') {
      const text = child.value.trim();
      if (text) {
        textParts.push(text);
      }
    } else if (child.type === 'JSXExpressionContainer') {
      // Handle simple string literals in expressions
      if (child.expression && child.expression.type === 'StringLiteral') {
        textParts.push(child.expression.value);
      }
    }
  }
  
  return textParts.join(' ');
}

