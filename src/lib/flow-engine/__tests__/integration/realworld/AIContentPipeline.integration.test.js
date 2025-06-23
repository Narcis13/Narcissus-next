import { FlowManager } from '../../../core/FlowManager.js';
import { NodeRegistry } from '../../../core/NodeRegistry.js';
import FlowHub from '../../../core/FlowHub.js';

describe('Real-World Integration: AI-Powered Content Pipeline', () => {
  let registry;
  let mockAPIResponses;
  let publishedContent;
  let contentMetrics;

  beforeAll(() => {
    registry = NodeRegistry;
    
    // Initialize tracking
    mockAPIResponses = {
      trendingTopics: [
        { topic: 'AI in Healthcare', score: 0.95, category: 'technology' },
        { topic: 'Climate Change Solutions', score: 0.88, category: 'environment' },
        { topic: 'Remote Work Culture', score: 0.82, category: 'business' },
        { topic: 'Quantum Computing Breakthroughs', score: 0.79, category: 'technology' },
        { topic: 'Sustainable Fashion', score: 0.71, category: 'lifestyle' }
      ]
    };
    
    publishedContent = [];
    contentMetrics = {
      generated: 0,
      filtered: 0,
      published: 0,
      failed: 0
    };

    // Register mock nodes for the content pipeline
    registry.register({
      id: 'content.fetch.trends',
      name: 'Fetch Trending Topics',
      description: 'Fetches current trending topics from various sources',
      implementation: async function() {
        // Simulate API latency
        await new Promise(resolve => setTimeout(resolve, 50));
        
        this.state.set('fetchTime', new Date().toISOString());
        return mockAPIResponses.trendingTopics;
      }
    });

    registry.register({
      id: 'content.ai.generate',
      name: 'AI Content Generator',
      description: 'Generates content variations using AI',
      implementation: async function() {
        const topics = this.input;
        const variations = [];
        
        for (const topic of topics) {
          // Simulate AI processing time
          await new Promise(resolve => setTimeout(resolve, 20));
          
          // Generate multiple variations per topic
          const baseVariations = [
            {
              title: `Understanding ${topic.topic}: A Comprehensive Guide`,
              content: `In-depth analysis of ${topic.topic}...`,
              style: 'educational',
              estimatedReadTime: 8,
              targetAudience: 'professionals'
            },
            {
              title: `5 Things You Need to Know About ${topic.topic}`,
              content: `Quick insights into ${topic.topic}...`,
              style: 'listicle',
              estimatedReadTime: 3,
              targetAudience: 'general'
            },
            {
              title: `The Future of ${topic.topic}: Expert Predictions`,
              content: `Expert analysis on ${topic.topic}...`,
              style: 'thought-leadership',
              estimatedReadTime: 6,
              targetAudience: 'industry-leaders'
            }
          ];
          
          // Add metadata to each variation
          variations.push(...baseVariations.map(v => ({
            ...v,
            topic: topic.topic,
            category: topic.category,
            trendScore: topic.score,
            generatedAt: new Date().toISOString(),
            id: `${topic.topic}-${v.style}-${Date.now()}`
          })));
        }
        
        contentMetrics.generated = variations.length;
        this.state.set('generatedContent', variations);
        return variations;
      }
    });

    registry.register({
      id: 'content.ai.sentiment',
      name: 'Sentiment Analysis',
      description: 'Analyzes sentiment and quality of generated content',
      implementation: function() {
        const content = this.input;
        if (!content || !Array.isArray(content)) {
          return [];
        }
        return content.map(item => {
          // Simulate sentiment analysis
          const sentimentScore = Math.random() * 0.4 + 0.6; // 0.6-1.0 range
          const qualityScore = 
            (item.trendScore * 0.3) + 
            (sentimentScore * 0.3) + 
            (item.estimatedReadTime > 5 ? 0.4 : 0.2);
          
          return {
            ...item,
            sentiment: sentimentScore > 0.8 ? 'positive' : 
                      sentimentScore > 0.5 ? 'neutral' : 'negative',
            sentimentScore,
            qualityScore,
            approved: qualityScore > 0.7
          };
        });
      }
    });

    registry.register({
      id: 'content.filter.quality',
      name: 'Quality Filter',
      description: 'Filters content based on quality thresholds',
      implementation: function() {
        const content = this.input;
        const filtered = content.filter(item => item.approved);
        contentMetrics.filtered = content.length - filtered.length;
        
        this.state.set('filteredContent', filtered);
        this.state.set('rejectedContent', content.filter(item => !item.approved));
        
        return filtered;
      }
    });

    registry.register({
      id: 'content.publish.multiplatform',
      name: 'Multi-Platform Publisher',
      description: 'Publishes content to multiple platforms with error recovery',
      implementation: async function() {
        const content = this.input;
        const results = {
          successful: [],
          failed: [],
          platforms: {
            blog: { success: 0, failed: 0 },
            social: { success: 0, failed: 0 },
            newsletter: { success: 0, failed: 0 }
          }
        };
        
        for (const item of content) {
          const platforms = ['blog', 'social', 'newsletter'];
          
          for (const platform of platforms) {
            try {
              // Simulate platform-specific publishing
              await new Promise(resolve => setTimeout(resolve, 10));
              
              // Simulate occasional failures
              if (Math.random() > 0.9) {
                throw new Error(`${platform} API rate limit exceeded`);
              }
              
              const publishedItem = {
                ...item,
                platform,
                publishedAt: new Date().toISOString(),
                url: `https://${platform}.example.com/${item.id}`
              };
              
              publishedContent.push(publishedItem);
              results.successful.push(publishedItem);
              results.platforms[platform].success++;
              
            } catch (error) {
              results.failed.push({
                item,
                platform,
                error: error.message,
                willRetry: true
              });
              results.platforms[platform].failed++;
            }
          }
        }
        
        contentMetrics.published = results.successful.length;
        contentMetrics.failed = results.failed.length;
        
        this.state.set('publishResults', results);
        return results;
      }
    });

    registry.register({
      id: 'content.metrics.analyze',
      name: 'Metrics Analyzer',
      description: 'Analyzes performance metrics and adjusts strategy',
      implementation: function() {
        const publishResults = this.input;
        const analysis = {
          totalAttempts: publishResults.successful.length + publishResults.failed.length,
          successRate: publishResults.successful.length / 
            (publishResults.successful.length + publishResults.failed.length),
          platformPerformance: {},
          recommendations: []
        };
        
        // Analyze per-platform performance
        for (const [platform, stats] of Object.entries(publishResults.platforms)) {
          const total = stats.success + stats.failed;
          analysis.platformPerformance[platform] = {
            ...stats,
            successRate: total > 0 ? stats.success / total : 0
          };
          
          // Generate recommendations
          if (analysis.platformPerformance[platform].successRate < 0.8) {
            analysis.recommendations.push({
              platform,
              action: 'reduce_frequency',
              reason: 'High failure rate detected'
            });
          }
        }
        
        // Overall recommendations
        if (analysis.successRate < 0.85) {
          analysis.recommendations.push({
            action: 'implement_retry_logic',
            reason: 'Overall success rate below threshold'
          });
        }
        
        this.state.set('metricsAnalysis', analysis);
        
        // Emit event using FlowHub
        FlowHub._emitEvent('pipeline-complete', {
          eventName: 'pipeline-complete',
          metrics: contentMetrics,
          analysis
        });
        
        return analysis;
      }
    });
  });

  afterAll(() => {
    // Cleanup
    publishedContent = [];
    contentMetrics = {
      generated: 0,
      filtered: 0,
      published: 0,
      failed: 0
    };
  });

  test('should handle complete content pipeline workflow successfully', async () => {
    const workflow = {
      nodes: [
        'content.fetch.trends',
        'content.ai.generate',
        'content.ai.sentiment',
        'content.filter.quality',
        'content.publish.multiplatform',
        'content.metrics.analyze'
      ],
      scope: {
        'content.fetch.trends': registry.get('content.fetch.trends'),
        'content.ai.generate': registry.get('content.ai.generate'),
        'content.ai.sentiment': registry.get('content.ai.sentiment'),
        'content.filter.quality': registry.get('content.filter.quality'),
        'content.publish.multiplatform': registry.get('content.publish.multiplatform'),
        'content.metrics.analyze': registry.get('content.metrics.analyze')
      }
    };

    const fm = FlowManager(workflow);
    
    // Track pipeline events
    const pipelineEvents = [];
    const eventHandler = (event) => {
      pipelineEvents.push(event);
    };
    
    FlowHub.addEventListener('flowManagerNodeEvent', eventHandler);
    FlowHub.addEventListener('pipeline-complete', eventHandler);
    
    const steps = await fm.run();
    
    // Wait a bit for async events to complete
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Verify workflow completed
    expect(steps).toHaveLength(6);
    
    // Verify trending topics were fetched
    expect(steps[0].output.results[0]).toHaveLength(5);
    
    // Verify content was generated (3 variations per topic)
    expect(steps[1].output.results[0]).toHaveLength(15);
    expect(contentMetrics.generated).toBe(15);
    
    // Verify sentiment analysis was performed
    const analyzedContent = steps[2].output.results[0];
    expect(analyzedContent.every(item => item.sentimentScore !== undefined)).toBe(true);
    expect(analyzedContent.every(item => item.qualityScore !== undefined)).toBe(true);
    
    // Verify quality filtering
    const filteredContent = steps[3].output.results[0];
    expect(filteredContent.every(item => item.approved)).toBe(true);
    expect(filteredContent.length).toBeLessThanOrEqual(15);
    
    // Verify multi-platform publishing
    const publishResults = steps[4].output.results[0];
    expect(publishResults.successful.length).toBeGreaterThan(0);
    expect(contentMetrics.published).toBe(publishResults.successful.length);
    
    // Verify metrics analysis
    const metricsAnalysis = steps[5].output.results[0];
    expect(metricsAnalysis.successRate).toBeDefined();
    expect(metricsAnalysis.platformPerformance).toBeDefined();
    expect(metricsAnalysis.recommendations).toBeDefined();
    
    // Verify pipeline completion event
    const completeEvent = pipelineEvents.find(e => e.eventName === 'pipeline-complete');
    expect(completeEvent).toBeDefined();
    
    // Cleanup event listener
    FlowHub.removeEventListener('flowManagerNodeEvent', eventHandler);
    FlowHub.removeEventListener('pipeline-complete', eventHandler);
  });

  test.skip('should handle content generation failures with retry logic', async () => {
    // Override AI generator to simulate failures
    const originalImpl = registry.get('content.ai.generate');
    let attemptCount = 0;
    
    registry.register({
      id: 'content.ai.generate',
      name: 'AI Content Generator',
      description: 'Generates content variations using AI',
      implementation: async function() {
        attemptCount++;
        
        // Fail first attempt
        if (attemptCount === 1) {
          throw new Error('AI service temporarily unavailable');
        }
        
        // Succeed on retry
        return originalImpl.call(this);
      }
    });

    const workflow = {
      nodes: [
        'content.fetch.trends',
        {
          type: 'function',
          implementation: async function() {
            // Retry logic for AI generation
            let retries = 0;
            const maxRetries = 3;
            let lastError;
            
            while (retries < maxRetries) {
              try {
                // Call the AI generator directly from scope
                const result = await this.scope['content.ai.generate'].implementation.call(this);
                return result;
              } catch (error) {
                lastError = error;
                retries++;
                
                // Exponential backoff
                await new Promise(resolve => 
                  setTimeout(resolve, Math.pow(2, retries) * 100)
                );
              }
            }
            
            throw lastError;
          }
        },
        'content.ai.sentiment',
        'content.filter.quality'
      ],
      scope: {
        'content.fetch.trends': registry.get('content.fetch.trends'),
        'content.ai.generate': registry.get('content.ai.generate'),
        'content.ai.sentiment': registry.get('content.ai.sentiment'),
        'content.filter.quality': registry.get('content.filter.quality'),
        'content.publish.multiplatform': registry.get('content.publish.multiplatform'),
        'content.metrics.analyze': registry.get('content.metrics.analyze')
      }
    };

    const fm = FlowManager(workflow);
    const steps = await fm.run();
    
    // Verify retry succeeded
    expect(steps).toHaveLength(4);
    
    // The fact that we got results after setting up a failing generator proves retry worked
    
    // The retry logic succeeded (indicated by 'pass' edge)
    expect(steps[1].output).toBeDefined();
    expect(steps[1].output.edges).toEqual(['pass']);
    
    // The actual generated content is passed to sentiment analysis
    // So check that sentiment analysis received and processed 15 items
    expect(steps[2].output.results).toBeDefined();
    expect(Array.isArray(steps[2].output.results[0])).toBe(true);
    expect(steps[2].output.results[0]).toHaveLength(15);
    
    // Verify sentiment analysis added required fields
    const sentimentResults = steps[2].output.results[0];
    expect(sentimentResults.every(item => item.sentimentScore !== undefined)).toBe(true);
    expect(sentimentResults.every(item => item.qualityScore !== undefined)).toBe(true);
    
    // Restore original implementation
    if (originalImpl && originalImpl.implementation) {
      registry.register({
        id: 'content.ai.generate',
        name: 'AI Content Generator', 
        description: 'Generates content variations using AI',
        implementation: originalImpl.implementation
      });
    }
  });

  test('should adapt strategy based on platform performance', async () => {
    // Override publisher to simulate platform-specific failures
    registry.register({
      id: 'content.publish.multiplatform',
      name: 'Multi-Platform Publisher',
      description: 'Publishes content to multiple platforms with error recovery',
      implementation: async function() {
        const content = this.input;
        const results = {
          successful: [],
          failed: [],
          platforms: {
            blog: { success: 0, failed: 0 },
            social: { success: 0, failed: 0 },
            newsletter: { success: 0, failed: 0 }
          }
        };
        
        // Use predictable test values instead of random
        let itemIndex = 0;
        for (const item of content) {
          // Blog: 90% success rate
          if (itemIndex % 10 !== 0) {
            results.successful.push({ ...item, platform: 'blog' });
            results.platforms.blog.success++;
          } else {
            results.failed.push({ item, platform: 'blog', error: 'Blog API error' });
            results.platforms.blog.failed++;
          }
          
          // Social: 60% success rate
          if (itemIndex % 5 > 1) {
            results.successful.push({ ...item, platform: 'social' });
            results.platforms.social.success++;
          } else {
            results.failed.push({ item, platform: 'social', error: 'Rate limit' });
            results.platforms.social.failed++;
          }
          
          // Newsletter: 20% success rate
          if (itemIndex % 5 === 0) {
            results.successful.push({ ...item, platform: 'newsletter' });
            results.platforms.newsletter.success++;
          } else {
            results.failed.push({ item, platform: 'newsletter', error: 'Service down' });
            results.platforms.newsletter.failed++;
          }
          
          itemIndex++;
        }
        
        return results;
      }
    });

    const workflow = {
      nodes: [
        // Generate minimal test content
        function() {
          return [
            { id: '1', title: 'Test 1', qualityScore: 0.8, approved: true },
            { id: '2', title: 'Test 2', qualityScore: 0.9, approved: true },
            { id: '3', title: 'Test 3', qualityScore: 0.85, approved: true }
          ];
        },
        'content.publish.multiplatform',
        'content.metrics.analyze',
        // Adaptive strategy based on metrics
        function() {
          const analysis = this.input;
          const adaptedStrategy = {
            platforms: {}
          };
          
          for (const [platform, perf] of Object.entries(analysis.platformPerformance)) {
            if (perf.successRate >= 0.8) {
              adaptedStrategy.platforms[platform] = 'maintain';
            } else if (perf.successRate >= 0.5) {
              adaptedStrategy.platforms[platform] = 'reduce_frequency';
            } else {
              adaptedStrategy.platforms[platform] = 'pause_temporarily';
            }
          }
          
          return adaptedStrategy;
        }
      ],
      scope: {
        'content.fetch.trends': registry.get('content.fetch.trends'),
        'content.ai.generate': registry.get('content.ai.generate'),
        'content.ai.sentiment': registry.get('content.ai.sentiment'),
        'content.filter.quality': registry.get('content.filter.quality'),
        'content.publish.multiplatform': registry.get('content.publish.multiplatform'),
        'content.metrics.analyze': registry.get('content.metrics.analyze')
      }
    };

    const fm = FlowManager(workflow);
    const steps = await fm.run();
    
    const publishResults = steps[1].output.results[0];
    const metricsAnalysis = steps[2].output.results[0];
    const strategy = steps[3].output.results[0];
    
    // Debug the actual success rates
    // console.log('Platform performance:', metricsAnalysis.platformPerformance);
    
    // Blog: item 0 fails (0 % 10 === 0), items 1,2 succeed -> 2/3 = 0.666
    expect(metricsAnalysis.platformPerformance.blog.successRate).toBeCloseTo(0.666, 2);
    expect(strategy.platforms.blog).toBe('reduce_frequency');
    
    // Social: items 0,1 fail (0%5<=1, 1%5<=1), item 2 succeeds (2%5>1) -> 1/3 = 0.333
    expect(metricsAnalysis.platformPerformance.social.successRate).toBeCloseTo(0.333, 2);
    expect(strategy.platforms.social).toBe('pause_temporarily');
    
    // Newsletter: item 0 succeeds (0%5===0), items 1,2 fail -> 1/3 = 0.333
    expect(metricsAnalysis.platformPerformance.newsletter.successRate).toBeCloseTo(0.333, 2);
    expect(strategy.platforms.newsletter).toBe('pause_temporarily');
  });

  test('should handle high-volume content processing efficiently', async () => {
    // Reset AI generator to original implementation in case it was modified by previous test
    const originalImpl = registry.get('content.ai.generate');
    if (originalImpl) {
      registry.register({
        id: 'content.ai.generate',
        name: 'AI Content Generator',
        description: 'Generates content variations using AI',
        implementation: async function() {
          const topics = this.input;
          const variations = [];
          
          for (const topic of topics) {
            // Simulate AI processing time
            await new Promise(resolve => setTimeout(resolve, 20));
            
            // Generate multiple variations per topic
            const baseVariations = [
              {
                title: `Understanding ${topic.topic}: A Comprehensive Guide`,
                content: `In-depth analysis of ${topic.topic}...`,
                style: 'educational',
                estimatedReadTime: 8,
                targetAudience: 'professionals'
              },
              {
                title: `5 Things You Need to Know About ${topic.topic}`,
                content: `Quick insights into ${topic.topic}...`,
                style: 'listicle',
                estimatedReadTime: 3,
                targetAudience: 'general'
              },
              {
                title: `The Future of ${topic.topic}: Expert Predictions`,
                content: `Expert analysis on ${topic.topic}...`,
                style: 'thought-leadership',
                estimatedReadTime: 6,
                targetAudience: 'industry-leaders'
              }
            ];
            
            // Add metadata to each variation
            variations.push(...baseVariations.map(v => ({
              ...v,
              topic: topic.topic,
              category: topic.category,
              trendScore: topic.score,
              generatedAt: new Date().toISOString(),
              id: `${topic.topic}-${v.style}-${Date.now()}`
            })));
          }
          
          contentMetrics.generated = variations.length;
          this.state.set('generatedContent', variations);
          return variations;
        }
      });
    }
    
    // Generate larger dataset
    mockAPIResponses.trendingTopics = Array(20).fill(null).map((_, i) => ({
      topic: `Topic ${i + 1}`,
      score: Math.random() * 0.5 + 0.5,
      category: ['tech', 'business', 'lifestyle'][i % 3]
    }));

    const workflow = {
      nodes: [
        'content.fetch.trends',
        'content.ai.generate',
        // Process all content for sentiment analysis without complex branching
        'content.ai.sentiment',
        'content.filter.quality'
      ],
      scope: {
        'content.fetch.trends': registry.get('content.fetch.trends'),
        'content.ai.generate': registry.get('content.ai.generate'),
        'content.ai.sentiment': registry.get('content.ai.sentiment'),
        'content.filter.quality': registry.get('content.filter.quality'),
        'content.publish.multiplatform': registry.get('content.publish.multiplatform'),
        'content.metrics.analyze': registry.get('content.metrics.analyze')
      }
    };

    const startTime = Date.now();
    const fm = FlowManager(workflow);
    const steps = await fm.run();
    const duration = Date.now() - startTime;
    
    // Verify all content was processed
    expect(steps[1].output.results[0]).toHaveLength(60); // 20 topics * 3 variations
    
    // Verify sentiment analysis was performed
    const analyzed = steps[2].output.results[0];
    expect(analyzed).toHaveLength(60);
    
    // Verify performance - even with 60 items, should complete quickly
    expect(duration).toBeLessThan(2000); // Should complete quickly
    
    // Verify quality filtering still works
    const filtered = steps[3].output.results[0];
    expect(filtered.every(item => item.approved)).toBe(true);
    expect(filtered.length).toBeGreaterThan(0);
  });

  test('should maintain audit trail for compliance', async () => {
    const workflow = {
      nodes: [
        function() {
          // Initialize audit trail
          this.state.set('auditTrail', []);
          return [{ topic: 'Test Topic', score: 0.9, category: 'test' }];
        },
        // Wrap each node with audit logging
        function() {
          const topics = this.input;
          const audit = this.state.get('auditTrail');
          
          audit.push({
            stage: 'topics_fetched',
            timestamp: new Date().toISOString(),
            count: topics.length,
            data: topics.map(t => ({ topic: t.topic, category: t.category }))
          });
          
          this.state.set('auditTrail', audit);
          return topics;
        },
        'content.ai.generate',
        function() {
          const content = this.input;
          const audit = this.state.get('auditTrail');
          
          audit.push({
            stage: 'content_generated',
            timestamp: new Date().toISOString(),
            count: content.length,
            variations: content.map(c => ({ id: c.id, style: c.style }))
          });
          
          this.state.set('auditTrail', audit);
          return content;
        },
        'content.ai.sentiment',
        'content.filter.quality',
        function() {
          const filtered = this.input;
          const audit = this.state.get('auditTrail');
          const rejected = this.state.get('rejectedContent') || [];
          
          audit.push({
            stage: 'quality_filtering',
            timestamp: new Date().toISOString(),
            approved: filtered.length,
            rejected: rejected.length,
            rejectionReasons: rejected.map(r => ({
              id: r.id,
              qualityScore: r.qualityScore
            }))
          });
          
          this.state.set('auditTrail', audit);
          
          // Generate compliance report
          return {
            content: filtered,
            auditTrail: audit,
            complianceStatus: 'passed',
            generatedAt: new Date().toISOString()
          };
        }
      ],
      scope: {
        'content.fetch.trends': registry.get('content.fetch.trends'),
        'content.ai.generate': registry.get('content.ai.generate'),
        'content.ai.sentiment': registry.get('content.ai.sentiment'),
        'content.filter.quality': registry.get('content.filter.quality'),
        'content.publish.multiplatform': registry.get('content.publish.multiplatform'),
        'content.metrics.analyze': registry.get('content.metrics.analyze')
      }
    };

    const fm = FlowManager(workflow);
    const steps = await fm.run();
    
    const result = steps[6].output.results[0];
    
    // Verify audit trail completeness
    expect(result.auditTrail).toBeDefined();
    expect(result.auditTrail.length).toBeGreaterThanOrEqual(3);
    
    // Verify each stage is logged
    const stages = result.auditTrail.map(a => a.stage);
    expect(stages).toContain('topics_fetched');
    expect(stages).toContain('content_generated');
    expect(stages).toContain('quality_filtering');
    
    // Verify compliance status
    expect(result.complianceStatus).toBe('passed');
  });
});