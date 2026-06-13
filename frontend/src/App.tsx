import { Routes, Route, Navigate } from 'react-router-dom';
import { useSessionStore } from './stores/sessionStore';
import HomeScreen from './screens/HomeScreen/HomeScreen';
import WaitingRoomScreen from './screens/WaitingRoomScreen/WaitingRoomScreen';
import MatchScreen from './screens/MatchScreen/MatchScreen';
import AppShell from './components/AppShell/AppShell';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const sessionToken = useSessionStore((s) => s.sessionToken);
  if (!sessionToken) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route
          path="/waiting-room/:matchId"
          element={
            <ProtectedRoute>
              <WaitingRoomScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/match/:matchId"
          element={
            <ProtectedRoute>
              <MatchScreen />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
