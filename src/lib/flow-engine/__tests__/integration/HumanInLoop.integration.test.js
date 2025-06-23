import { FlowManager } from '../../core/FlowManager.js';
import FlowHub from '../../core/FlowHub.js';

describe('Human-in-the-Loop Integration Tests', () => {
  beforeEach(() => {
    const pauses = FlowHub.getActivePauses();
    pauses.forEach(pause => FlowHub.cancelPause(pause.pauseId));
  });

  describe('Approval Workflow', () => {
    test('should handle multi-step approval process', async () => {
      const approvalWorkflow = {
        nodes: [
          // 1. Prepare expense request
          function() {
            const request = {
              id: 'EXP-2025-001',
              employee: 'Jane Smith',
              amount: 2500,
              category: 'Travel',
              description: 'Client visit to NYC',
              submitted: new Date().toISOString()
            };
            
            this.state.set('request', request);
            return request;
          },

          // 2. Check if manager approval needed (>$1000)
          function() {
            const request = this.input;
            const needsApproval = request.amount > 1000;
            
            this.state.set('needsApproval', needsApproval);
            
            return {
              edges: needsApproval ? ['approve'] : ['auto-approve']
            };
          },

          // 3. Branch based on approval need
          {
            'approve': [
              // Prepare approval request
              function() {
                const request = this.state.get('request');
                return {
                  title: `Expense Approval Required: ${request.id}`,
                  details: `
Employee: ${request.employee}
Amount: $${request.amount}
Category: ${request.category}
Description: ${request.description}

Please review and approve/reject this expense.`,
                  options: ['Approve', 'Reject', 'Request More Info']
                };
              },

              // Request human approval
              async function() {
                const approvalRequest = this.input;
                
                // Simulate human review with pause
                const response = await this.humanInput({
                  type: 'choice',
                  prompt: approvalRequest.details,
                  options: approvalRequest.options
                }, 'manager-approval-1');
                
                this.state.set('managerResponse', response);
                
                // Route based on response
                if (response === 'Approve') {
                  return { edges: ['approved'] };
                } else if (response === 'Reject') {
                  return { edges: ['rejected'] };
                } else {
                  return { edges: ['need-info'] };
                }
              },

              // Handle different outcomes
              {
                'approved': function() {
                  this.state.set('status', 'approved');
                  this.state.set('approvedBy', 'Manager');
                  this.state.set('approvedAt', new Date().toISOString());
                  return 'Expense approved by manager';
                },
                
                'rejected': function() {
                  this.state.set('status', 'rejected');
                  this.state.set('rejectedBy', 'Manager');
                  this.state.set('rejectedAt', new Date().toISOString());
                  return 'Expense rejected by manager';
                },
                
                'need-info': [
                  // Request additional information
                  async function() {
                    const info = await this.humanInput({
                      type: 'text',
                      prompt: 'Please provide additional information about this expense:'
                    }, 'additional-info-1');
                    
                    this.state.set('additionalInfo', info);
                    return info;
                  },
                  
                  // Re-evaluate with new info
                  function() {
                    const request = this.state.get('request');
                    request.additionalInfo = this.input;
                    this.state.set('request', request);
                    this.state.set('status', 'resubmitted');
                    return 'Expense resubmitted with additional information';
                  }
                ]
              }
            ],
            
            'auto-approve': function() {
              this.state.set('status', 'auto-approved');
              this.state.set('approvedBy', 'System');
              this.state.set('approvedAt', new Date().toISOString());
              return 'Expense auto-approved (under $1000)';
            }
          },

          // 4. Final processing
          function() {
            const status = this.state.get('status');
            const request = this.state.get('request');
            
            // Ensure request exists
            if (!request) {
              return {
                error: 'No request found',
                status: status
              };
            }
            
            return {
              requestId: request.id,
              status: status,
              employee: request.employee,
              amount: request.amount,
              approvedBy: this.state.get('approvedBy'),
              approvedAt: this.state.get('approvedAt'),
              rejectedBy: this.state.get('rejectedBy'),
              rejectedAt: this.state.get('rejectedAt'),
              additionalInfo: this.state.get('additionalInfo'),
              processCompleted: true
            };
          }
        ]
      };

      // Test auto-approval path (amount <= $1000)
      const autoApprovalWorkflow = {
        nodes: [
          // 1. Prepare expense request
          function() {
            const request = {
              id: 'EXP-2025-002',
              employee: 'John Doe',
              amount: 750,
              category: 'Office Supplies',
              description: 'Printer cartridges',
              submitted: new Date().toISOString()
            };
            
            this.state.set('request', request);
            return request;
          },
          
          // 2. Check if manager approval needed (>$1000)
          function() {
            const request = this.input;
            const needsApproval = request.amount > 1000;
            
            this.state.set('needsApproval', needsApproval);
            
            return {
              edges: needsApproval ? ['approve'] : ['auto-approve']
            };
          },
          
          // 3. Branch - only auto-approve for this test
          {
            'auto-approve': function() {
              this.state.set('status', 'auto-approved');
              this.state.set('approvedBy', 'System');
              this.state.set('approvedAt', new Date().toISOString());
              return 'Expense auto-approved (under $1000)';
            }
          },
          
          // 4. Final processing
          function() {
            const status = this.state.get('status');
            const request = this.state.get('request');
            
            return {
              requestId: request.id,
              status: status,
              employee: request.employee,
              amount: request.amount,
              approvedBy: this.state.get('approvedBy'),
              approvedAt: this.state.get('approvedAt'),
              processCompleted: true
            };
          }
        ]
      };
      
      const autoApprovalFlow = FlowManager(autoApprovalWorkflow);

      const autoResult = await autoApprovalFlow.run();
      const autoFinal = autoResult[autoResult.length - 1].output.results[0];
      
      expect(autoFinal.status).toBe('auto-approved');
      expect(autoFinal.approvedBy).toBe('System');
      expect(autoFinal.amount).toBe(750);

      // Test manual approval path with approval
      const manualApprovalFlow = FlowManager(approvalWorkflow);
      
      // Start the flow (it will pause for approval)
      const manualPromise = manualApprovalFlow.run();
      
      // Wait for pause
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Simulate manager approval
      const pauses = FlowHub.getActivePauses();
      expect(pauses).toHaveLength(1);
      expect(pauses[0].pauseId).toBe('manager-approval-1');
      
      FlowHub.resume('manager-approval-1', 'Approve');
      
      const manualResult = await manualPromise;
      const manualFinal = manualResult[manualResult.length - 1].output.results[0];
      
      expect(manualFinal.status).toBe('approved');
      expect(manualFinal.approvedBy).toBe('Manager');
      expect(manualFinal.amount).toBe(2500);

      // Test rejection path
      const rejectionFlow = FlowManager(approvalWorkflow);
      const rejectionPromise = rejectionFlow.run();
      
      await new Promise(resolve => setTimeout(resolve, 50));
      FlowHub.resume('manager-approval-1', 'Reject');
      
      const rejectionResult = await rejectionPromise;
      const rejectionFinal = rejectionResult[rejectionResult.length - 1].output.results[0];
      
      expect(rejectionFinal.status).toBe('rejected');
      expect(rejectionFinal.rejectedBy).toBe('Manager');
    });
  });

  describe('Interactive Data Collection Workflow', () => {
    test('should collect user inputs step by step', async () => {
      const surveyWorkflow = {
        nodes: [
          // 1. Welcome message
          function() {
            this.state.set('surveyStarted', new Date().toISOString());
            return {
              message: 'Welcome to our customer satisfaction survey!',
              totalQuestions: 3
            };
          },

          // 2. Question 1 - Rating
          async function() {
            const rating = await this.humanInput({
              type: 'number',
              prompt: 'On a scale of 1-10, how satisfied are you with our service?',
              min: 1,
              max: 10
            }, 'q1-rating');
            
            this.state.set('satisfaction', rating);
            return rating;
          },

          // 3. Dynamic question based on rating
          async function() {
            const rating = this.input;
            let followUpQuestion;
            
            if (rating <= 6) {
              followUpQuestion = 'We\'re sorry to hear that. What can we improve?';
            } else if (rating <= 8) {
              followUpQuestion = 'Thank you! What did you like about our service?';
            } else {
              followUpQuestion = 'Excellent! What made your experience exceptional?';
            }
            
            const feedback = await this.humanInput({
              type: 'text',
              prompt: followUpQuestion
            }, 'q2-feedback');
            
            this.state.set('feedback', feedback);
            return feedback;
          },

          // 4. Question 3 - Recommendation
          async function() {
            const wouldRecommend = await this.humanInput({
              type: 'boolean',
              prompt: 'Would you recommend our service to others?'
            }, 'q3-recommend');
            
            this.state.set('wouldRecommend', wouldRecommend);
            return wouldRecommend;
          },

          // 5. Optional email collection
          async function() {
            const wantsFollowUp = await this.humanInput({
              type: 'boolean',
              prompt: 'Would you like us to follow up on your feedback?'
            }, 'q4-followup');
            
            if (wantsFollowUp) {
              const email = await this.humanInput({
                type: 'email',
                prompt: 'Please provide your email address:'
              }, 'q5-email');
              
              this.state.set('email', email);
            }
            
            this.state.set('wantsFollowUp', wantsFollowUp);
            return wantsFollowUp;
          },

          // 6. Generate survey results
          function() {
            return {
              surveyId: 'SURVEY-' + Date.now(),
              completedAt: new Date().toISOString(),
              responses: {
                satisfaction: this.state.get('satisfaction'),
                feedback: this.state.get('feedback'),
                wouldRecommend: this.state.get('wouldRecommend'),
                wantsFollowUp: this.state.get('wantsFollowUp'),
                email: this.state.get('email') || null
              },
              category: this.state.get('satisfaction') <= 6 ? 'detractor' : 
                       this.state.get('satisfaction') <= 8 ? 'passive' : 'promoter'
            };
          }
        ]
      };

      const fm = FlowManager(surveyWorkflow);
      const surveyPromise = fm.run();

      // Simulate user responses
      await new Promise(resolve => setTimeout(resolve, 50));
      FlowHub.resume('q1-rating', 9); // High satisfaction

      await new Promise(resolve => setTimeout(resolve, 50));
      FlowHub.resume('q2-feedback', 'The team was very professional and responsive');

      await new Promise(resolve => setTimeout(resolve, 50));
      FlowHub.resume('q3-recommend', true);

      await new Promise(resolve => setTimeout(resolve, 50));
      FlowHub.resume('q4-followup', true);

      await new Promise(resolve => setTimeout(resolve, 50));
      FlowHub.resume('q5-email', 'customer@example.com');

      const result = await surveyPromise;
      const surveyData = result[result.length - 1].output.results[0];

      expect(surveyData.responses.satisfaction).toBe(9);
      expect(surveyData.responses.wouldRecommend).toBe(true);
      expect(surveyData.responses.email).toBe('customer@example.com');
      expect(surveyData.category).toBe('promoter');
    });
  });

  describe('Progressive Form Workflow', () => {
    test('should validate inputs and provide real-time feedback', async () => {
      const registrationWorkflow = {
        nodes: [
          // 1. Collect username
          async function() {
            let isValid = false;
            let username;
            let attempts = 0;
            
            while (!isValid && attempts < 3) {
              username = await this.humanInput({
                type: 'text',
                prompt: attempts === 0 
                  ? 'Please choose a username (min 3 characters):'
                  : 'Username too short. Please choose a username (min 3 characters):'
              }, `username-attempt-${attempts}`);
              
              isValid = username && username.length >= 3;
              attempts++;
            }
            
            if (!isValid) {
              throw new Error('Failed to provide valid username');
            }
            
            this.state.set('username', username);
            return username;
          },

          // 2. Check username availability (mock)
          async function() {
            const username = this.input;
            
            // Simulate API check
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Mock: usernames starting with 'admin' are taken
            const isAvailable = !username.toLowerCase().startsWith('admin');
            
            if (!isAvailable) {
              const altUsername = await this.humanInput({
                type: 'text',
                prompt: `Username "${username}" is taken. Please choose another:`
              }, 'username-alternative');
              
              this.state.set('username', altUsername);
              return altUsername;
            }
            
            return username;
          },

          // 3. Collect password with strength check
          async function() {
            let password;
            let isStrong = false;
            
            while (!isStrong) {
              password = await this.humanInput({
                type: 'password',
                prompt: 'Choose a strong password (min 8 chars, include number):'
              }, 'password-input');
              
              // Check password strength
              isStrong = password.length >= 8 && /\d/.test(password);
              
              if (!isStrong) {
                await this.humanInput({
                  type: 'info',
                  prompt: 'Password must be at least 8 characters and include a number.'
                }, 'password-feedback');
              }
            }
            
            this.state.set('passwordHash', Buffer.from(password).toString('base64'));
            return 'password set';
          },

          // 4. Collect profile information
          async function() {
            const profile = {};
            
            profile.fullName = await this.humanInput({
              type: 'text',
              prompt: 'Enter your full name:'
            }, 'profile-name');
            
            profile.email = await this.humanInput({
              type: 'email',
              prompt: 'Enter your email address:'
            }, 'profile-email');
            
            profile.notifications = await this.humanInput({
              type: 'boolean',
              prompt: 'Would you like to receive email notifications?'
            }, 'profile-notifications');
            
            this.state.set('profile', profile);
            return profile;
          },

          // 5. Generate account summary
          function() {
            return {
              accountCreated: true,
              username: this.state.get('username'),
              profile: this.state.get('profile'),
              settings: {
                notifications: this.state.get('profile').notifications,
                accountType: 'standard',
                createdAt: new Date().toISOString()
              }
            };
          }
        ]
      };

      const fm = FlowManager(registrationWorkflow);
      const regPromise = fm.run();

      // Simulate user inputs
      // First username attempt - too short
      await new Promise(resolve => setTimeout(resolve, 50));
      FlowHub.resume('username-attempt-0', 'ab');

      // Second username attempt - valid
      await new Promise(resolve => setTimeout(resolve, 50));
      FlowHub.resume('username-attempt-1', 'john_doe');

      // Password - first attempt weak
      await new Promise(resolve => setTimeout(resolve, 50));
      FlowHub.resume('password-input', 'weak');

      // Acknowledge feedback
      await new Promise(resolve => setTimeout(resolve, 50));
      FlowHub.resume('password-feedback', 'ok');

      // Password - second attempt strong
      await new Promise(resolve => setTimeout(resolve, 50));
      FlowHub.resume('password-input', 'StrongPass123');

      // Profile information
      await new Promise(resolve => setTimeout(resolve, 50));
      FlowHub.resume('profile-name', 'John Doe');

      await new Promise(resolve => setTimeout(resolve, 50));
      FlowHub.resume('profile-email', 'john@example.com');

      await new Promise(resolve => setTimeout(resolve, 50));
      FlowHub.resume('profile-notifications', true);

      const result = await regPromise;
      const account = result[result.length - 1].output.results[0];

      expect(account.accountCreated).toBe(true);
      expect(account.username).toBe('john_doe');
      expect(account.profile.fullName).toBe('John Doe');
      expect(account.profile.email).toBe('john@example.com');
      expect(account.settings.notifications).toBe(true);
    });
  });
});