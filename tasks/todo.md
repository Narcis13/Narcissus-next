# Agentic Workflow System Testing Plan

## System Overview
The NextProject is an AI-friendly agentic workflow management system (similar to n8n/make.com) with JSON-based workflow definitions. The system is designed to be highly composable and serializable for AI agents to create and execute complex automations.

## Core Features Discovered

### 1. Flow Engine Architecture
- **FlowManager**: Main execution engine with state management, event emission, and execution context
- **FlowHub**: Singleton event system for cross-flow communication and pause/resume capabilities
- **NodeRegistry**: Node registration, discovery, and scope management
- **TriggerManager**: Automation trigger system for event-driven workflows

### 2. Node Types Implemented
- **Text Processing**: 
  - `text.transform.toUpperCase`: String transformation
  - `text.analysis.sentiment`: Sentiment analysis (implementation TBD)
- **Utilities**:
  - `utils.log.message`: Logging functionality
- **Google Integration**:
  - `google.gmail.connect`: OAuth authentication
  - `google.gmail.listEmails`: Email listing with optional full details
  - `google.gdrive.uploadFile`: File upload
  - `google.gdrive.downloadFile`: File download
  - `google.gdrive.listFiles`: File listing

### 3. Workflow Features
- **State Management**: Full state with undo/redo capabilities
- **State Placeholders**: Dynamic value resolution using `${state.path}` syntax
- **Branching**: Conditional execution based on edge names
- **Loops**: Controller-based iteration with action nodes
- **Sub-flows**: Nested workflow execution
- **Parameterized Calls**: Node execution with parameters
- **Human Input**: Pause/resume capabilities for user interaction
- **Event System**: Custom event emission and listening within flows

### 4. Trigger System
- **Email Trigger**: Mock implementation for email-based automation
- **Event Trigger**: General event-based automation
- **Automation Registration**: Dynamic workflow activation based on triggers

## Testing Plan

### Phase 1: Unit Testing - Core Components ✅ COMPLETED

#### 1.1 FlowManager Tests ✅ (19/19 tests passing)
- [x] Test basic workflow execution with function nodes
- [x] Test workflow with string-referenced nodes from scope
- [x] Test state management (get, set, undo, redo)
- [x] Test state placeholders resolution
- [x] Test initial input propagation
- [x] Test node execution context (`this.state`, `this.input`, `this.self`)
- [x] Test error handling for missing nodes
- [x] Test empty workflow execution

#### 1.2 NodeRegistry Tests ✅ (13/13 tests passing)
- [x] Test node registration with valid definitions
- [x] Test duplicate node registration handling
- [x] Test node retrieval by ID
- [x] Test node discovery with various criteria (text, categories, tags)
- [x] Test scope generation for FlowManager

#### 1.3 FlowHub Tests ✅ (12/12 tests passing)
- [x] Test event emission and listening
- [x] Test pause/resume functionality
- [x] Test multiple concurrent pauses
- [x] Test event cleanup on flow completion

#### 1.4 State Management Tests ✅ (18/18 tests passing)
- [x] Test nested state paths
- [x] Test array access in state placeholders
- [x] Test state history tracking
- [x] Test undo/redo boundaries
- [x] Test setting entire state vs. path-based updates

### Phase 2: Integration Testing - Workflow Features ⚠️ PARTIALLY COMPLETED

#### 2.1 Branching Tests ❌ (Tests written but failing - needs implementation fix)
- [ ] Test simple two-way branch
- [ ] Test multi-way branching
- [x] Test branch with no matching edge ✅
- [ ] Test nested branches
- [ ] Test branch with sub-flows

#### 2.2 Loop Tests ❌ (Tests written but failing - loop exit bug found)
- [ ] Test basic loop with counter
- [ ] Test loop with exit condition
- [ ] Test loop with complex actions
- [ ] Test nested loops
- [ ] Test loop max iteration safety

#### 2.3 Sub-flow Tests ✅ (Tested in FlowManager.test.js)
- [x] Test simple sub-flow execution
- [x] Test sub-flow with state propagation
- [x] Test nested sub-flows
- [ ] Test sub-flow error handling

#### 2.4 Event System Tests ✅ (Tested in FlowManager.advanced.test.js)
- [x] Test custom event emission between nodes
- [x] Test event listeners in different flows
- [x] Test event data propagation
- [x] Test listener cleanup

### Phase 3: Node Testing

