// frontend/src/pages/Home.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import styled from 'styled-components';
import { Button } from 'react-bootstrap';
import axios from 'axios';
import subway from "../assets/imgs/subway.png"; 

// ===== Styled Components =====
const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

const Header = styled.header`
  border-bottom: 3px solid #D9D9D9;
  padding: 25px;
  text-align: center;
`;

const LogoText = styled.h1`
  color: gray;
  margin: 0;
  font-size: 50px;
  font-weight: bold;

  @media (max-width: 768px) {
    font-size: 30px;
  }
  @media (max-width: 480px) {
    font-size: 24px;
  }
`;

const ImageWrapper = styled.div`
  text-align: center;
  margin-top: 30px;
`;

const StyledImage = styled.img`
  width: 600px;
  height: auto;
  border-radius: 10px;

  @media (max-width: 768px) {
    width: 80%;
  }
  @media (max-width: 480px) {
    width: 90%;
  }
`;

const ButtonWrapper = styled.div`
  text-align: center;
  margin-top: 40px;
  padding: 20px 0;
`;

const CustomButton = styled(Button)`
  background-color: gray !important;
  margin-top: -20px;
  border: none !important;
  padding: 15px 50px;
  font-size: 30px;
  font-weight: bold;
  color: white !important;
  border-radius: 15px;
  &:hover {
    background-color: #CFCFCF !important;
  }

  @media (max-width: 768px) {
    padding: 15px 40px;
    font-size: 25px;
  }
  @media (max-width: 480px) {
    padding: 12px 30px;
    font-size: 20px;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: ${({ show }) => (show ? 'flex' : 'none')};
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background: white;
  padding: 40px;
  border-radius: 20px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0px 0px 15px rgba(0, 0, 0, 0.2);
`;

const ModalTitle = styled.h2`
  margin-top: 0;
  color: black;
  font-size: 28px;
  margin-bottom: 20px;
`;

const Input = styled.input`
  width: 100%;
  padding: 15px;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  border-radius: 10px;
  background-color: #f2f2f2;
  font-size: 16px;
  &::placeholder {
    color: gray;
  }
`;

const ConfirmButton = styled.button`
  background-color: gray;
  color: white;
  font-size: 16px;
  font-weight: bold;
  border: none;
  padding: 10px 30px;
  border-radius: 10px;
  cursor: pointer;
  display: block;
  margin: 0 auto;
  &:hover {
    background-color: #bbb;
  }
`;

const SignupLink = styled.p`
  text-align: center;
  margin-top: 20px;
  color: #555;
  font-weight: bold;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const CheckboxWrapper = styled.label`
  display: flex;
  align-items: center;
  font-size: 14px;
  margin-bottom: 15px;
`;

const CheckboxInput = styled.input`
  margin-right: 10px;
`;

// ===== Component =====
function Home() {
  const navigate = useNavigate();
  
  const [showModal, setShowModal] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);

  // 로그인
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [loginRole] = useState('user');

  // 회원가입
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [isCertified, setIsCertified] = useState(false);
  const [etc, setEtc] = useState('');

  const isFormValid = name && phone && birthday && userId && password && confirmPw && isCertified && password === confirmPw;

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:3002/login', {
        id: loginId,
        password: loginPw,
        role: loginRole,
      });

      sessionStorage.setItem('accessToken', response.data.token);
      sessionStorage.setItem('userId', response.data.user.id);

      setShowModal(false);
      navigate(response.data.user.role === 'admin' ? '/managepage' : '/homepage');
    } catch (error) {
      console.error('로그인 실패:', error);
      alert('로그인에 실패했습니다.');
    }
  };

  const handleSignup = async () => {
    try {
      await axios.post('http://localhost:3002/register', {
        username: name,
        id: userId,
        password,
        birthday, // 생일 항목이 있다면 state에 추가 필요
        phone_num: phone,
        is_disabled: isCertified,
        special_notes: etc,
      });
      setIsLoginMode(true);
    } catch (error) {
      console.error('회원가입 실패:', error);
      alert('회원가입에 실패했습니다.');
    }
  };

  return (
    <PageWrapper>
      <Header><LogoText>LOGOTEXT</LogoText></Header>

      <ImageWrapper>
        <StyledImage src={subway} alt="지하철 이미지" />
      </ImageWrapper>

      <ButtonWrapper>
        <CustomButton onClick={() => { setIsLoginMode(true); setShowModal(true); }}>로그인</CustomButton>
      </ButtonWrapper>

      {/* 로그인/회원가입 모달 */}
      <ModalOverlay show={showModal} onClick={() => setShowModal(false)}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalTitle>{isLoginMode ? '로그인' : '회원가입'}</ModalTitle>

          {isLoginMode ? (
            <>
              <Input type="text" placeholder="ID" value={loginId} onChange={(e) => setLoginId(e.target.value)} />
              <Input type="password" placeholder="PW" value={loginPw} onChange={(e) => setLoginPw(e.target.value)} />
              <ConfirmButton onClick={handleLogin}>확인</ConfirmButton>
              <SignupLink onClick={() => setIsLoginMode(false)}>회원가입하기</SignupLink>
            </>
          ) : (
            <>
              <Input type="text" placeholder="이름 (필수)" value={name} onChange={(e) => setName(e.target.value)} />
              <Input type="tel" placeholder="전화번호 (필수)" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input
                  type="date"
                  placeholder="생년월일 (필수)"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                />
              <Input type="text" placeholder="아이디 (필수)" value={userId} onChange={(e) => setUserId(e.target.value)} />
              <Input type="password" placeholder="비밀번호 (필수)" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Input type="password" placeholder="비밀번호 확인 (필수)" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
              <CheckboxWrapper>
                <CheckboxInput type="checkbox" checked={isCertified} onChange={(e) => setIsCertified(e.target.checked)} />
                청각장애인 인증 (필수)
              </CheckboxWrapper>
              <Input type="text" placeholder="기타 (기저질환 등, 선택)" value={etc} onChange={(e) => setEtc(e.target.value)} />
              <ConfirmButton disabled={!isFormValid} onClick={handleSignup}>가입하기</ConfirmButton>
              <SignupLink onClick={() => setIsLoginMode(true)}>로그인으로 돌아가기</SignupLink>
            </>
          )}
        </ModalContent>
      </ModalOverlay>
    </PageWrapper>
  );
}

export default Home;
