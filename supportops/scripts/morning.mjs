#!/usr/bin/env node

/**
 * SupportOps Morning Script
 *
 * Fluxo:
 * 1. Lê os dados extraídos das abas do Chrome (passados via stdin como JSON)
 * 2. Envia para a API Claude para análise e classificação
 * 3. Salva o briefing.json em ./supportops-data/
 * 4. Faz hot reload no app via API route
 *
 * Uso:
 *   node scripts/morning.js --input dados-extraidos.json
 *   echo '{"academy": [...], "zendesk": [...]}' | node scripts/morning.js
 *
 * A coleta das abas do Chrome é feita pelo Claude Code lendo MORNING.md
 * e usando a extensão "Claude in Chrome" para acessar as abas abertas.
 */

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "supportops-data");
const BRIEFING_PATH = path.join(DATA_DIR, "briefing.json");

// ─── Read raw input ──────────────────────────────────────────────────────────

async function readInput() {
  // Check for --input flag
  const inputFlag = process.argv.indexOf("--input");
  if (inputFlag !== -1 && process.argv[inputFlag + 1]) {
    const filePath = process.argv[inputFlag + 1];
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }

  // Read from stdin
  if (!process.stdin.isTTY) {
    let data = "";
    for await (const chunk of process.stdin) data += chunk;
    return JSON.parse(data);
  }

  // Demo mode: use mock data when no input provided
  console.log("⚠️  Nenhum input fornecido — usando dados de demonstração");
  return {
    academy: [
      {
        raw_id: "AC-DEMO",
        title: "Não consigo fazer login",
        person: "Usuário Demo",
        status: "open",
        raw_date: new Date().toISOString(),
        raw_text: "Tentei fazer login várias vezes mas continua bloqueado",
      },
    ],
    zendesk: [
      {
        raw_id: "ZD-DEMO",
        title: "Solicito licença adicional",
        person: "Empresa Demo",
        status: "open",
        priority: "high",
        raw_date: new Date().toISOString(),
        raw_text: "Preciso de mais uma licença para minha equipe",
      },
    ],
  };
}

// ─── Classify & analyze with Claude ─────────────────────────────────────────

async function analyzeWithClaude(rawData) {
  const client = new Anthropic();

  const ticketList = [
    ...rawData.academy.map((t) => ({ ...t, source: "academy" })),
    ...rawData.zendesk.map((t) => ({ ...t, source: "zendesk" })),
  ];

  const prompt = `Você é um assistente de suporte técnico sênior. Analise os tickets abaixo e retorne um JSON estruturado.

TICKETS BRUTOS:
${JSON.stringify(ticketList, null, 2)}

Para cada ticket, determine:
1. category: "licenca" | "bug" | "faq" | "suporte" | "sugestao"
   - licenca: pedidos de acesso, liberação, ativação de plano
   - bug: erros técnicos, problemas de sistema
   - faq: dúvidas com resposta padrão conhecida
   - suporte: atendimento que precisa de análise
   - sugestao: melhorias, feedbacks positivos
2. priority: "urgent" | "high" | "normal" | "low"
   - urgent: sem acesso (bloqueando trabalho), erro crítico, risco de cancelamento
   - high: problema ativo, espera > 2h, licença corporativa
   - normal: dúvida simples, pedido padrão
   - low: sugestão, feedback
3. suggested_response: resposta pronta em português brasileiro, tom profissional e amigável
4. tags: array de 2-4 tags descritivas
5. column: "triagem" (coluna inicial para todos)
6. time_open: calcule baseado em raw_date vs agora

Além dos tickets individuais, forneça:
- claude_analysis: parágrafo com análise geral do dia
- priorities: array com top 3 prioridades em formato "ID: descrição (tempo aberto)"

Retorne APENAS JSON válido neste formato exato:
{
  "generated_at": "ISO timestamp",
  "summary": {
    "total": N,
    "urgent": N,
    "academy": N,
    "zendesk": N,
    "pending_licenses": N
  },
  "priorities": ["string1", "string2", "string3"],
  "claude_analysis": "parágrafo",
  "tickets": [
    {
      "id": "AC-001",
      "source": "academy",
      "title": "...",
      "person": "...",
      "status": "open",
      "priority": "...",
      "category": "...",
      "time_open": "1h 30m",
      "suggested_response": "...",
      "tags": [...],
      "column": "triagem"
    }
  ]
}`;

  console.log("🤖 Analisando tickets com Claude...");

  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Resposta inesperada da API");

  // Extract JSON from response
  const text = content.text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("JSON não encontrado na resposta");

  return JSON.parse(jsonMatch[0]);
}

// ─── Save briefing ────────────────────────────────────────────────────────────

function saveBriefing(briefing) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(BRIEFING_PATH, JSON.stringify(briefing, null, 2), "utf-8");
  console.log(`✅ Briefing salvo em: ${BRIEFING_PATH}`);
}

// ─── Notify app (hot reload) ──────────────────────────────────────────────────

async function notifyApp() {
  try {
    const res = await fetch("http://localhost:3000/api/briefing/reload", {
      method: "POST",
    });
    if (res.ok) {
      console.log("🔄 App notificado — reload do briefing disparado");
    }
  } catch {
    console.log(
      "ℹ️  App não está rodando localmente (isso é normal em modo offline)"
    );
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌅 SupportOps Morning Script");
  console.log("═".repeat(40));

  try {
    const rawData = await readInput();
    console.log(
      `📥 Input: ${rawData.academy?.length ?? 0} tickets Academy, ${rawData.zendesk?.length ?? 0} tickets Zendesk`
    );

    const briefing = await analyzeWithClaude(rawData);
    console.log(`📊 Analisados: ${briefing.tickets.length} tickets total`);
    console.log(`🚨 Urgentes: ${briefing.summary.urgent}`);
    console.log(`🔑 Licenças pendentes: ${briefing.summary.pending_licenses}`);

    saveBriefing(briefing);
    await notifyApp();

    console.log("\n✨ Morning briefing pronto!");
    console.log("\nTop prioridades:");
    briefing.priorities.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
    console.log("");
  } catch (err) {
    console.error("❌ Erro:", err.message);
    process.exit(1);
  }
}

main();
