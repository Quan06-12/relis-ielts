import { useParams } from 'react-router-dom'
import NewTestForm from '../features/editor/NewTestForm.jsx'
import TestEditor from '../features/editor/TestEditor.jsx'
import '../features/editor/TestEditor.css'

// /tests/new shows the "create test" form; /tests/:testId/edit shows the editor.
export default function TestEditorPage() {
  const { testId } = useParams()
  return testId ? <TestEditor key={testId} testId={testId} /> : <NewTestForm />
}
