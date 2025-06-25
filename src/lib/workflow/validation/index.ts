/**
 * Central export for workflow validation
 */

// Export FlowManager validator as the main validator
export { FlowManagerValidator } from "./flowmanager-validator";
export { FlowManagerValidator as WorkflowValidator } from "./flowmanager-validator";

// Legacy validators (kept for reference but not used)


// Re-export validation types
export type {
  FlowManagerValidationResult as WorkflowValidationResult,
  FlowManagerValidationError as WorkflowValidationError,
  FlowManagerValidationWarning as WorkflowValidationWarning,
} from "../types/flowmanager-workflow";

// Legacy types
export type {
  WorkflowValidationResult as LegacyWorkflowValidationResult,
  WorkflowValidationError as LegacyWorkflowValidationError,
  WorkflowValidationWarning as LegacyWorkflowValidationWarning,
} from "../types/workflow";

export type {
  ConnectionValidationResult,
  ConnectionValidationError,
  ConnectionValidationWarning,
  ConnectionRules,
} from "../types/connection";