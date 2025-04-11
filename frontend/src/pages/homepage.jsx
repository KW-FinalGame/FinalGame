// frontend/src/pages/Home.jsx
import React from 'react';
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
  font-size: 45px;
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
  padding: 20px 60px;
  font-size: 35px;
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


function Home() {
  return (
    <div>
      <Header>
        <LogoText>LOGOTEXT</LogoText>
      </Header>

      <ImageWrapper>
        <StyledImage src={subway} alt="지하철 이미지" />
      </ImageWrapper>

      <ButtonWrapper>
        <CustomButton>로그인</CustomButton>
      </ButtonWrapper>
    </div>
  );
}

export default Home;
