export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: "automation" | "ai" | "data" | "integration";
  icon: string;
  workflow: {
    name: string;
    description: string;
    nodes: any[];
    initialState: Record<string, any>;
    variables?: Record<string, any>;
    config?: Record<string, any>;
  };
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: "basic-automation",
    name: "Basic Automation",
    description: "A simple workflow that fetches data, processes it, and sends notifications",
    category: "automation",
    icon: "⚡",
    workflow: {
      name: "Basic Automation Workflow",
      description: "Fetches data from an API, transforms it, and sends email notifications based on conditions",
      nodes: [
        // Fetch data from API
        {
          "HTTP GET Request": {
            url: "${apiUrl}",
            headers: {
              "Authorization": "Bearer ${apiKey}"
            }
          }
        },
        // Transform the data
        {
          "Transform Data": {
            operation: "extract",
            path: "data.items",
            transformations: [
              {
                from: "id",
                to: "itemId"
              },
              {
                from: "status",
                to: "currentStatus"
              }
            ]
          }
        },
        // Check condition
        "Check Condition",
        {
          "hasIssues": [
            // Send alert email
            {
              "Send Email": {
                to: "${alertEmail}",
                subject: "Alert: Issues Detected",
                body: "Found ${state.issueCount} issues in the latest data fetch."
              }
            }
          ],
          "success": [
            // Log success
            {
              "Log Info": {
                message: "Data processed successfully. No issues found."
              }
            }
          ]
        },
        // Add delay before next run
        {
          "Delay": {
            duration: 3600 // 1 hour
          }
        }
      ],
      initialState: {
        issueCount: 0,
        issueThreshold: 5,
        apiUrl: "https://api.example.com/data",
        apiKey: "your-api-key",
        alertEmail: "admin@example.com"
      }
    }
  },
  {
    id: "ai-chat-workflow",
    name: "AI Chat Workflow",
    description: "Process user messages through AI and respond intelligently",
    category: "ai",
    icon: "🤖",
    workflow: {
      name: "AI Chat Assistant",
      description: "Handles incoming messages, processes them with AI, and sends contextual responses",
      nodes: [
        // Receive webhook (chat message)
        {
          "Receive Webhook": {
            path: "/chat",
            method: "POST"
          }
        },
        // Extract message data
        {
          "Extract Data": {
            operation: "extract",
            transformations: [
              {
                from: "body.message",
                to: "userMessage"
              },
              {
                from: "body.userId",
                to: "userId"
              },
              {
                from: "body.conversationId",
                to: "conversationId"
              }
            ]
          }
        },
        // Get conversation history
        {
          "Database Query": {
            query: "SELECT * FROM conversations WHERE id = ${state.conversationId} ORDER BY created_at DESC LIMIT 10"
          }
        },
        // Prepare AI context
        {
          "Prepare AI Context": {
            operation: "custom",
            code: `
              const history = input.map(msg => ({
                role: msg.role,
                content: msg.content
              }));
              return {
                messages: [...history, {
                  role: 'user',
                  content: state.userMessage
                }]
              };
            `
          }
        },
        // Call AI model
        {
          "OpenAI Completion": {
            model: "gpt-4",
            messages: "${input.messages}",
            temperature: 0.7,
            max_tokens: 1000
          }
        },
        // Save response to database
        {
          "Database Insert": {
            table: "conversations",
            data: {
              conversation_id: "${state.conversationId}",
              user_id: "${state.userId}",
              role: "assistant",
              content: "${input.content}",
              created_at: "${new Date().toISOString()}"
            }
          }
        },
        // Send response back
        {
          "Webhook Response": {
            status: 200,
            body: {
              response: "${input.content}",
              conversationId: "${state.conversationId}"
            }
          }
        }
      ],
      initialState: {
        openaiApiKey: "your-openai-api-key",
        maxConversationLength: 10
      }
    }
  },
  {
    id: "data-processing",
    name: "Data Processing Pipeline",
    description: "ETL pipeline for processing and transforming large datasets",
    category: "data",
    icon: "📊",
    workflow: {
      name: "Data Processing ETL",
      description: "Extract data from multiple sources, transform it, and load into destination",
      nodes: [
        // Start with scheduling trigger
        {
          "Schedule Trigger": {
            expression: "0 2 * * *" // Daily at 2 AM
          }
        },
        // Extract from multiple sources in parallel
        [
          {
            "Query Database": {
              query: "SELECT * FROM source_table WHERE updated_at > ${state.lastRunTime}"
            }
          },
          {
            "Fetch External API": {
              url: "https://api.external.com/export",
              params: {
                since: "${state.lastRunTime}"
              }
            }
          },
          {
            "Read CSV File": {
              path: "/data/imports/latest.csv",
              format: "csv"
            }
          }
        ],
        // Merge all data sources
        {
          "Merge Data": {
            strategy: "concat",
            deduplicateBy: "id"
          }
        },
        // Transform data
        {
          "Transform Data": {
            operation: "map",
            transformations: [
              {
                field: "timestamp",
                transform: "toISOString"
              },
              {
                field: "amount",
                transform: "parseFloat"
              },
              {
                field: "category",
                transform: "toLowerCase"
              }
            ]
          }
        },
        // Validate data
        {
          "Validate Schema": {
            schema: {
              type: "array",
              items: {
                type: "object",
                required: ["id", "timestamp", "amount"],
                properties: {
                  id: { type: "string" },
                  timestamp: { type: "string", format: "date-time" },
                  amount: { type: "number", minimum: 0 }
                }
              }
            }
          }
        },
        // Process in batches
        {
          "Batch Process": {
            batchSize: 1000,
            parallel: 5
          }
        },
        // Load to destination
        {
          "Insert to Database": {
            table: "processed_data",
            onConflict: "update",
            conflictColumns: ["id"]
          }
        },
        // Generate report
        {
          "Calculate Stats": {
            operations: [
              { type: "count", as: "totalRecords" },
              { type: "sum", field: "amount", as: "totalAmount" },
              { type: "avg", field: "amount", as: "averageAmount" }
            ]
          }
        },
        // Send summary email
        {
          "Send Summary Email": {
            to: "${reportEmail}",
            subject: "Data Processing Complete - ${new Date().toLocaleDateString()}",
            body: "Processed ${input.totalRecords} records. Total: $${input.totalAmount}, Average: $${input.averageAmount}"
          }
        }
      ],
      initialState: {
        lastRunTime: null,
        reportEmail: "data-team@example.com",
        retryPolicy: {
          maxAttempts: 3,
          backoffMultiplier: 2
        }
      }
    }
  },
  {
    id: "webhook-handler",
    name: "Webhook Handler",
    description: "Receive webhooks, validate, process, and respond with custom logic",
    category: "integration",
    icon: "🔗",
    workflow: {
      name: "Webhook Processing System",
      description: "Handles incoming webhooks with validation, processing, and error handling",
      nodes: [
        // Receive webhook
        {
          "Receive Webhook": {
            path: "/webhook/events",
            method: "POST"
          }
        },
        // Validate webhook signature
        {
          "Validate HMAC": {
            secret: "${webhookSecret}",
            payload: "${input.body}",
            signature: "${input.headers['x-signature']}"
          }
        },
        // Parse event type
        {
          "Parse Event": {
            operation: "extract",
            transformations: [
              {
                from: "body.event_type",
                to: "eventType"
              },
              {
                from: "body.data",
                to: "eventData"
              }
            ]
          }
        },
        // Route based on event type
        "Route by Event Type",
        {
          "user.created": [
            // Create user in database
            {
              "Create User": {
                table: "users",
                data: {
                  external_id: "${state.eventData.id}",
                  email: "${state.eventData.email}",
                  name: "${state.eventData.name}"
                }
              }
            },
            // Send welcome email
            {
              "Send Welcome Email": {
                to: "${state.eventData.email}",
                subject: "Welcome!",
                template: "welcome",
                data: {
                  name: "${state.eventData.name}"
                }
              }
            }
          ],
          "payment.completed": [
            // Update order status
            {
              "Update Order": {
                table: "orders",
                where: {
                  id: "${state.eventData.order_id}"
                },
                data: {
                  status: "paid",
                  paid_at: "${new Date().toISOString()}"
                }
              }
            },
            // Trigger fulfillment
            {
              "Trigger Fulfillment": {
                url: "${fulfillmentApi}/orders",
                body: {
                  orderId: "${state.eventData.order_id}",
                  items: "${state.eventData.items}"
                }
              }
            }
          ],
          "subscription.cancelled": [
            // Update subscription
            {
              "Update Subscription": {
                table: "subscriptions",
                where: {
                  id: "${state.eventData.subscription_id}"
                },
                data: {
                  status: "cancelled",
                  cancelled_at: "${new Date().toISOString()}"
                }
              }
            },
            // Notify team
            {
              "Send Slack Message": {
                channel: "#subscriptions",
                text: "Subscription cancelled: ${state.eventData.customer_email}"
              }
            }
          ],
          "default": [
            // Log unknown event
            {
              "Log Warning": {
                message: "Unknown event type: ${state.eventType}",
                data: "${state.eventData}"
              }
            }
          ]
        },
        // Send acknowledgment
        {
          "Send Webhook Response": {
            status: 200,
            body: {
              received: true,
              eventId: "${input.body.event_id}",
              processedAt: "${new Date().toISOString()}"
            }
          }
        }
      ],
      initialState: {
        webhookSecret: "your-webhook-secret",
        fulfillmentApi: "https://api.fulfillment.com"
      }
    }
  }
];

export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return workflowTemplates.find(template => template.id === id);
}

export function getTemplatesByCategory(category: string): WorkflowTemplate[] {
  return workflowTemplates.filter(template => template.category === category);
}