#### 3.1 Text Processing Nodes
- [ ] Test string-uppercase with various inputs
- [ ] Test string-uppercase state storage
- [ ] Test analyze-sentiment placeholder functionality

#### 3.2 Utility Nodes
- [ ] Test log-message functionality
- [ ] Test log-message with different log levels

#### 3.3 Google Integration Nodes
- [ ] Test gmail.connect OAuth flow
- [ ] Test gmail.listEmails with/without full details
- [ ] Test gdrive file operations (upload, download, list)
- [ ] Test error handling for missing authentication

### Phase 4: Trigger System Testing

#### 4.1 TriggerManager Tests
- [ ] Test trigger registration
- [ ] Test trigger activation/deactivation
- [ ] Test workflow execution from triggers
- [ ] Test initial state function
- [ ] Test concurrent trigger handling

#### 4.2 Trigger Handler Tests
- [ ] Test email trigger simulation
- [ ] Test event trigger functionality
- [ ] Test trigger cleanup on deactivation

### Phase 5: API Route Testing

#### 5.1 Workflow Execution API
- [ ] Test POST /api/workflow/run with valid workflow
- [ ] Test workflow run with initial state
- [ ] Test error handling for invalid workflows
- [ ] Test concurrent workflow execution

#### 5.2 Workflow Test API
- [ ] Test POST /api/workflow/test functionality
- [ ] Verify simple function execution

#### 5.3 Resume API
- [ ] Test POST /api/workflow/resume for paused flows
- [ ] Test resume with invalid pause IDs

### Phase 6: End-to-End Testing

#### 6.1 Complex Workflow Scenarios
- [ ] Test workflow with all feature types combined
- [ ] Test data processing pipeline (input � transform � output)
- [ ] Test human-in-the-loop workflow
- [ ] Test trigger-based automation with state persistence

#### 6.2 Performance Testing
- [ ] Test large workflow execution (100+ nodes)
- [ ] Test deep nesting performance
- [ ] Test state management with large datasets
- [ ] Test concurrent workflow limits

#### 6.3 Error Recovery Testing
- [ ] Test workflow recovery from node failures
- [ ] Test partial state recovery
- [ ] Test trigger error handling

### Phase 7: Security Testing

#### 7.1 Input Validation
- [ ] Test malicious code injection in workflows
- [ ] Test state manipulation boundaries
- [ ] Test scope isolation between flows

#### 7.2 Authentication & Authorization
- [ ] Test Google OAuth token handling
- [ ] Test credential encryption/decryption
- [ ] Test multi-user isolation (when implemented)

## Implementation Strategy

1. **Test Framework Setup**: Configure Jest/Vitest for the project ✅ COMPLETED
2. **Mock Infrastructure**: Create mocks for external services (Google APIs, etc.)
3. **Test Data**: Prepare sample workflows and test scenarios ✅ COMPLETED
4. **CI/CD Integration**: Add test automation to build pipeline
5. **Documentation**: Create test documentation and examples ✅ COMPLETED (TEST_RESULTS.md)

## Success Criteria

- All core features have comprehensive test coverage (>80%)
- All edge cases are identified and tested
- Performance benchmarks are established
- Security vulnerabilities are identified and addressed
- System behaves predictably under various conditions

## Next Steps

1. Review this plan and identify priorities
2. Set up testing infrastructure
3. Begin with Phase 1 unit tests
4. Progressively work through each phase
5. Document findings and create bug reports
6. Implement fixes and re-test

---

This testing plan ensures the agentic workflow system is robust, reliable, and ready for production use in AI-driven automation scenarios.

## Progress Summary (Updated: 2025-01-24)

### ✅ Completed:
- Phase 1: Unit Testing - Core Components (62/62 tests passing)
  - FlowManager basic tests: 19/19 ✅
  - NodeRegistry tests: 13/13 ✅  
  - FlowHub tests: 12/12 ✅
  - StateManager tests: 18/18 ✅
- Test Framework Setup (Jest + TypeScript)
- Test Data & Scenarios
- Documentation (TEST_RESULTS.md)

### ⚠️ In Progress:
- Phase 2: Integration Testing (partially complete)
  - Sub-flow tests: ✅ 
  - Event system tests: ✅
  - Branching tests: ❌ (implementation issues)
  - Loop tests: ❌ (exit bug discovered)

### 🐛 Bugs Found:
1. **Loop Exit Bug**: Loops don't exit when controller returns 'exit' edge
2. **Branch SubSteps**: Branch execution doesn't create expected subSteps structure

### 📊 Overall Progress: ~25% of total test plan completed