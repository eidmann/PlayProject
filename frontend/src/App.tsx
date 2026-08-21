import { Route, Routes } from 'react-router';
import { EntryListPage } from './pages/EntryListPage';
import { EntryDetailPage } from './pages/EntryDetailPage';
import { EntryFormPage } from './pages/EntryFormPage';

export function App() {
  return (
    <main className="app-shell">
      <h1 className="text-4xl font-bold">MindLog</h1>
      <p className="text-lg">Your journal, with a memory. Built one milestone at a time.</p>
      <Routes>
        <Route path="/" element={<EntryListPage />} />
        <Route path="/entries/new" element={<EntryFormPage />} />
        <Route path="/entries/:id/edit" element={<EntryFormPage />} />
        <Route path="/entries/:id" element={<EntryDetailPage />} />
      </Routes>
    </main>
  );
}
