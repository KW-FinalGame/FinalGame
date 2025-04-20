import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/homepage';
import Main from './pages/mainpage'; 
import Cam from './pages/campage'; 
import Manage from './pages/managerpage'

function App() {
  return (
    <Router>
      <Routes>
        {/* 로그인 페이지 */}
        <Route path="/" element={<Home />} />
        {/* 메인 페이지 */}
        <Route path="/main" element={<Main />} />
        {/* 통화 페이지 */}
        <Route path="/cam" element={<Cam />} />
        {/* 통화 페이지 */}
        <Route path="/manage" element={<Manage />} />
      </Routes>
    </Router>
  );
}

export default App;
