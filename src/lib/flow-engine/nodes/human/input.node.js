export default {
  id: "human.input.text",
  version: "1.0.0",
  name: "Human Text Input",
  description: "Request text input from a human user",
  categories: ["Human", "Input"],
  tags: ["human-in-the-loop", "input", "interaction", "pause"],
  inputs: [
    {
      name: "prompt",
      type: "string",
      description: "The prompt to show to the user",
      required: true,
      example: "Please enter your name"
    },
    {
      name: "placeholder",
      type: "string",
      description: "Placeholder text for the input field",
      required: false,
      example: "Type here..."
    },
    {
      name: "defaultValue",
      type: "string",
      description: "Default value for the input",
      required: false,
      example: ""
    },
    {
      name: "validation",
      type: "object",
      description: "Validation rules for the input",
      required: false,
      example: { minLength: 3, maxLength: 50, pattern: "^[a-zA-Z\\s]+$" }
    }
  ],
  outputs: [
    {
      name: "userInput",
      type: "string",
      description: "The text entered by the user"
    }
  ],
  edges: [
    {
      name: "submitted",
      description: "User submitted the input",
      outputType: "string"
    },
    {
      name: "cancelled",
      description: "User cancelled the input",
      outputType: "null"
    }
  ],
  implementation: async function(params) {
    const { prompt, placeholder, defaultValue, validation } = params;
    
    // Generate a unique pause ID for this request
    const pauseId = `human-input-${this.flowInstanceId}-${Date.now()}`;
    
    try {
      console.log(`[Human Input Node] Requesting pause with ID: ${pauseId}`);
      
      // Request human input through FlowHub
      const userResponse = await this.humanInput({
        type: "text-input",
        prompt: prompt || "Please enter text:",
        placeholder: placeholder || "",
        defaultValue: defaultValue || "",
        validation: validation || {},
        nodeId: this.self.id,
        flowInstanceId: this.flowInstanceId
      }, pauseId);

      // Check if user cancelled
      if (userResponse === null || userResponse === undefined || 
          (typeof userResponse === 'object' && userResponse.cancelled)) {
        return {
          cancelled: () => null
        };
      }

      // Extract the actual input value
      const userInput = typeof userResponse === 'object' && userResponse.value !== undefined 
        ? userResponse.value 
        : userResponse;

      // Store in state for later use
      this.state.set('lastHumanInput', userInput);

      return {
        submitted: () => userInput
      };
    } catch (error) {
      // If there's an error, treat it as cancelled
      console.error('Human input error:', error);
      return {
        cancelled: () => null
      };
    }
  },
  aiPromptHints: {
    toolName: "request_human_input",
    summary: "Pauses workflow execution to request text input from a human user",
    useCase: "Use when you need to collect information from a human during workflow execution",
    expectedInputFormat: "Provide 'prompt' as a string question or instruction",
    outputDescription: "Returns the user's input via 'submitted' edge, or null via 'cancelled' edge"
  }
};