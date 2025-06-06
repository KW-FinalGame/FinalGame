import './App.css';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation
} from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Home from './pages/homepage';
import Start from './pages/startpage';
import Main from './pages/mainpage';
import Cam from './pages/campage';
import Manage from './pages/managerpage';
import Mancam from './pages/mancampage';

// 🟦 AnimatePresence를 라우팅 내부에 넣기 위한 래퍼 컴포넌트
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/start" element={<Start />} />
        <Route path="/main" element={<Main />} />
        <Route path="/cam" element={<Cam />} />
        <Route path="/manage" element={<Manage />} />
        <Route path="/mancam" element={<Mancam />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}

export default App;
