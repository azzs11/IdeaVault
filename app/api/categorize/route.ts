import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { idea } = await req.json();

  if (!idea || typeof idea !== "string") {
    return NextResponse.json({ error: "Missing idea text" }, { status: 400 });
  }

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `Categorize the following idea into exactly one of these domains: Tech, Product, Business, Design, Personal, Research, Other.
Also write a one-sentence summary.

Idea: "${idea}"

Respond with JSON only, no markdown:
{"domain": "<domain>", "summary": "<one-sentence summary>"}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const result = JSON.parse(text);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to parse Claude response", raw: text }, { status: 500 });
  }
}
