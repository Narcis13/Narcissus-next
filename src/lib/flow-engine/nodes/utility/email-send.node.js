/** @type {import('../../types/flow-types.jsdoc.js').NodeDefinition} */
export default {
    id: "utility.email.send",
    version: "1.0.0",
    name: "Send Email",
    description: "Sends emails using the Resend API. Supports HTML/text content, attachments, and custom headers.",
    categories: ["Utilities", "Communication", "Integration"],
    tags: ["email", "send", "resend", "notification", "communication", "smtp"],
    inputs: [
        { 
            name: "apiKey", 
            type: "string", 
            description: "Resend API key (use state variable for security)", 
            required: true, 
            example: "${resend_api_key}"
        },
        { 
            name: "from", 
            type: "string", 
            description: "Sender email address (must be verified in Resend)", 
            required: true, 
            example: "noreply@yourdomain.com"
        },
        { 
            name: "to", 
            type: "any", 
            description: "Recipient email address(es). String for single, array for multiple", 
            required: true, 
            example: ["user@example.com", "another@example.com"]
        },
        { 
            name: "subject", 
            type: "string", 
            description: "Email subject line", 
            required: true, 
            example: "Welcome to our service!"
        },
        { 
            name: "html", 
            type: "string", 
            description: "HTML content of the email", 
            required: false, 
            example: "<h1>Welcome!</h1><p>Thank you for signing up.</p>"
        },
        { 
            name: "text", 
            type: "string", 
            description: "Plain text content (fallback for HTML)", 
            required: false, 
            example: "Welcome! Thank you for signing up."
        },
        { 
            name: "cc", 
            type: "any", 
            description: "CC recipients. String for single, array for multiple", 
            required: false, 
            example: "manager@example.com"
        },
        { 
            name: "bcc", 
            type: "any", 
            description: "BCC recipients. String for single, array for multiple", 
            required: false, 
            example: ["archive@example.com"]
        },
        { 
            name: "replyTo", 
            type: "string", 
            description: "Reply-to email address", 
            required: false, 
            example: "support@yourdomain.com"
        },
        { 
            name: "attachments", 
            type: "array", 
            description: "Array of attachment objects with filename and content", 
            required: false, 
            example: [{ "filename": "invoice.pdf", "content": "base64_encoded_content" }]
        },
        { 
            name: "tags", 
            type: "object", 
            description: "Custom tags for email tracking", 
            required: false, 
            example: { "campaign": "welcome", "user_id": "12345" }
        },
        { 
            name: "headers", 
            type: "object", 
            description: "Custom email headers", 
            required: false, 
            example: { "X-Campaign-ID": "welcome-2024" }
        }
    ],
    outputs: [
        { 
            name: "id", 
            type: "string", 
            description: "Unique ID of the sent email" 
        },
        { 
            name: "from", 
            type: "string", 
            description: "Sender email address used" 
        },
        { 
            name: "to", 
            type: "array", 
            description: "List of recipients" 
        },
        { 
            name: "createdAt", 
            type: "string", 
            description: "Timestamp when email was sent" 
        }
    ],
    edges: [
        { 
            name: "sent", 
            description: "Email sent successfully", 
            outputType: "object" 
        },
        { 
            name: "error", 
            description: "Failed to send email", 
            outputType: "object" 
        }
    ],
    implementation: async function(params) {
        const { 
            apiKey, 
            from, 
            to, 
            subject, 
            html, 
            text, 
            cc, 
            bcc, 
            replyTo,
            attachments,
            tags,
            headers
        } = params;
        
        try {
            // Validate required fields
            if (!apiKey || apiKey.trim() === '') {
                throw new Error('Resend API key is required');
            }
            
            if (!from || from.trim() === '') {
                throw new Error('From email address is required');
            }
            
            if (!to) {
                throw new Error('To email address is required');
            }
            
            if (!subject || subject.trim() === '') {
                throw new Error('Email subject is required');
            }
            
            if (!html && !text) {
                throw new Error('Either html or text content is required');
            }
            
            // Normalize recipients to arrays
            const toArray = Array.isArray(to) ? to : [to];
            const ccArray = cc ? (Array.isArray(cc) ? cc : [cc]) : undefined;
            const bccArray = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined;
            
            // Build email data
            const emailData = {
                from,
                to: toArray,
                subject
            };
            
            // Add content
            if (html) emailData.html = html;
            if (text) emailData.text = text;
            
            // Add optional fields
            if (ccArray) emailData.cc = ccArray;
            if (bccArray) emailData.bcc = bccArray;
            if (replyTo) emailData.reply_to = replyTo;
            if (tags) emailData.tags = tags;
            if (headers) emailData.headers = headers;
            
            // Process attachments
            if (attachments && attachments.length > 0) {
                emailData.attachments = attachments.map(att => ({
                    filename: att.filename,
                    content: att.content
                }));
            }
            
            // Log email details (without sensitive data)
            if (this.flowInstanceId) {
                console.log(`[Flow ${this.flowInstanceId}] Sending email: to=${toArray.length} recipients, subject="${subject}"`);
            }
            
            // Make request to Resend API
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailData)
            });
            
            // Check response status
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Resend API error: ${response.status} - ${errorData.message || response.statusText}`);
            }
            
            // Parse response
            const data = await response.json();
            
            // Store email info in state
            this.state.set('lastEmailSent', {
                id: data.id,
                to: toArray,
                subject,
                timestamp: Date.now()
            });
            
            // Log success
            if (this.flowInstanceId) {
                console.log(`[Flow ${this.flowInstanceId}] Email sent successfully: id=${data.id}`);
            }
            
            return {
                sent: () => ({
                    id: data.id,
                    from,
                    to: toArray,
                    createdAt: new Date().toISOString()
                })
            };
            
        } catch (error) {
            console.error(`[Email Send Node] Error: ${error.message}`);
            
            return {
                error: () => ({
                    error: error.message,
                    from,
                    to: Array.isArray(to) ? to : [to],
                    subject
                })
            };
        }
    },
    aiPromptHints: {
        toolName: "send_email",
        summary: "Sends emails via Resend API with full formatting support",
        useCase: "Use for sending notifications, alerts, reports, or any email communication from your workflow",
        expectedInputFormat: "Provide 'apiKey', 'from', 'to', 'subject', and either 'html' or 'text' content. Other fields are optional.",
        outputDescription: "Returns email ID and metadata via 'sent' edge, or error details via 'error' edge",
        examples: [
            "Send welcome emails to new users",
            "Email reports with PDF attachments",
            "Send alerts when conditions are met",
            "Notification emails with custom templates",
            "Multi-recipient announcements"
        ]
    }
};