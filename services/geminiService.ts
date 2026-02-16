import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY;

// Initialize the client safely.
// Note: In a real app, we would handle missing keys more gracefully in the UI.
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateGhostText = async (
  context: string,
  title: string
): Promise<string | null> => {
  if (!ai) return null;

  try {
    const model = 'gemini-3-flash-preview'; // Fast model for completions
    const prompt = `
      You are a "Ghost Writer", a proactive thought partner for a writer.
      
      Document Title: ${title}
      
      Current Text Context (end of document):
      "${context.slice(-1000)}"
      
      Task: Suggest a short, natural continuation of the text (max 1-2 sentences). 
      Match the tone and style of the existing text. 
      Do not repeat the last sentence. 
      Do not add commentary. Just the text.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        maxOutputTokens: 60,
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text?.trim() || null;
  } catch (error) {
    console.error("Ghost Writer Error:", error);
    return null;
  }
};

export const refineText = async (
  selection: string,
  instruction: string,
  fullContext: string
): Promise<string | null> => {
  if (!ai) return null;

  try {
    const model = 'gemini-3-pro-preview'; // Smarter model for editing
    const prompt = `
      You are an expert editor.
      
      Context: The user is writing a document.
      Full Context Sample: "${fullContext.slice(0, 500)}..."
      
      Selected Text to Edit: "${selection}"
      
      User Instruction: "${instruction}"
      
      Task: Rewrite the selected text based on the instruction. 
      Return ONLY the rewritten text. No quotes, no explanations.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        maxOutputTokens: 200, // Allow enough space for a paragraph rewrite
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text?.trim() || null;
  } catch (error) {
    console.error("Refine Text Error:", error);
    return null;
  }
};

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const sendChatMessage = async (
  history: ChatMessage[],
  newMessage: string,
  documentContext: { title: string; content: string }
): Promise<string | null> => {
  if (!ai) return "AI Service not initialized (Missing API Key).";

  try {
    const model = 'gemini-3-flash-preview';

    // Construct the chat history for the SDK
    // The SDK expects 'user' and 'model' roles.
    const chatHistory = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    const chat = ai.chats.create({
      model,
      history: chatHistory,
      config: {
        systemInstruction: `
          You are an intelligent writing assistant embedded in a text editor.
          
          CURRENT DOCUMENT CONTEXT:
          Title: "${documentContext.title}"
          Content: "${documentContext.content.slice(0, 5000)}" 
          (Note: Content is truncated for efficiency if very long).

          Your Goal: Help the user brainstorm, edit, research, or critique their work.
          Tone: Helpful, concise, and sophisticated.
          Format: Use Markdown for formatting. If the user asks for a rewrite, provide just the text or the text with a brief explanation.
        `,
      }
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text;
  } catch (error) {
    console.error("Chat Error:", error);
    return "I'm having trouble connecting right now. Please try again.";
  }
};

export interface ToneAnalysis {
  overall: string;
  confidence: number;
  traits: { label: string; value: number }[];
  suggestion: string;
}

export const analyzeTone = async (
  content: string,
  title: string
): Promise<ToneAnalysis | null> => {
  if (!ai) return null;

  try {
    const model = 'gemini-3-flash-preview';
    const prompt = `
      Analyze the writing tone and style of this document.
      
      Title: "${title}"
      Content: "${content.slice(0, 3000)}"
      
      Return a JSON object with this exact structure:
      {
        "overall": "<one word: e.g. Formal, Casual, Poetic, Persuasive, Academic, Conversational, Melancholic, Humorous, Authoritative, Reflective>",
        "confidence": <0.0 to 1.0>,
        "traits": [
          { "label": "Formality", "value": <0-100> },
          { "label": "Emotion", "value": <0-100> },
          { "label": "Clarity", "value": <0-100> },
          { "label": "Creativity", "value": <0-100> }
        ],
        "suggestion": "<one brief sentence of stylistic advice>"
      }
      
      Return ONLY the JSON object. No markdown, no code fences, no explanation.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        maxOutputTokens: 200,
        temperature: 0.3,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    const text = response.text?.trim();
    if (!text) return null;

    // Clean potential markdown fences
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Tone Analysis Error:", error);
    return null;
  }
};

export const continueFromCursor = async (
  textBeforeCursor: string,
  textAfterCursor: string,
  title: string
): Promise<string | null> => {
  if (!ai) return null;

  try {
    const model = 'gemini-3-flash-preview';
    const prompt = `
      You are a "Ghost Writer" continuing text from the middle of a document.
      
      Document Title: ${title}
      
      Text BEFORE cursor:
      "${textBeforeCursor.slice(-800)}"
      
      Text AFTER cursor (for context):
      "${textAfterCursor.slice(0, 400)}"
      
      Task: Write a natural continuation (1-2 sentences) that bridges from the text before the cursor.
      It should flow naturally into the text after the cursor if present.
      Match the exact tone and style. Return ONLY the text. No quotes, no commentary.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        maxOutputTokens: 80,
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text?.trim() || null;
  } catch (error) {
    console.error("Continue From Cursor Error:", error);
    return null;
  }
};