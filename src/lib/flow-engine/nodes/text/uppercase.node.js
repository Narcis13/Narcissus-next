export default {
  id: "text.transform.uppercase",
  version: "1.0.0",
  name: "Text to Uppercase",
  description: "Convert text to uppercase",
  categories: ["Text", "Transform"],
  tags: ["text", "string", "uppercase", "transform"],
  inputs: [
    {
      name: "text",
      type: "string",
      description: "The text to convert to uppercase",
      required: true,
      example: "hello world"
    }
  ],
  outputs: [
    {
      name: "uppercaseText",
      type: "string",
      description: "The text converted to uppercase"
    }
  ],
  edges: [
    {
      name: "success",
      description: "Text successfully converted",
      outputType: "string"
    }
  ],
  implementation: async function(params) {
    const { text } = params;
    
    // Handle various input types
    let inputText = text;
    if (typeof inputText !== 'string') {
      inputText = String(inputText || '');
    }
    
    const uppercaseText = inputText.toUpperCase();
    
    // Store in state
    this.state.set('lastUppercaseText', uppercaseText);
    
    return {
      success: () => uppercaseText
    };
  },
  aiPromptHints: {
    toolName: "text_to_uppercase",
    summary: "Converts any text to uppercase letters",
    useCase: "Use when you need to transform text to all capital letters",
    expectedInputFormat: "Provide 'text' parameter as a string",
    outputDescription: "Returns the uppercase version of the input text via 'success' edge"
  }
};