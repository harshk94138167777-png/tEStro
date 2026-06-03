import OpenAI from 'openai';

const client = () =>
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

export async function chat(req, res, next) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: 'OPENAI_API_KEY is not configured on the server' });
    }
    const { messages, context } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const system = [
      'You are tEStro AI, an educational cybersecurity assistant.',
      'You must refuse instructions to attack, exploit, or harm systems without authorization.',
      'Explain defensive mitigations, safe testing practices, and how to fix issues from simulation results.',
      context ? `Optional user context (JSON): ${JSON.stringify(context).slice(0, 4000)}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const completion = await client().chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'system', content: system }, ...messages.slice(-20)],
      temperature: 0.4,
      max_tokens: 1200,
    });

    const text = completion.choices[0]?.message?.content?.trim() || '';
    res.json({ reply: text });
  } catch (e) {
    next(e);
  }
}
