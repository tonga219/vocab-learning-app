import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppDataProvider, useAppData } from './hooks/useAppData';
import { ToastProvider } from './hooks/useToast';
import { Layout } from './components/Layout';
import { TodayPage } from './pages/TodayPage';
import { LibraryPage } from './pages/LibraryPage';
import { FolderPage } from './pages/FolderPage';
import { StudySetPage } from './pages/StudySetPage';
import { AddVocabularyPage } from './pages/AddVocabularyPage';
import { SettingsPage } from './pages/SettingsPage';
import { DailyReviewPage, ManualStudyPage } from './pages/ReviewPages';
import { ScrollToTop } from './components/ScrollToTop';

function AppRoutes() {
  const { ready } = useAppData();
  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center" aria-busy="true">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
      </div>
    );
  }
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<TodayPage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="library/:folderId" element={<FolderPage />} />
        <Route path="library/:folderId/:setId" element={<StudySetPage />} />
        <Route path="library/:folderId/:setId/add" element={<AddVocabularyPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="review/:mode" element={<DailyReviewPage />} />
      <Route path="study/:setId/:mode" element={<ManualStudyPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppDataProvider>
        <ToastProvider>
          <ScrollToTop />
          <AppRoutes />
        </ToastProvider>
      </AppDataProvider>
    </BrowserRouter>
  );
}
