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
          "http.request.get": {
            url: "${config.apiUrl}",
            headers: {
              "Authorization": "Bearer ${config.apiKey}"
            }
          }
        },
        // Transform the data
        {
          "data.transform.mapper": {
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
        "logic.condition.if",
        {
          "hasIssues": [
            // Send alert email
            {
              "communication.email.send": {
                to: "${config.alertEmail}",
                subject: "Alert: Issues Detected",
                body: "Found ${state.issueCount} issues in the latest data fetch."
              }
            }
          ],
          "success": [
            // Log success
            {
              "utility.log.info": {
                message: "Data processed successfully. No issues found."
              }
            }
          ]
        },
        // Add delay before next run
        {
          "logic.control.delay": {
            duration: 3600 // 1 hour
          }
        }
      ],
      variables: {
        issueThreshold: 5
      },
      config: {
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
          "http.webhook.receive": {
            path: "/chat",
            method: "POST"
          }
        },
        // Extract message data
        {
          "data.transform.mapper": {
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
          "database.query.select": {
            query: "SELECT * FROM conversations WHERE id = ${state.conversationId} ORDER BY created_at DESC LIMIT 10"
          }
        },
        // Prepare AI context
        {
          "data.transform.mapper": {
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
          "ai.openai.completion": {
            model: "gpt-4",
            messages: "${input.messages}",
            temperature: 0.7,
            max_tokens: 1000
          }
        },
        // Save response to database
        {
          "database.query.insert": {
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
          "http.webhook.respond": {
            status: 200,
            body: {
              response: "${input.content}",
              conversationId: "${state.conversationId}"
            }
          }
        }
      ],
      config: {
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
          "trigger.schedule.cron": {
            expression: "0 2 * * *" // Daily at 2 AM
          }
        },
        // Extract from multiple sources in parallel
        [
          {
            "database.query.select": {
              query: "SELECT * FROM source_table WHERE updated_at > ${state.lastRunTime}"
            }
          },
          {
            "http.request.get": {
              url: "https://api.external.com/export",
              params: {
                since: "${state.lastRunTime}"
              }
            }
          },
          {
            "storage.file.read": {
              path: "/data/imports/latest.csv",
              format: "csv"
            }
          }
        ],
        // Merge all data sources
        {
          "data.combine.merge": {
            strategy: "concat",
            deduplicateBy: "id"
          }
        },
        // Transform data
        {
          "data.transform.mapper": {
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
          "data.validate.schema": {
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
          "data.batch.process": {
            batchSize: 1000,
            parallel: 5
          }
        },
        // Load to destination
        {
          "database.query.insert": {
            table: "processed_data",
            onConflict: "update",
            conflictColumns: ["id"]
          }
        },
        // Generate report
        {
          "data.aggregate.stats": {
            operations: [
              { type: "count", as: "totalRecords" },
              { type: "sum", field: "amount", as: "totalAmount" },
              { type: "avg", field: "amount", as: "averageAmount" }
            ]
          }
        },
        // Send summary email
        {
          "communication.email.send": {
            to: "${config.reportEmail}",
            subject: "Data Processing Complete - ${new Date().toLocaleDateString()}",
            body: "Processed ${input.totalRecords} records. Total: $${input.totalAmount}, Average: $${input.averageAmount}"
          }
        }
      ],
      variables: {
        lastRunTime: null
      },
      config: {
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
          "http.webhook.receive": {
            path: "/webhook/events",
            method: "POST"
          }
        },
        // Validate webhook signature
        {
          "security.validate.hmac": {
            secret: "${config.webhookSecret}",
            payload: "${input.body}",
            signature: "${input.headers['x-signature']}"
          }
        },
        // Parse event type
        {
          "data.transform.mapper": {
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
        "logic.condition.switch",
        {
          "user.created": [
            // Create user in database
            {
              "database.query.insert": {
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
              "communication.email.send": {
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
              "database.query.update": {
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
              "http.request.post": {
                url: "${config.fulfillmentApi}/orders",
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
              "database.query.update": {
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
              "communication.slack.message": {
                channel: "#subscriptions",
                text: "Subscription cancelled: ${state.eventData.customer_email}"
              }
            }
          ],
          "default": [
            // Log unknown event
            {
              "utility.log.warn": {
                message: "Unknown event type: ${state.eventType}",
                data: "${state.eventData}"
              }
            }
          ]
        },
        // Send acknowledgment
        {
          "http.webhook.respond": {
            status: 200,
            body: {
              received: true,
              eventId: "${input.body.event_id}",
              processedAt: "${new Date().toISOString()}"
            }
          }
        }
      ],
      config: {
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