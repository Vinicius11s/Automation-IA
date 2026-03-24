const CHATBASE_URL = "https://www.chatbase.co/api/v1/chat";

export async function getChatbaseSuggestion(
  ticketTitle: string,
  ticketDescription?: string | null
): Promise<string | null> {
  const apiKey = process.env.CHATBASE_API_KEY;
  const chatbotId = process.env.CHATBASE_CHATBOT_ID;

  if (!apiKey || !chatbotId) {
    console.warn("[chatbase] CHATBASE_API_KEY ou CHATBASE_CHATBOT_ID não configurados");
    return null;
  }

  const content = ticketDescription
    ? `Título: ${ticketTitle}\n\nDescrição: ${ticketDescription}`
    : `Título: ${ticketTitle}`;

  const res = await fetch(CHATBASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [{ role: "user", content }],
      chatbotId,
    }),
  });

  if (!res.ok) {
    console.error("[chatbase] Erro na requisição:", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  return data.text ?? null;
}
