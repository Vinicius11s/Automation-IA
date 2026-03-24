#!/usr/bin/env node

/**
 * SupportOps Morning Script
 *
 * Fluxo:
 * 1. Lê os dados extraídos das abas do Chrome
 * 2. Busca as colunas existentes no app
 * 3. Carrega a FAQ (supportops-data/faq.md) se existir
 * 4. Envia para OpenAI para análise, classificação e atribuição de coluna
 * 5. Faz upsert no banco via POST /api/collect
 *    - Confiança >= 0.8 → coluna sugerida pela IA
 *    - Confiança < 0.8 → coluna Triagem
 *    - Tickets resolvidos → ignorados
 */

import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Load .env.local
const envLocalPath = path.join(ROOT, ".env.local");
if (fs.existsSync(envLocalPath)) {
  const lines = fs.readFileSync(envLocalPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !(key in process.env)) process.env[key] = value;
  }
}

const APP_URL = process.env.SUPPORTOPS_URL ?? "http://localhost:3000";
const FAQ_PATH = path.join(ROOT, "supportops-data", "faq.md");

// ─── Read raw input ──────────────────────────────────────────────────────────

async function readInput() {
  const inputFlag = process.argv.indexOf("--input");
  if (inputFlag !== -1 && process.argv[inputFlag + 1]) {
    const filePath = process.argv[inputFlag + 1];
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }

  if (!process.stdin.isTTY) {
    let data = "";
    for await (const chunk of process.stdin) data += chunk;
    return JSON.parse(data);
  }

  console.log("⚠️  Nenhum input fornecido — usando dados de demonstração");
  return {
    academy: [
      {
        raw_id: "700001",
        title: "Solicitação licença Profit TraderExpo",
        description: "Preciso liberar o acesso ao Profit para minha conta.",
        platform: "Web",
        person: "Usuário Demo",
        raw_date: new Date().toISOString(),
        department_tag: "Licença",
      },
    ],
  };
}

// ─── Fetch columns from app ──────────────────────────────────────────────────

async function fetchColumns() {
  try {
    const res = await fetch(`${APP_URL}/api/columns?department=suporte`);
    if (!res.ok) return [];
    const cols = await res.json();
    return cols.map((c) => ({ id: c.id, title: c.title }));
  } catch {
    return [];
  }
}

// ─── Analyze with OpenAI ─────────────────────────────────────────────────────

