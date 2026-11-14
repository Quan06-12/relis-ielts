import { AppError } from '../errors/AppError.js'
import { parseFeedback } from '../utils/feedbackPrompt.js'

// Calls the Gemini API (US49). Returns a function (prompt) => { summary, weakTypes, tips, model }.
// Tests pass a fake instead, so they never call Google.
export function createGeminiFeedback({ apiKey = process.env.GEMINI_API_KEY, model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite' } = {}) {
  return async function generateFeedback(prompt) {
    if (!apiKey) {
      throw new AppError(502, 'AI_FEEDBACK_FAILED', 'AI feedback is not configured on the server (GEMINI_API_KEY)')
    }

    let reply
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
        }),
      })
      if (!response.ok) {
        // 429 = free quota used up; other codes = wrong key, model name, or Google is down
        throw new Error(`Gemini answered ${response.status}`)
      }
      const data = await response.json()
      reply = data.candidates?.[0]?.content?.parts?.[0]?.text
    } catch (error) {
      console.error('Gemini request failed:', error.message)
      throw new AppError(502, 'AI_FEEDBACK_FAILED', 'Could not get feedback from the AI, please try again later')
    }

    try {
      return { ...parseFeedback(reply), model }
    } catch (error) {
      console.error('Gemini reply could not be read:', error.message)
      throw new AppError(502, 'AI_FEEDBACK_FAILED', 'The AI reply could not be read, please try again')
    }
  }
}
