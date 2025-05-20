// frontend/src/pages/Home.jsx
import React, { useState,useRef } from 'react';
import { useNavigate } from 'react-router-dom'; 
import styled from 'styled-components';
import { Button } from 'react-bootstrap';
import axios from 'axios';
import Webcam from 'react-webcam';
import subway from "../assets/imgs/subwayman2.png"; 
import logoImage from "../assets/imgs/logoImage.png";


// ===== Styled Components =====
const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

const Header = styled.header`
  height: 120px;
  border-bottom: 3px solid #D9D9D9;
  text-align: center;
  padding: 0;

  @media (max-width: 768px) {
    height: 90px;
  }

  @media (max-width: 480px) {
    height: 110px;
  }
`;


const LogoImage = styled.img`
  height: 100%;
  padding:10px;
  object-fit: contain;
`;



const ImageWrapper = styled.div`
  text-align: center;
  margin-top: 30px;
`;

const StyledImage = styled.img`
  width: 550px;
  height: auto;
  border-radius: 10px;
  margin-left:130px;
  margin-bottom:-30px;

  @media (max-width: 768px) {
    width: 80%;
    margin-left:130px;
    margin-bottom:-30px;
  }
  @media (max-width: 480px) {
    width: 100%;
    margin-top:50px;
    margin-left:0px;
    margin-bottom:-30px;
  }
`;

const ButtonWrapper = styled.div`
  text-align: center;
  margin-top: 40px;
  padding: 20px 0;
`;

const CustomButton = styled(Button)`
  background-color: #545454 !important;
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
    padding: 14px 40px;
    font-size: 30px;
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
  background-color: #545454;
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

  //청각장애인인증
  const webcamRef = useRef(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [uploading, setUploading] = useState(false);

  
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
      let role = 'user';
  
      // 관리자 계정 확인
      if (loginId === 'admin' && loginPw === 'admin1234') {
        role = 'admin';
      }
  
      const response = await axios.post('http://localhost:3002/login', {
        id: loginId,
        password: loginPw,
        role,
      });
  
      sessionStorage.setItem('accessToken', response.data.token);
      sessionStorage.setItem('userId', response.data.user.id);
      sessionStorage.setItem('userRole', response.data.user.role);
  
      // localStorage에도 역할 저장
      localStorage.setItem('user', JSON.stringify({ username: loginId, role }));
  
      setShowModal(false);
      navigate(role === 'admin' ? '/manage' : '/main');
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
      <Header>
      <LogoImage src={logoImage} alt="로고 이미지" />
    </Header>


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
                <CheckboxInput type="checkbox" checked={isCertified} onChange={() => setShowWebcam(true)} />
                청각장애인 인증 (필수)
              </CheckboxWrapper>
              <Input type="text" placeholder="기타 (기저질환 등, 선택)" value={etc} onChange={(e) => setEtc(e.target.value)} />
              <ConfirmButton disabled={!isFormValid} onClick={handleSignup}>가입하기</ConfirmButton>
              <SignupLink onClick={() => setIsLoginMode(true)}>로그인으로 돌아가기</SignupLink>
            </>
          )}
        </ModalContent>
      </ModalOverlay>
      {showWebcam && (
  <ModalOverlay show={true} onClick={() => setShowWebcam(false)}>
    <ModalContent onClick={(e) => e.stopPropagation()} style={{ position: 'relative'}}>
      <h3 style={{ fontSize: '16px', marginBottom: '12px'}}>장애인증을 네모 박스에 맞춰 촬영해주세요</h3>

      <div style={{ position: 'relative', width: '100%', paddingTop: '75%' }}>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            objectFit: 'cover',
            borderRadius: '10px',
          }}
        />
        {/* 네모 박스 */}
        <div style={{
          position: 'absolute',
          top: '30%', left: '25%',
          width: '50%', height: '40%',
          border: '3px solid red',
          boxSizing: 'border-box',
          zIndex: 2,
        }} />
      </div>
        <div style={{ marginTop: '20px' }}>
      <ConfirmButton onClick={async () => {
        if (!webcamRef.current) return;
        const imageSrc = webcamRef.current.getScreenshot();

        // canvas로 박스 영역 자르기
        const img = new Image();
        img.src = imageSrc;
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const scaleWidth = 640; // 예상 webcam 너비
          const scaleHeight = 480; // 예상 webcam 높이
          canvas.width = 320; // 박스 너비 (예: 50%)
          canvas.height = 192; // 박스 높이 (예: 40%)
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, scaleWidth * 0.25, scaleHeight * 0.3, scaleWidth * 0.5, scaleHeight * 0.4, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('image', blob, 'certification.jpg');

            try {
              setUploading(true);
              await axios.post('http://localhost:3002/upload-disability-image', formData);
              alert('인증서가 업로드되었습니다.');
              setIsCertified(true);
              setShowWebcam(false);
            } catch (err) {
              alert('업로드 실패');
              console.error(err);
            } finally {
              setUploading(false);
            }
          }, 'image/jpeg');
        };
      }}>
        {uploading ? '업로드 중...' : '촬영 및 제출'}
      </ConfirmButton>
      </div>
    </ModalContent>
  </ModalOverlay>
)}

    </PageWrapper>
  );
}

export default Home;