async function analyzeWithClaude(rawData, columns) {
  const client = new OpenAI();
  const ticketList = rawData.academy.map((t) => ({ ...t, source: "academy" }));
  const now = new Date().toISOString();

  const faqSection = fs.existsSync(FAQ_PATH)
    ? `\n\nBASE DE CONHECIMENTO FAQ:\n${fs.readFileSync(FAQ_PATH, "utf-8")}`
    : "";

  const columnSection =
    columns.length > 0
      ? `\n\nCOLUNAS DISPONÍVEIS NO KANBAN:\n${columns.map((c) => `- "${c.title}"`).join("\n")}\n\nPara cada ticket, sugira a coluna mais adequada e informe a confiança (0.0 a 1.0). Se confiança >= 0.8, o ticket será colocado direto nessa coluna. Caso contrário, irá para Triagem.`
      : "";

  const prompt = `Você é um assistente de suporte técnico sênior. Analise os tickets da Academy e retorne um JSON estruturado.

DATA/HORA ATUAL: ${now}
${columnSection}
${faqSection}

TICKETS BRUTOS:
${JSON.stringify(ticketList, null, 2)}

Para cada ticket, determine:

1. category: "licenca" | "bug" | "faq" | "suporte" | "sugestao"
   - licenca: pedidos de acesso, liberação, ativação de plano
   - bug: erros técnicos, problemas de sistema
   - faq: dúvidas com resposta padrão conhecida (use a base FAQ acima)
   - suporte: atendimento que precisa de análise
   - sugestao: melhorias, feedbacks positivos

2. priority: "urgent" | "high" | "normal"
   - urgent: sem acesso bloqueando trabalho, erro crítico, risco de cancelamento
   - high: problema ativo, espera > 2h
   - normal: dúvida simples, pedido padrão

3. tags: array de 2-4 tags descritivas

4. time_open: tempo desde raw_date até agora (ex: "2h 30m", "1d 4h")

5. external_id: use APENAS os números do campo raw_id (ex: "725295")

6. suggested_column: título exato de uma das colunas disponíveis acima, ou "Triagem" se não tiver certeza

7. confidence: número de 0.0 a 1.0 indicando certeza na atribuição de coluna
   - 0.9+: certeza alta (ticket vai direto para a coluna sugerida)
   - 0.8-0.89: certeza boa
   - < 0.8: incerto (ticket vai para Triagem para revisão manual)

Além dos tickets, forneça:
- claude_analysis: parágrafo com análise geral do dia
- priorities: array com top 3 prioridades em formato "ID: descrição (tempo aberto)"

Retorne APENAS JSON válido neste formato:
{
  "generated_at": "${now}",
  "summary": {
    "total": N,
    "urgent": N,
    "academy": N,
    "zendesk": 0,
    "pending_licenses": N
  },
  "priorities": ["string1", "string2", "string3"],
  "claude_analysis": "parágrafo",
  "tickets": [
    {
      "external_id": "725295",
      "source": "academy",
      "title": "...",
      "description": "...",
      "person": "...",
      "status": "open",
      "priority": "...",
      "category": "...",
      "time_open": "...",
      "tags": [...],
      "platform": "...",
      "suggested_column": "Liberar Licença",
      "confidence": 0.95
    }
  ]
}`;

  console.log("🤖 Analisando tickets com OpenAI...");
  if (columns.length > 0) {
    console.log(`📋 Colunas disponíveis: ${columns.map((c) => c.title).join(", ")}`);
  }
  if (fs.existsSync(FAQ_PATH)) {
    console.log("📖 FAQ carregada");
  }

  const message = await client.chat.completions.create({
    model: "gpt-3.5-turbo",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.choices[0].message.content.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("JSON não encontrado na resposta");

  return JSON.parse(jsonMatch[0]);
}

// ─── Collect: upsert tickets + briefing into the app ─────────────────────────

async function collectToApp(briefing) {
  const { tickets, generated_at, summary, priorities, claude_analysis } = briefing;

  const res = await fetch(`${APP_URL}/api/collect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tickets,
      briefing: { generated_at, summary, priorities, claude_analysis },
      department: "suporte",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST /api/collect falhou (${res.status}): ${text}`);
  }

  return res.json();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌅 SupportOps Morning Script");
  console.log("═".repeat(40));

  try {
    const [rawData, columns] = await Promise.all([readInput(), fetchColumns()]);
    console.log(`📥 Input: ${rawData.academy?.length ?? 0} tickets Academy`);

    const briefing = await analyzeWithClaude(rawData, columns);
    console.log(`📊 Analisados: ${briefing.tickets.length} tickets`);
    console.log(`🚨 Urgentes: ${briefing.summary.urgent}`);
    console.log(`🔑 Licenças pendentes: ${briefing.summary.pending_licenses}`);

    const highConfidence = briefing.tickets.filter((t) => (t.confidence ?? 0) >= 0.8).length;
    if (highConfidence > 0) {
      console.log(`🎯 ${highConfidence} ticket(s) atribuídos diretamente pela IA`);
    }

    console.log(`\n📡 Enviando para ${APP_URL}/api/collect...`);
    const result = await collectToApp(briefing);
    const parts = [
      `inseridos: ${result.inserted}`,
      `atualizados: ${result.updated}`,
      `ignorados: ${result.skipped}`,
    ];
    if (result.reopened > 0) parts.push(`🔄 reabertos: ${result.reopened}`);
    console.log(`✅ Banco atualizado — ${parts.join(", ")}`);

    console.log("\n✨ Morning briefing pronto!");
    if (briefing.priorities?.length) {
      console.log("\nTop prioridades:");
      briefing.priorities.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
    }
    console.log("");
  } catch (err) {
    console.error("❌ Erro:", err.message);
    process.exit(1);
  }
}

main();
