import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/homepage';
import Main from './pages/mainpage'; 

function App() {
  return (
    <Router>
      <Routes>
        {/* 로그인 페이지 */}
        <Route path="/" element={<Home />} />
        {/* 메인 페이지 */}
        <Route path="/main" element={<Main />} />
      </Routes>
    </Router>
  );
}

export default App;
