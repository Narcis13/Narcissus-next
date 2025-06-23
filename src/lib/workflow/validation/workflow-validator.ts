import Ajv from "ajv";
import addFormats from "ajv-formats";
import { Workflow, WorkflowValidationResult, WorkflowValidationError, WorkflowValidationWarning } from "../types/workflow";
import { NodeDefinition } from "../types/node";
import { ConnectionValidator } from "./connection-validator";
import workflowSchema from "../schemas/workflow.schema.json";

/**
 * Comprehensive workflow validator
 */
export class WorkflowValidator {
  private ajv: Ajv;
  private validateSchema: any;
  private nodeDefinitions: Map<string, NodeDefinition>;
  private connectionValidator: ConnectionValidator;

  constructor(nodeDefinitions: Map<string, NodeDefinition>) {
    // Initialize AJV with formats
    this.ajv = new Ajv({ allErrors: true, verbose: true });
    addFormats(this.ajv);
    
    // Compile schema
    this.validateSchema = this.ajv.compile(workflowSchema);
    
    // Store node definitions
    this.nodeDefinitions = nodeDefinitions;
    
    // Initialize connection validator
    this.connectionValidator = new ConnectionValidator(nodeDefinitions);
  }

  /**
   * Validate a workflow
   */
  validate(workflow: Workflow): WorkflowValidationResult {
    const errors: WorkflowValidationError[] = [];
    const warnings: WorkflowValidationWarning[] = [];

    // 1. Schema validation
    const schemaResult = this.validateAgainstSchema(workflow);
    errors.push(...schemaResult.errors);

    // 2. Node validation
    const nodeResult = this.validateNodes(workflow);
    errors.push(...nodeResult.errors);
    warnings.push(...nodeResult.warnings);

    // 3. Connection validation
    const connectionResult = this.connectionValidator.validateWorkflow(workflow);
    errors.push(...connectionResult.errors.map(e => ({
      type: e.type,
      message: e.message,
      connectionId: e.connectionId,
    })));
    warnings.push(...(connectionResult.warnings || []).map(w => ({
      type: w.type,
      message: w.message,
      connectionId: w.connectionId,
    })));

    // 4. Required field validation
    const requiredResult = this.validateRequiredFields(workflow);
    errors.push(...requiredResult.errors);

    // 5. Variable validation
    const variableResult = this.validateVariables(workflow);
    errors.push(...variableResult.errors);
    warnings.push(...variableResult.warnings);

    // 6. Input/Output validation
    const ioResult = this.validateInputsOutputs(workflow);
    errors.push(...ioResult.errors);
    warnings.push(...ioResult.warnings);

    // 7. Trigger validation
    const triggerResult = this.validateTriggers(workflow);
    errors.push(...triggerResult.errors);
    warnings.push(...triggerResult.warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate against JSON schema
   */
  private validateAgainstSchema(workflow: Workflow): {
    errors: WorkflowValidationError[];
  } {
    const errors: WorkflowValidationError[] = [];

    if (!this.validateSchema(workflow)) {
      for (const error of this.validateSchema.errors || []) {
        errors.push({
          type: "schema_validation",
          message: error.message || "Schema validation error",
          path: error.instancePath,
        });
      }
    }

    return { errors };
  }

  /**
   * Validate nodes
   */
  private validateNodes(workflow: Workflow): {
    errors: WorkflowValidationError[];
    warnings: WorkflowValidationWarning[];
  } {
    const errors: WorkflowValidationError[] = [];
    const warnings: WorkflowValidationWarning[] = [];
    const nodeIds = new Set<string>();

    for (const node of workflow.nodes) {
      // Check for duplicate node IDs
      if (nodeIds.has(node.id)) {
        errors.push({
          type: "duplicate_node_id",
          message: `Duplicate node ID: ${node.id}`,
          nodeId: node.id,
        });
      }
      nodeIds.add(node.id);

      // Check node definition exists
      const nodeDef = this.nodeDefinitions.get(node.nodeId);
      if (!nodeDef) {
        errors.push({
          type: "unknown_node_type",
          message: `Unknown node type: ${node.nodeId}`,
          nodeId: node.id,
        });
        continue;
      }

      // Validate node inputs
      const inputResult = this.validateNodeInputs(node, nodeDef);
      errors.push(...inputResult.errors);
      warnings.push(...inputResult.warnings);
    }

    return { errors, warnings };
  }

  /**
   * Validate node inputs
   */
  private validateNodeInputs(
    node: any,
    nodeDef: NodeDefinition
  ): {
    errors: WorkflowValidationError[];
    warnings: WorkflowValidationWarning[];
  } {
    const errors: WorkflowValidationError[] = [];
    const warnings: WorkflowValidationWarning[] = [];

    // Check required inputs
    for (const input of nodeDef.inputs) {
      if (input.required && !(input.name in node.inputs)) {
        errors.push({
          type: "missing_required_input",
          message: `Missing required input '${input.name}' on node '${node.id}'`,
          nodeId: node.id,
          path: `nodes.${node.id}.inputs.${input.name}`,
        });
      }

      // Validate input values if present
      if (input.name in node.inputs) {
        const value = node.inputs[input.name];
        
        // Skip validation for template references
        if (typeof value === "string" && value.startsWith("${")) {
          continue;
        }

        // Type validation
        if (input.validation) {
          const validationResult = this.validateInputValue(
            value,
            input.type,
            input.validation
          );
          if (!validationResult.valid) {
            errors.push({
              type: "invalid_input_value",
              message: `Invalid value for input '${input.name}': ${validationResult.message}`,
              nodeId: node.id,
              path: `nodes.${node.id}.inputs.${input.name}`,
            });
          }
        }
      }
    }

    // Check for unknown inputs
    for (const inputName of Object.keys(node.inputs)) {
      if (!nodeDef.inputs.find(i => i.name === inputName)) {
        warnings.push({
          type: "unknown_input",
          message: `Unknown input '${inputName}' on node '${node.id}'`,
          nodeId: node.id,
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate input value
   */
  private validateInputValue(
    value: any,
    type: string,
    validation: any
  ): { valid: boolean; message?: string } {
    // Type checking
    const actualType = Array.isArray(value) ? "array" : typeof value;
    if (type !== "any" && actualType !== type) {
      return {
        valid: false,
        message: `Expected ${type}, got ${actualType}`,
      };
    }

    // Validation rules
    if (validation.min !== undefined && value < validation.min) {
      return {
        valid: false,
        message: `Value must be at least ${validation.min}`,
      };
    }

    if (validation.max !== undefined && value > validation.max) {
      return {
        valid: false,
        message: `Value must be at most ${validation.max}`,
      };
    }

    if (validation.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        return {
          valid: false,
          message: `Value does not match pattern ${validation.pattern}`,
        };
      }
    }

    if (validation.enum && !validation.enum.includes(value)) {
      return {
        valid: false,
        message: `Value must be one of: ${validation.enum.join(", ")}`,
      };
    }

    if (validation.custom) {
      const result = validation.custom(value);
      if (typeof result === "string") {
        return { valid: false, message: result };
      } else if (!result) {
        return { valid: false, message: "Custom validation failed" };
      }
    }

    return { valid: true };
  }

  /**
   * Validate required fields
   */
  private validateRequiredFields(workflow: Workflow): {
    errors: WorkflowValidationError[];
  } {
    const errors: WorkflowValidationError[] = [];

    // Check workflow-level required fields
    if (!workflow.id) {
      errors.push({
        type: "missing_required_field",
        message: "Workflow ID is required",
        path: "id",
      });
    }

    if (!workflow.name) {
      errors.push({
        type: "missing_required_field",
        message: "Workflow name is required",
        path: "name",
      });
    }

    if (!workflow.version) {
      errors.push({
        type: "missing_required_field",
        message: "Workflow version is required",
        path: "version",
      });
    }

    if (!workflow.nodes || workflow.nodes.length === 0) {
      errors.push({
        type: "missing_required_field",
        message: "Workflow must have at least one node",
        path: "nodes",
      });
    }

    return { errors };
  }

  /**
   * Validate variables
   */
  private validateVariables(workflow: Workflow): {
    errors: WorkflowValidationError[];
    warnings: WorkflowValidationWarning[];
  } {
    const errors: WorkflowValidationError[] = [];
    const warnings: WorkflowValidationWarning[] = [];
    const variableNames = new Set<string>();

    for (const variable of workflow.variables || []) {
      // Check for duplicate variable names
      if (variableNames.has(variable.name)) {
        errors.push({
          type: "duplicate_variable",
          message: `Duplicate variable name: ${variable.name}`,
          path: `variables.${variable.name}`,
        });
      }
      variableNames.add(variable.name);

      // Validate default value type
      if (variable.defaultValue !== undefined) {
        const valueType = Array.isArray(variable.defaultValue)
          ? "array"
          : typeof variable.defaultValue;
        if (valueType !== variable.type && variable.type !== "any") {
          warnings.push({
            type: "variable_type_mismatch",
            message: `Variable '${variable.name}' default value type mismatch`,
            path: `variables.${variable.name}`,
          });
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate inputs and outputs
   */
  private validateInputsOutputs(workflow: Workflow): {
    errors: WorkflowValidationError[];
    warnings: WorkflowValidationWarning[];
  } {
    const errors: WorkflowValidationError[] = [];
    const warnings: WorkflowValidationWarning[] = [];

    // Validate workflow inputs
    const inputNames = new Set<string>();
    for (const input of workflow.inputs || []) {
      if (inputNames.has(input.name)) {
        errors.push({
          type: "duplicate_input",
          message: `Duplicate input name: ${input.name}`,
          path: `inputs.${input.name}`,
        });
      }
      inputNames.add(input.name);
    }

    // Validate workflow outputs
    const outputNames = new Set<string>();
    for (const output of workflow.outputs || []) {
      if (outputNames.has(output.name)) {
        errors.push({
          type: "duplicate_output",
          message: `Duplicate output name: ${output.name}`,
          path: `outputs.${output.name}`,
        });
      }
      outputNames.add(output.name);

      // Validate output source
      const sourcePattern = /^([a-zA-Z0-9-_]+)\.([a-zA-Z0-9-_]+)$/;
      if (!sourcePattern.test(output.source)) {
        errors.push({
          type: "invalid_output_source",
          message: `Invalid output source format: ${output.source}`,
          path: `outputs.${output.name}`,
        });
      } else {
        const [nodeId, outputName] = output.source.split(".");
        const node = workflow.nodes.find(n => n.id === nodeId);
        if (!node) {
          errors.push({
            type: "invalid_output_source",
            message: `Output source references non-existent node: ${nodeId}`,
            path: `outputs.${output.name}`,
          });
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate triggers
   */
  private validateTriggers(workflow: Workflow): {
    errors: WorkflowValidationError[];
    warnings: WorkflowValidationWarning[];
  } {
    const errors: WorkflowValidationError[] = [];
    const warnings: WorkflowValidationWarning[] = [];
    const triggerIds = new Set<string>();

    for (const trigger of workflow.triggers || []) {
      // Check for duplicate trigger IDs
      if (triggerIds.has(trigger.id)) {
        errors.push({
          type: "duplicate_trigger",
          message: `Duplicate trigger ID: ${trigger.id}`,
          path: `triggers.${trigger.id}`,
        });
      }
      triggerIds.add(trigger.id);

      // Validate trigger-specific configuration
      const configResult = this.validateTriggerConfig(trigger);
      errors.push(...configResult.errors);
      warnings.push(...configResult.warnings);
    }

    return { errors, warnings };
  }

  /**
   * Validate trigger configuration
   */
  private validateTriggerConfig(trigger: any): {
    errors: WorkflowValidationError[];
    warnings: WorkflowValidationWarning[];
  } {
    const errors: WorkflowValidationError[] = [];
    const warnings: WorkflowValidationWarning[] = [];

    switch (trigger.type) {
      case "schedule":
        if (!trigger.config.cron) {
          errors.push({
            type: "invalid_trigger_config",
            message: "Schedule trigger requires cron expression",
            path: `triggers.${trigger.id}.config`,
          });
        }
        break;

      case "webhook":
        if (!trigger.config.path) {
          errors.push({
            type: "invalid_trigger_config",
            message: "Webhook trigger requires path",
            path: `triggers.${trigger.id}.config`,
          });
        }
        break;

      case "email":
        if (!trigger.config.address) {
          errors.push({
            type: "invalid_trigger_config",
            message: "Email trigger requires address",
            path: `triggers.${trigger.id}.config`,
          });
        }
        break;
    }

    return { errors, warnings };
  }
}