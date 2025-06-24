// Utility node exports
export { default as emailSendNode } from './email-send.node.js';
export { default as databaseQueryNode } from './database-query.node.js';
export { default as debugNode } from './debug.node.js';

// Collection of all utility nodes
import emailSendNode from './email-send.node.js';
import databaseQueryNode from './database-query.node.js';
import debugNode from './debug.node.js';

export const utilityNodes = [
    emailSendNode,
    databaseQueryNode,
    debugNode
];

export default utilityNodes;