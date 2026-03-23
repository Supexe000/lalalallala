import { Routes, Route } from 'react-router-dom';
import CreateQuiz from './pages/CreateQuiz';
import TakeQuiz from './pages/TakeQuiz';
import Leaderboard from './pages/Leaderboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<CreateQuiz />} />
      <Route path="/quiz/:id" element={<TakeQuiz />} />
      <Route path="/leaderboard/:id" element={<Leaderboard />} />
    </Routes>
  );
}

export default App;
