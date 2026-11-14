import mongoose from 'mongoose'
import { Attempt } from '../models/Attempt.js'
import { Test } from '../models/Test.js'
import { AppError, notFound } from '../errors/AppError.js'
import { accuracyByType, buildFeedbackPrompt } from '../utils/feedbackPrompt.js'

// POST /api/attempts/:attemptId/feedback — AI feedback on my submitted attempt (US49)
// Made once and stored on the attempt, so opening the review again does not use more Gemini quota.
export function createFeedbackController(generateFeedback) {
  return async function requestFeedback(request, response) {
    const { attemptId } = request.params
    const attempt = mongoose.isValidObjectId(attemptId) ? await Attempt.findOne({ _id: attemptId, userId: request.userId }) : null
    if (!attempt) throw notFound('Attempt')

    if (attempt.status !== 'submitted') {
      throw new AppError(409, 'ATTEMPT_NOT_SUBMITTED', 'This attempt has not been submitted yet')
    }

    if (attempt.feedback) {
      return response.json({ feedback: attempt.feedback })
    }

    const test = await Test.findById(attempt.testId)
    const prompt = buildFeedbackPrompt({
      skill: test.skill,
      result: attempt.result,
      byType: accuracyByType(test, attempt.answers, attempt.mode.sectionIndexes),
    })
    const { summary, weakTypes, tips, model } = await generateFeedback(prompt)

    attempt.feedback = { summary, weakTypes, tips, model, createdAt: new Date() }
    await attempt.save()

    response.status(201).json({ feedback: attempt.feedback })
  }
}
