// One-off repair: removes the copy of the section title at the top of passages
// (see src/utils/passageTitle.js). Safe to run more than once.
//
//   npm run fix:passage-titles

import { pathToFileURL } from 'node:url'
import mongoose from 'mongoose'
import { connectDatabase } from '../src/config/db.js'
import { Test } from '../src/models/Test.js'
import { withoutRepeatedTitle } from '../src/utils/passageTitle.js'

export async function fixPassageTitles() {
  let fixed = 0
  for (const test of await Test.find({ skill: 'reading' })) {
    const plain = test.toObject()
    let changed = false
    const sections = plain.sections.map((section) => {
      const repaired = withoutRepeatedTitle(section)
      if (!repaired) return section
      changed = true
      return repaired
    })
    if (changed) {
      await Test.updateOne({ _id: test._id }, { $set: { sections } })
      fixed += 1
    }
  }
  return fixed
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  connectDatabase(process.env.MONGODB_URI)
    .then(fixPassageTitles)
    .then((fixed) => console.log(`Passages fixed in ${fixed} test(s)`))
    .catch((error) => {
      console.error(error.message)
      process.exitCode = 1
    })
    .finally(() => mongoose.disconnect())
}
