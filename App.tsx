import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { StudioLayout } from './layouts/StudioLayout';
import { LibraryPage } from './pages/LibraryPage';
import { StudioPage } from './pages/StudioPage';
import { ReaderPage } from './pages/ReaderPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { SignIn } from './pages/auth/SignIn';
import { SignUp } from './pages/auth/SignUp';
import { Account } from './pages/dashboard/Account';
import { RoutePath } from './types';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path={RoutePath.LOGIN} element={<SignIn />} />
          <Route path={RoutePath.SIGNUP} element={<SignUp />} />

          <Route element={<StudioLayout />}>
            <Route path={RoutePath.HOME} element={<LibraryPage />} />
            <Route path={RoutePath.STUDIO} element={<StudioPage />} />
            <Route path={RoutePath.STUDIO_DETAIL} element={<StudioPage />} />
            <Route path={RoutePath.READER} element={<ReaderPage />} />
            <Route path={RoutePath.ARCHITECTURE} element={<ArchitecturePage />} />
            <Route
              path={RoutePath.ACCOUNT}
              element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to={RoutePath.HOME} replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;