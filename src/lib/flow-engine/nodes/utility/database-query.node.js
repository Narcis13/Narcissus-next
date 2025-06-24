/** @type {import('../../types/flow-types.jsdoc.js').NodeDefinition} */
export default {
    id: "utility.database.query",
    version: "1.0.0",
    name: "Database Query",
    description: "Executes PostgreSQL queries with parameterized inputs, connection pooling, and transaction support.",
    categories: ["Utilities", "Database", "Integration"],
    tags: ["database", "postgresql", "query", "sql", "data", "crud"],
    inputs: [
        { 
            name: "connectionString", 
            type: "string", 
            description: "PostgreSQL connection string (use state variable for security)", 
            required: true, 
            example: "${database_url}"
        },
        { 
            name: "query", 
            type: "string", 
            description: "SQL query to execute. Use $1, $2, etc. for parameters", 
            required: true, 
            example: "SELECT * FROM users WHERE id = $1"
        },
        { 
            name: "params", 
            type: "array", 
            description: "Array of parameters for the query", 
            required: false, 
            example: [123, "active"]
        },
        { 
            name: "queryType", 
            type: "string", 
            description: "Type of query operation", 
            required: false, 
            defaultValue: "select",
            enum: ["select", "insert", "update", "delete", "raw"],
            example: "select"
        },
        { 
            name: "transaction", 
            type: "boolean", 
            description: "Execute within a transaction", 
            required: false, 
            defaultValue: false,
            example: false
        },
        { 
            name: "timeout", 
            type: "number", 
            description: "Query timeout in milliseconds", 
            required: false, 
            defaultValue: 30000,
            example: 5000
        },
        { 
            name: "poolConfig", 
            type: "object", 
            description: "Connection pool configuration", 
            required: false, 
            example: { "max": 20, "idleTimeoutMillis": 30000 }
        }
    ],
    outputs: [
        { 
            name: "rows", 
            type: "array", 
            description: "Array of result rows for SELECT queries" 
        },
        { 
            name: "rowCount", 
            type: "number", 
            description: "Number of rows affected" 
        },
        { 
            name: "fields", 
            type: "array", 
            description: "Field metadata for SELECT queries" 
        },
        { 
            name: "insertedId", 
            type: "any", 
            description: "ID of inserted row (for INSERT with RETURNING)" 
        },
        { 
            name: "executionTime", 
            type: "number", 
            description: "Query execution time in milliseconds" 
        }
    ],
    edges: [
        { 
            name: "success", 
            description: "Query executed successfully", 
            outputType: "object" 
        },
        { 
            name: "error", 
            description: "Query execution failed", 
            outputType: "object" 
        }
    ],
    implementation: async function(params) {
        const { 
            connectionString, 
            query, 
            params: queryParams = [], 
            queryType = 'select',
            transaction = false,
            timeout = 30000,
            poolConfig = {}
        } = params;
        
        // Import pg dynamically to avoid issues if not installed
        let pg;
        try {
            pg = await import('pg');
        } catch (error) {
            console.error('[Database Query Node] PostgreSQL driver not installed. Run: npm install pg');
            return {
                error: () => ({
                    error: 'PostgreSQL driver not installed',
                    message: 'Please install pg package: npm install pg',
                    code: 'DRIVER_NOT_FOUND'
                })
            };
        }
        
        const { Pool } = pg.default || pg;
        const startTime = Date.now();
        
        // Connection pool instance (could be cached in production)
        let pool;
        let client;
        
        try {
            // Validate required fields
            if (!connectionString || connectionString.trim() === '') {
                throw new Error('Database connection string is required');
            }
            
            if (!query || query.trim() === '') {
                throw new Error('SQL query is required');
            }
            
            // Validate query type
            const validQueryTypes = ['select', 'insert', 'update', 'delete', 'raw'];
            if (!validQueryTypes.includes(queryType.toLowerCase())) {
                throw new Error(`Invalid query type: ${queryType}`);
            }
            
            // Create connection pool
            pool = new Pool({
                connectionString,
                max: poolConfig.max || 20,
                idleTimeoutMillis: poolConfig.idleTimeoutMillis || 30000,
                connectionTimeoutMillis: poolConfig.connectionTimeoutMillis || 2000,
                ...poolConfig
            });
            
            // Log query info (without sensitive data)
            if (this.flowInstanceId) {
                const queryPreview = query.substring(0, 50) + (query.length > 50 ? '...' : '');
                console.log(`[Flow ${this.flowInstanceId}] Executing ${queryType} query: ${queryPreview}`);
            }
            
            // Get client from pool
            client = await pool.connect();
            
            let result;
            
            if (transaction) {
                // Start transaction
                await client.query('BEGIN');
                
                try {
                    // Execute query with timeout
                    result = await Promise.race([
                        client.query(query, queryParams),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Query timeout')), timeout)
                        )
                    ]);
                    
                    // Commit transaction
                    await client.query('COMMIT');
                } catch (error) {
                    // Rollback on error
                    await client.query('ROLLBACK');
                    throw error;
                }
            } else {
                // Execute query without transaction
                result = await Promise.race([
                    client.query(query, queryParams),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Query timeout')), timeout)
                    )
                ]);
            }
            
            const executionTime = Date.now() - startTime;
            
            // Process results based on query type
            let output = {
                rowCount: result.rowCount,
                executionTime,
                queryType
            };
            
            switch (queryType.toLowerCase()) {
                case 'select':
                    output.rows = result.rows;
                    output.fields = result.fields?.map(f => ({
                        name: f.name,
                        dataType: f.dataTypeID,
                        tableID: f.tableID,
                        columnID: f.columnID
                    }));
                    break;
                    
                case 'insert':
                    output.rows = result.rows; // For RETURNING clause
                    if (result.rows && result.rows.length > 0) {
                        // Extract first returned ID if available
                        const firstRow = result.rows[0];
                        output.insertedId = firstRow.id || firstRow[Object.keys(firstRow)[0]];
                    }
                    break;
                    
                case 'update':
                case 'delete':
                    output.rows = result.rows; // For RETURNING clause
                    break;
                    
                case 'raw':
                    // Return full result object for raw queries
                    output = {
                        ...result,
                        executionTime
                    };
                    break;
            }
            
            // Store query info in state
            this.state.set('lastDatabaseQuery', {
                queryType,
                rowCount: result.rowCount,
                executionTime,
                timestamp: Date.now()
            });
            
            // Log success
            if (this.flowInstanceId) {
                console.log(`[Flow ${this.flowInstanceId}] Query executed successfully: ${result.rowCount} rows affected in ${executionTime}ms`);
            }
            
            return {
                success: () => output
            };
            
        } catch (error) {
            const executionTime = Date.now() - startTime;
            console.error(`[Database Query Node] Error: ${error.message}`);
            
            // Parse PostgreSQL error codes
            let errorCode = error.code || 'UNKNOWN';
            let errorDetail = error.detail || '';
            let errorHint = error.hint || '';
            
            return {
                error: () => ({
                    error: error.message,
                    code: errorCode,
                    detail: errorDetail,
                    hint: errorHint,
                    queryType,
                    executionTime,
                    stack: error.stack
                })
            };
        } finally {
            // Always release the client back to the pool
            if (client) {
                client.release();
            }
            
            // End the pool
            if (pool) {
                await pool.end();
            }
        }
    },
    aiPromptHints: {
        toolName: "database_query",
        summary: "Executes PostgreSQL queries with full parameter support and connection pooling",
        useCase: "Use for any database operations: SELECT, INSERT, UPDATE, DELETE, complex queries, transactions",
        expectedInputFormat: "Provide 'connectionString' and 'query' with optional parameters array. Use $1, $2 placeholders for safe parameterized queries.",
        outputDescription: "Returns query results via 'success' edge with rows, rowCount, and metadata, or error details via 'error' edge",
        examples: [
            "Select users with conditions",
            "Insert new records with RETURNING",
            "Update records in transaction",
            "Complex joins and aggregations",
            "Batch operations"
        ]
    }
};