import { Mistral } from '@mistralai/mistralai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.MISTRAL_API_KEY;
const client = apiKey ? new Mistral({ apiKey }) : null;

export async function generateCodePatch(brokenCode, errorMessage) {
  if (!client) {
    console.warn('⚠️ MISTRAL_API_KEY not found in .env. Returning simulated patch.');
    return {
      code: `// OrderController.js - Safe Fallback Patch\nfunction calculateTotal(order) {\n  const price = order?.item?.price || 0;\n  return price * (order?.quantity || 0);\n}`,
      tokens: { prompt: 120, completion: 85, total: 205 },
    };
  }

  try {
    const prompt = `You are an automated code repair agent. Fix this broken JavaScript code.\n\nError: ${errorMessage}\n\nBroken Code:\n${brokenCode}\n\nReturn ONLY the corrected, executable JavaScript code. Do not include markdown formatting or extra explanations.`;

    const response = await client.chat.complete({
      model: 'codestral-latest',
      messages: [{ role: 'user', content: prompt }]
    });

    const patch = response.choices[0].message.content;
    const cleanedCode = patch.replace(/```javascript/g, '').replace(/```/g, '').trim();

    // Extract token usage from response
    const tokens = response.usage
      ? {
          prompt: response.usage.promptTokens || response.usage.prompt_tokens || 0,
          completion: response.usage.completionTokens || response.usage.completion_tokens || 0,
          total: response.usage.totalTokens || response.usage.total_tokens || 0,
        }
      : { prompt: 0, completion: 0, total: 0 };

    return { code: cleanedCode, tokens };
  } catch (err) {
    console.error('Mistral API Call Failed:', err.message);
    throw err;
  }
}