// frontend/src/pages/Home.jsx
import React,{ useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import styled from 'styled-components';
import { Button } from 'react-bootstrap';
import subway from "../assets/imgs/subway.png"; 
import axios from 'axios'; // axios import 추가

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

  // 로그인 입력 상태
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [loginRole, setLoginRole] = useState('user');

    const isFormValid = name && phone && userId && password && confirmPw && isCertified;

  
//로그인 함수
const handleLogin = async (data) => {
  try {
    const response = await axios.post('/login', {
      id: data.id,
      password: data.password,
      role: data.role,
    });
    console.log('로그인 성공:', response.data.user.id);
    console.log(response);
    

    sessionStorage.setItem('accessToken', response.data.token);
    sessionStorage.setItem('userId', response.data.user.id);
    dispatch(login([response.data.user.id,response.data.user.username]));
    closeModal();
    if(response.data.user.role == 'admin') navigate('/managepage');
  } catch (error) {
    console.log('로그인 실패:', error);
    alert('로그인 중 오류가 발생했습니다.');
  }
};

//회원가입 함수
const handleSignup = async (data) => {
  try {
    const response = await axios.post('/register', {
      username: data.username,
      id: data.id,
      password: data.password,
      birthday: data.birthdate,
      phone_num: data.phone_num,
      is_disabled: data.is_disabled,
      special_notes: data.special_notes
    })
    console.log('회원가입 성공', response);
    dispatch(toggleMode());

  } catch (error) {
    console.log('회원가입 실패:', error);
    alert('회원가입에 실패했습니다.')
  }
};

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
  return (
    <PageWrapper>
      <Header>
        <LogoText>LOGOTEXT</LogoText>
      </Header>

      <ImageWrapper>
        <StyledImage src={subway} alt="지하철 이미지" />
      </ImageWrapper>

      <ButtonWrapper>
      <CustomButton onClick={openLogin}>로그인</CustomButton>
      </ButtonWrapper>

      
      const [loginId, setLoginId] = useState('');
      const [loginPw, setLoginPw] = useState('');
      const [loginRole, setLoginRole] = useState('user');

      {/* 로그인 모달 */}
      <ModalOverlay show={showModal} onClick={() => setShowModal(false)}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalTitle>로그인</ModalTitle>
          <Input type="text" placeholder="ID" value={loginId} onChange={(e) => setLoginId(e.target.value)} />
          <Input type="password" placeholder="PW" value={loginPw} onChange={(e) => setLoginPw(e.target.value)} />
          <ConfirmButton onClick={handleLogin}>확인</ConfirmButton>
          <SignupLink onClick={() => { setShowModal(false); setShowSignup(true); }}>회원가입하기</SignupLink>
        </ModalContent>
      </ModalOverlay>

      {/* 회원가입 모달 */}
      <ModalOverlay show={showSignup} onClick={() => setShowSignup(false)}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalTitle>회원가입</ModalTitle>
          <Input type="text" placeholder="이름 (필수)" value={name} onChange={(e) => setName(e.target.value)} />
          <Input type="tel" placeholder="전화번호 (필수)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input type="text" placeholder="아이디 (필수)" value={userId} onChange={(e) => setUserId(e.target.value)} />
          <Input type="password" placeholder="비밀번호 (필수)" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input type="password" placeholder="비밀번호 확인 (필수)" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
          <CheckboxWrapper>
            <CheckboxInput
              type="checkbox"
              checked={isCertified}
              onChange={(e) => setIsCertified(e.target.checked)}
            />
            청각장애인 인증 (필수)
          </CheckboxWrapper>
          <Input type="text" placeholder="기타 (기저질환 등, 선택)" value={etc} onChange={(e) => setEtc(e.target.value)} />
          <ConfirmButton disabled={!isFormValid || password !== confirmPw} onClick={handleSignup}>
            가입하기
          </ConfirmButton>
        </ModalContent>
      </ModalOverlay>
    </PageWrapper>
  );
}

export default Home;
