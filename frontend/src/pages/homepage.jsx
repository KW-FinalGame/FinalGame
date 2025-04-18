// frontend/src/pages/Home.jsx
import React,{ useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import styled from 'styled-components';
import { Button } from 'react-bootstrap';
import subway from "../assets/imgs/subway.png"; 

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
  margin-top:-20px;
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

//Modal Style
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


function Home() {
   const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [showSignup, setShowSignup] = useState(false);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [isCertified, setIsCertified] = useState(false);
    const [etc, setEtc] = useState('');

    const isFormValid = name && phone && userId && password && confirmPw && isCertified;

  
    const openLogin = () => {
      setShowModal(true);
      setShowSignup(false);
    };
    const closeLogin = () => setShowModal(false);
    const openSignup = () => {
      setShowModal(false);
      setShowSignup(true);
    };
    const closeSignup = () => setShowSignup(false);

    const handleLogin = () => {
      navigate('/main');
    }
  return (
    <div>
      <Header>
        <LogoText>LOGOTEXT</LogoText>
      </Header>

      <ImageWrapper>
        <StyledImage src={subway} alt="지하철 이미지" />
      </ImageWrapper>

      <ButtonWrapper>
      <CustomButton onClick={openLogin}>로그인</CustomButton>
      </ButtonWrapper>

      
      {/* 로그인 모달 */}
      <ModalOverlay show={showModal} onClick={closeLogin}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalTitle>로그인</ModalTitle>
          <Input type="text" placeholder="ID" required />
          <Input type="password" placeholder="PW" required />
          <ConfirmButton onClick={handleLogin}>확인</ConfirmButton>
          <SignupLink onClick={openSignup}>회원가입하기</SignupLink>
        </ModalContent>
      </ModalOverlay>

      {/* 회원가입 모달 */}
      <ModalOverlay show={showSignup} onClick={closeSignup}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalTitle>회원가입</ModalTitle>
          <Input type="text" placeholder="이름 (필수)" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input type="tel" placeholder="전화번호 (필수)" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <Input type="text" placeholder="아이디 (필수)" value={userId} onChange={(e) => setUserId(e.target.value)} required />
          <Input type="password" placeholder="비밀번호 (필수)" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Input type="password" placeholder="비밀번호 확인 (필수)" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required />
          <CheckboxWrapper>
            <CheckboxInput
              type="checkbox"
              checked={isCertified}
              onChange={(e) => setIsCertified(e.target.checked)}
              required
            />
            청각장애인 인증 (필수)
          </CheckboxWrapper>
          <Input type="text" placeholder="기타 (기저질환 등, 선택)" value={etc} onChange={(e) => setEtc(e.target.value)} />
          <ConfirmButton disabled={!isFormValid} onClick={() => {
            // 가입 완료 후 로그인 모달로 전환
            setShowSignup(false);
            setShowModal(true);
            }}>
            가입하기
          </ConfirmButton>
        </ModalContent>
      </ModalOverlay>
    </div>
  );
}

export default Home;
