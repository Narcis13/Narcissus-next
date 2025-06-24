"use server";

import { db } from "@/db";
import { workflows } from "@/db/schema";

export async function seedWorkflows(userId: string) {
  const sampleWorkflows = [
    {
      name: "Daily Report Generator",
      description: "Generates daily reports from multiple data sources",
      jsonData: {
        nodes: [
          { id: "http.request.get", params: { url: "https://api.example.com/data" } },
          { id: "data.transform.mapper", params: { operation: "extract" } },
          { id: "ai.openai.completion", params: { prompt: "Generate report" } },
          { id: "communication.email.send", params: { to: "team@example.com" } }
        ]
      }
    },
    {
      name: "Customer Onboarding Flow",
      description: "Automated customer onboarding with email sequences",
      jsonData: {
        nodes: [
          { id: "logic.control.delay", params: { duration: 300 } },
          { id: "communication.email.send", params: { template: "welcome" } },
          { id: "logic.condition.if", params: { condition: "hasCompletedProfile" } },
          { id: "communication.email.send", params: { template: "next-steps" } }
        ]
      }
    },
    {
      name: "Data Processing Pipeline",
      description: "ETL pipeline for processing incoming data",
      jsonData: {
        nodes: [
          { id: "database.query.select", params: { query: "SELECT * FROM raw_data" } },
          { id: "data.transform.mapper", params: { operation: "transform" } },
          { id: "data.combine.merge", params: { strategy: "concat" } },
          { id: "database.query.insert", params: { table: "processed_data" } }
        ]
      }
    },
    {
      name: "Social Media Monitor",
      description: "Monitors social media mentions and responds",
      jsonData: {
        nodes: [
          { id: "http.request.get", params: { url: "https://api.twitter.com/mentions" } },
          { id: "ai.openai.completion", params: { prompt: "Analyze sentiment" } },
          { id: "logic.condition.if", params: { condition: "isNegative" } },
          { id: "communication.webhook.send", params: { url: "https://slack.webhook" } }
        ]
      }
    },
    {
      name: "Backup Automation",
      description: "Automated backup workflow for critical data",
      jsonData: {
        nodes: [
          { id: "database.query.select", params: { query: "SELECT * FROM users" } },
          { id: "data.transform.mapper", params: { operation: "compress" } },
          { id: "http.request.post", params: { url: "https://backup.service.com" } },
          { id: "communication.email.send", params: { to: "admin@example.com" } }
        ]
      }
    }
  ];

  await db.insert(workflows).values(
    sampleWorkflows.map(w => ({
      userId,
      name: w.name,
      description: w.description,
      jsonData: w.jsonData,
    }))
  );
}