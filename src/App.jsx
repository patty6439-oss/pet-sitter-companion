import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AddEditPet from './pages/AddEditPet';
import PetProfile from './pages/PetProfile';
import DailyChecklist from './pages/DailyChecklist';
import ProofOfLifeUpload from './pages/ProofOfLifeUpload';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/pets/new" element={<ProtectedRoute><AddEditPet /></ProtectedRoute>} />
          <Route path="/pets/:id/edit" element={<ProtectedRoute><AddEditPet /></ProtectedRoute>} />
          <Route path="/pets/:id" element={<ProtectedRoute><PetProfile /></ProtectedRoute>} />
          <Route path="/pets/:id/checklist" element={<ProtectedRoute><DailyChecklist /></ProtectedRoute>} />
          <Route path="/pets/:id/proof-of-life" element={<ProtectedRoute><ProofOfLifeUpload /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
