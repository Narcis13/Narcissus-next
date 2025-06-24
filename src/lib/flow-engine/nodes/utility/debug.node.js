/** @type {import('../../types/flow-types.jsdoc.js').NodeDefinition} */
export default {
    id: "utility.debug.enhanced",
    version: "1.0.0",
    name: "Enhanced Debug",
    description: "Advanced debugging node with data inspection, breakpoints, performance tracking, and structured logging.",
    categories: ["Utilities", "Debugging", "Development"],
    tags: ["debug", "log", "inspect", "breakpoint", "trace", "monitor", "performance"],
    inputs: [
        { 
            name: "data", 
            type: "any", 
            description: "Data to debug/inspect", 
            required: false, 
            example: "${workflow_state}"
        },
        { 
            name: "label", 
            type: "string", 
            description: "Label for this debug point", 
            required: false, 
            example: "After API Call"
        },
        { 
            name: "level", 
            type: "string", 
            description: "Log level", 
            required: false, 
            defaultValue: "debug",
            enum: ["trace", "debug", "info", "warn", "error"],
            example: "debug"
        },
        { 
            name: "mode", 
            type: "string", 
            description: "Debug mode", 
            required: false, 
            defaultValue: "log",
            enum: ["log", "inspect", "breakpoint", "trace", "performance", "memory"],
            example: "inspect"
        },
        { 
            name: "includeState", 
            type: "boolean", 
            description: "Include full workflow state in output", 
            required: false, 
            defaultValue: false,
            example: true
        },
        { 
            name: "includeContext", 
            type: "boolean", 
            description: "Include execution context info", 
            required: false, 
            defaultValue: false,
            example: true
        },
        { 
            name: "inspectDepth", 
            type: "number", 
            description: "Depth for object inspection", 
            required: false, 
            defaultValue: 3,
            example: 5
        },
        { 
            name: "format", 
            type: "string", 
            description: "Output format", 
            required: false, 
            defaultValue: "pretty",
            enum: ["pretty", "json", "compact", "table"],
            example: "json"
        },
        { 
            name: "conditions", 
            type: "object", 
            description: "Conditional debugging (only log if conditions met)", 
            required: false, 
            example: { "path": "user.role", "operator": "==", "value": "admin" }
        },
        { 
            name: "capture", 
            type: "array", 
            description: "Specific state paths to capture", 
            required: false, 
            example: ["user.id", "order.total", "errors"]
        }
    ],
    outputs: [
        { 
            name: "debugInfo", 
            type: "object", 
            description: "Complete debug information" 
        },
        { 
            name: "timestamp", 
            type: "number", 
            description: "Debug timestamp" 
        },
        { 
            name: "executionTime", 
            type: "number", 
            description: "Time since flow start (ms)" 
        },
        { 
            name: "memoryUsage", 
            type: "object", 
            description: "Memory usage stats" 
        }
    ],
    edges: [
        { 
            name: "continue", 
            description: "Continue workflow execution", 
            outputType: "object" 
        },
        { 
            name: "break", 
            description: "Breakpoint hit (only in breakpoint mode)", 
            outputType: "object" 
        }
    ],
    implementation: async function(params) {
        const { 
            data, 
            label = 'Debug Point',
            level = 'debug',
            mode = 'log',
            includeState = false,
            includeContext = false,
            inspectDepth = 3,
            format = 'pretty',
            conditions,
            capture = []
        } = params;
        
        const timestamp = Date.now();
        const flowStartTime = this.state.get('_flowStartTime') || timestamp;
        const executionTime = timestamp - flowStartTime;
        
        // Check conditions if specified
        if (conditions) {
            const checkValue = this.state.get(conditions.path);
            let conditionMet = false;
            
            switch (conditions.operator) {
                case '==': conditionMet = checkValue == conditions.value; break;
                case '!=': conditionMet = checkValue != conditions.value; break;
                case '>': conditionMet = checkValue > conditions.value; break;
                case '<': conditionMet = checkValue < conditions.value; break;
                case '>=': conditionMet = checkValue >= conditions.value; break;
                case '<=': conditionMet = checkValue <= conditions.value; break;
                case 'contains': conditionMet = String(checkValue).includes(conditions.value); break;
                case 'exists': conditionMet = checkValue !== undefined; break;
                case 'empty': conditionMet = !checkValue || checkValue.length === 0; break;
            }
            
            if (!conditionMet) {
                // Skip debug output
                return "continue";
            }
        }
        
        // Build debug info
        const debugInfo = {
            label,
            timestamp,
            executionTime,
            flowInstanceId: this.flowInstanceId || 'N/A',
            mode,
            level
        };
        
        // Add data
        if (data !== undefined) {
            debugInfo.data = data;
        }
        
        // Add input from previous node
        if (this.input !== undefined) {
            debugInfo.previousNodeOutput = this.input;
        }
        
        // Include state if requested
        if (includeState) {
            debugInfo.state = this.state.getAll ? this.state.getAll() : 'State not available';
        }
        
        // Include context if requested
        if (includeContext) {
            debugInfo.context = {
                flowInstanceId: this.flowInstanceId,
                nodeId: this.nodeId || 'unknown',
                iteration: this.iteration || 0
            };
        }
        
        // Capture specific state paths
        if (capture.length > 0) {
            debugInfo.captured = {};
            for (const path of capture) {
                debugInfo.captured[path] = this.state.get(path);
            }
        }
        
        // Mode-specific operations
        switch (mode) {
            case 'inspect':
                // Deep inspection with util.inspect equivalent
                const inspect = (obj, depth = inspectDepth) => {
                    if (depth === 0) return '[Max Depth]';
                    if (obj === null) return 'null';
                    if (obj === undefined) return 'undefined';
                    if (typeof obj !== 'object') return obj;
                    
                    if (Array.isArray(obj)) {
                        return obj.map(item => inspect(item, depth - 1));
                    }
                    
                    const result = {};
                    for (const [key, value] of Object.entries(obj)) {
                        try {
                            result[key] = inspect(value, depth - 1);
                        } catch (e) {
                            result[key] = `[Error: ${e.message}]`;
                        }
                    }
                    return result;
                };
                
                debugInfo.inspected = inspect(data);
                break;
                
            case 'trace':
                // Stack trace capture
                const trace = new Error().stack;
                debugInfo.stackTrace = trace.split('\n').slice(2).join('\n');
                break;
                
            case 'performance':
                // Performance metrics
                if (global.process && global.process.hrtime) {
                    const hrtime = process.hrtime();
                    debugInfo.performance = {
                        hrtime: hrtime[0] * 1000 + hrtime[1] / 1000000,
                        executionTime
                    };
                }
                break;
                
            case 'memory':
                // Memory usage
                if (global.process && global.process.memoryUsage) {
                    const mem = process.memoryUsage();
                    debugInfo.memoryUsage = {
                        heapUsed: Math.round(mem.heapUsed / 1024 / 1024 * 100) / 100 + ' MB',
                        heapTotal: Math.round(mem.heapTotal / 1024 / 1024 * 100) / 100 + ' MB',
                        external: Math.round(mem.external / 1024 / 1024 * 100) / 100 + ' MB',
                        rss: Math.round(mem.rss / 1024 / 1024 * 100) / 100 + ' MB'
                    };
                }
                break;
                
            case 'breakpoint':
                // Simulate breakpoint
                console.log('\n🔴 BREAKPOINT HIT 🔴');
                console.log(`Location: ${label}`);
                console.log(`Flow Instance: ${this.flowInstanceId}`);
                console.log('Debug Info:', debugInfo);
                
                // In a real implementation, this could pause execution
                // For now, we'll just return a special edge
                return {
                    break: () => debugInfo
                };
        }
        
        // Format and output based on format type
        let output;
        switch (format) {
            case 'json':
                output = JSON.stringify(debugInfo, null, 2);
                break;
                
            case 'compact':
                output = JSON.stringify(debugInfo);
                break;
                
            case 'table':
                // Simple table format for flat data
                if (data && typeof data === 'object' && !Array.isArray(data)) {
                    console.log(`\n┌─ ${label} ─┐`);
                    console.table(data);
                    console.log('└────────────┘\n');
                }
                output = debugInfo;
                break;
                
            case 'pretty':
            default:
                // Pretty print with colors (if supported)
                const separator = '═'.repeat(50);
                console.log(`\n╔${separator}╗`);
                console.log(`║ ${label.padEnd(48)} ║`);
                console.log(`╠${separator}╣`);
                console.log(`║ Time: ${new Date(timestamp).toISOString().padEnd(41)} ║`);
                console.log(`║ Execution Time: ${(executionTime + 'ms').padEnd(31)} ║`);
                console.log(`║ Flow Instance: ${this.flowInstanceId.padEnd(32)} ║`);
                console.log(`╚${separator}╝`);
                
                if (data !== undefined) {
                    console.log('\nData:');
                    console.log(JSON.stringify(data, null, 2));
                }
                
                output = debugInfo;
                break;
        }
        
        // Log based on level
        switch (level) {
            case 'trace':
                if (console.trace) console.trace(output);
                else console.log('[TRACE]', output);
                break;
            case 'debug':
                if (console.debug) console.debug('[DEBUG]', output);
                else console.log('[DEBUG]', output);
                break;
            case 'info':
                console.info('[INFO]', output);
                break;
            case 'warn':
                console.warn('[WARN]', output);
                break;
            case 'error':
                console.error('[ERROR]', output);
                break;
        }
        
        // Store debug history in state
        const debugHistory = this.state.get('_debugHistory') || [];
        debugHistory.push({
            label,
            timestamp,
            level,
            mode
        });
        
        // Keep only last 100 debug entries
        if (debugHistory.length > 100) {
            debugHistory.shift();
        }
        
        this.state.set('_debugHistory', debugHistory);
        this.state.set('_lastDebug', {
            label,
            timestamp,
            data: data !== undefined ? data : null
        });
        
        // Return debug info and continue
        return {
            continue: () => ({
                debugInfo,
                timestamp,
                executionTime,
                memoryUsage: debugInfo.memoryUsage || null
            })
        };
    },
    aiPromptHints: {
        toolName: "enhanced_debug",
        summary: "Advanced debugging with inspection, breakpoints, performance tracking, and conditional logging",
        useCase: "Use for detailed debugging, performance analysis, state inspection, and troubleshooting complex workflows",
        expectedInputFormat: "Provide optional 'data' to debug, 'label' for identification, and configure mode/options as needed",
        outputDescription: "Returns debug information via 'continue' edge, or 'break' edge for breakpoints",
        examples: [
            "Inspect complex data structures",
            "Set conditional breakpoints",
            "Track performance bottlenecks",
            "Monitor memory usage",
            "Trace execution flow",
            "Debug specific state values"
        ]
    }
};