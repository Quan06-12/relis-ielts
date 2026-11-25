// Loads the system tests: tests that come with Relis, so a new user can practise
// before uploading their own tests or joining a class.
//
//   npm run seed:system
//
// System tests belong to a built-in "Relis" account that nobody can sign in to, so nobody can edit them
// in the app. Running the script again only adds the tests that are missing (found by title);
// a test that is already there is left as it is, so attempts and reviews made on it stay valid.

import { pathToFileURL } from 'node:url'
import mongoose from 'mongoose'
import { connectDatabase } from '../src/config/db.js'
import { Test } from '../src/models/Test.js'
import { renumberQuestions } from '../src/utils/testContent.js'
import { SYSTEM_GOOGLE_ID, findOrCreateSystemOwner } from '../src/services/systemOwner.js'
import { demoReadingTest, demoShortTest } from './demoData.js'
import { practiceTests } from './practiceTests.js'
import { listeningTests } from './listeningTests.js'

export { SYSTEM_GOOGLE_ID }

// Every system test, written by the team (no copyrighted exam material)
export function systemTestContents() {
  return [demoReadingTest(), demoShortTest(), ...practiceTests(), ...listeningTests()]
}

// Adds the missing system tests and returns { added, kept } (titles), so tests can call it too.
export async function seedSystemTests() {
  const owner = await findOrCreateSystemOwner()

  const added = []
  const kept = []
  for (const content of systemTestContents()) {
    const existing = await Test.findOne({ isSystem: true, title: content.title, hidden: false })
    if (existing) {
      kept.push(content.title)
      continue
    }
    const test = new Test({ ...content, ownerId: owner._id, status: 'published', isSystem: true })
    test.questionCount = renumberQuestions(test.sections)
    await test.save()
    added.push(content.title)
  }
  return { added, kept }
}

async function main() {
  await connectDatabase(process.env.MONGODB_URI)
  const { added, kept } = await seedSystemTests()
  console.log(`System tests: ${added.length} added, ${kept.length} already there`)
  for (const title of added) console.log(`  + ${title}`)
}

// Run only when started from the command line, not when a test imports this file
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .catch((error) => {
      console.error(error.message)
      process.exitCode = 1
    })
    .finally(() => mongoose.disconnect())
}
