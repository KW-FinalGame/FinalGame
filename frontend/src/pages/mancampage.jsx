import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam'; 
const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 30px;
`;

const Header = styled.header`
  border-bottom: 3px solid #D9D9D9;
  padding: 25px;
  text-align: center;
  width: 100%;
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

const WebcamBox = styled.div`
  margin-top: 40px;
  width: 80%;
  max-width: 500px;
  aspect-ratio: 4 / 3;
  background: black;
  border-radius: 15px;
  overflow: hidden;
`;

const TextBox = styled.div`
  width: 80%;
  max-width: 500px;
  background-color: #f0f0f0;
  border: 2px solid #ccc;
  border-radius: 10px;
  padding: 15px;
  margin-top: 20px;
  font-size: 18px;
  color: #333;
  text-align: center;
`;

const RoundButton = styled.button`
  width: 60px;
  height: 60px;
  background-color: #EE3232;
  color: white;
  font-size: 25px;
  border: none;
  border-radius: 50%;
  margin-top: 30px;
  cursor: pointer;

  &:hover {
    background-color: #c02727;
  }
`;

function Mancam() {
  const navigate = useNavigate();

  const goBackToManage = () => {
    navigate('/manage');
  };

  return (
    <PageWrapper>
      <Header>
        <LogoText>LOGOTEXT</LogoText>
      </Header>
        
      
        <WebcamBox>
          <Webcam
            audio={false}
            mirrored={true}
            screenshotFormat="image/jpeg"
            style={{ width: '100%', height: '100%' }}
          />
        </WebcamBox>

        <TextBox>
          여기에 사용자의 수화를 인식한 텍스트가 나와요.
        </TextBox>


        <RoundButton onClick={goBackToManage}>✆</RoundButton>
      </PageWrapper>
    
  );
}

export default Mancam;
