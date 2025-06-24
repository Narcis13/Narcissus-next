import { startWorker } from "./execution/worker";
import { nodeRegistry } from "../flow-engine/singletons";

async function main() {
  console.log("Starting Flow Execution Worker...");
  
  try {
    // Initialize node registry if needed
    console.log("Available nodes:", Object.keys(nodeRegistry.getScope()));
    
    // Start the worker
    const worker = startWorker();
    
    console.log("Flow Execution Worker is running");
    console.log("Press Ctrl+C to stop");
    
    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\nShutting down worker...");
      await worker?.close();
      process.exit(0);
    });
    
    process.on("SIGTERM", async () => {
      console.log("\nShutting down worker...");
      await worker?.close();
      process.exit(0);
    });
  } catch (error) {
    console.error("Failed to start worker:", error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main();
}