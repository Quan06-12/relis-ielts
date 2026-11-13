import { Routes, Route } from 'react-router-dom'
import AppLayout from './layouts/AppLayout.jsx'
import RequireAuth from './auth/RequireAuth.jsx'
import LoginPage from './pages/LoginPage.jsx'
import HomePage from './pages/HomePage.jsx'
import LibraryPage from './pages/LibraryPage.jsx'
import TestEditorPage from './pages/TestEditorPage.jsx'
import ClassesPage from './pages/ClassesPage.jsx'
import ClassDetailPage from './pages/ClassDetailPage.jsx'
import VocabPage from './pages/VocabPage.jsx'
import VocabSetPage from './pages/VocabSetPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import AttemptPage from './pages/AttemptPage.jsx'
import ReviewPage from './pages/ReviewPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

// Route table, same structure as the "Site diagram" tab of the project docs.
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Everything below needs a signed-in user (US02) */}
      <Route element={<RequireAuth />}>
        {/* Pages that show the purple navigation bar */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/tests/new" element={<TestEditorPage />} />
          <Route path="/tests/:testId/edit" element={<TestEditorPage />} />
          <Route path="/classes" element={<ClassesPage />} />
          <Route path="/classes/:classId" element={<ClassDetailPage />} />
          <Route path="/vocab" element={<VocabPage />} />
          <Route path="/vocab/:setId" element={<VocabSetPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Route>

        {/* Full-screen pages: no navigation bar while taking or reviewing a test */}
        <Route path="/attempts/:attemptId" element={<AttemptPage />} />
        <Route path="/attempts/:attemptId/review" element={<ReviewPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
