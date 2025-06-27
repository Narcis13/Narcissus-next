// Simple utility functions for FlowManager workflows
// These provide shorthand alternatives to full node definitions

export const log = function(params) {
  const message = params.message || params;
  const level = params.level || "info";
  const flowInstanceId = this.flowInstanceId || 'N/A';
  
  switch(level) {
    case "warn": 
      console.warn(`[FlowLog FW:${flowInstanceId}]:`, message); 
      break;
    case "error": 
      console.error(`[FlowLog FW:${flowInstanceId}]:`, message); 
      break;
    case "debug": 
      console.debug(`[FlowLog FW:${flowInstanceId}]:`, message); 
      break;
    default: 
      console.log(`[FlowLog FW:${flowInstanceId}]:`, message);
  }
  
  return "pass";
};

export const delay = async function(params) {
  const ms = params.ms || params || 1000;
  await new Promise(resolve => setTimeout(resolve, ms));
  return "pass";
};

export const identity = function(params) {
  const value = params.value !== undefined ? params.value : params;
  return value;
};

// Register these as simple functions that can be used in workflows
export default {
  log,
  delay,
  identity
};