import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/homepage';
import Start from './pages/startpage';
import Main from './pages/mainpage'; 
import Cam from './pages/campage'; 
import Manage from './pages/managerpage';
import Mancam from './pages/mancampage';

function App() {
  return (
    <Router>
      <Routes>
        {/* 로그인 페이지 */}
        <Route path="/" element={<Home />} />
        {/* 시작 페이지 */}
        <Route path="/start" element={<Start />} />
        {/* 메인 페이지 */}
        <Route path="/main" element={<Main />} />
        {/* 통화 페이지 */}
        <Route path="/cam" element={<Cam />} />
        {/* 역무원 페이지 */}
        <Route path="/manage" element={<Manage />} />
        {/* 역무원 통화 페이지 */}
        <Route path="/mancam" element={<Mancam />} />
      </Routes>
    </Router>
  );
}

export default App;
