// One-off repair: attempts submitted before blank attempts got no band. For every submitted attempt
// this stores how many questions were answered, and removes the band (0.0) of attempts with no answer,
// so they stop pulling the learner's current band, averages and chart down. Safe to run more than once.
//
//   npm run fix:blank-attempts

import { pathToFileURL } from 'node:url'
import mongoose from 'mongoose'
import { connectDatabase } from '../src/config/db.js'
import { Attempt } from '../src/models/Attempt.js'
import { hasAnswer } from '../src/utils/grading.js'

export async function fixBlankAttempts() {
  let blank = 0
  for (const attempt of await Attempt.find({ status: 'submitted', 'result.answered': { $exists: false } })) {
    const answered = attempt.answers.filter((answer) => hasAnswer(answer.value)).length
    const update = { 'result.answered': answered }
    if (answered === 0) {
      update['result.band'] = null
      blank += 1
    }
    await Attempt.updateOne({ _id: attempt._id }, { $set: update })
  }
  return blank
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  connectDatabase(process.env.MONGODB_URI)
    .then(fixBlankAttempts)
    .then((blank) => console.log(`Blank attempts without a band now: ${blank}`))
    .catch((error) => {
      console.error(error.message)
      process.exitCode = 1
    })
    .finally(() => mongoose.disconnect())
}
