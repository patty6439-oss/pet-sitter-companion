import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AddEditPet from './pages/AddEditPet';
import PetProfile from './pages/PetProfile';
import DailyChecklist from './pages/DailyChecklist';
import ProofOfLifeUpload from './pages/ProofOfLifeUpload';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pets/new" element={<AddEditPet />} />
        <Route path="/pets/:id/edit" element={<AddEditPet />} />
        <Route path="/pets/:id" element={<PetProfile />} />
        <Route path="/pets/:id/checklist" element={<DailyChecklist />} />
        <Route path="/pets/:id/proof-of-life" element={<ProofOfLifeUpload />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
