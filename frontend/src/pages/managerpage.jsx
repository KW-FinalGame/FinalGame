import React from 'react';
import styled from 'styled-components';
import man from "../assets/imgs/man.png";

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
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

const GrayBox = styled.div`
  background-color: #D9D9D9;
  margin-top: 60px;
  margin-bottom: 30px;
  padding: 20px;
  width: 35%;
  height: 700px; /* 필요에 따라 조정 */
  border-radius: 12px;

  @media (max-width: 768px) {
    width: 90%;
  }

  @media (max-width: 480px) {
    width: 95%;
  }
`;
const TopWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding-bottom: 0px;
`;

const ManImage = styled.img`
  width: 130px;
  height: 130px;
  object-fit: contain;
  margin-top:10px;
  margin-bottom: -20px;
  @media (max-width: 768px) {
    width: 80px;
    height: 80px;
  }
`;

const ManualTitle = styled.div`
  font-size: 35px;
  font-weight: bold;
  color: #333;
  margin-top:40px;
  margin-bottom: -20px;
  @media (max-width: 768px) {
    font-size: 38px;
  }
  @media (max-width: 480px) {
    font-size: 25px;
  }
`;

const ManualText = styled.div`
  font-size: 25px;
  font-weight: bold;
  color: #333;
  margin-top:70px;
  margin-left:55px;
  @media (max-width: 768px) {
    font-size: 25px;
  }
  @media (max-width: 480px) {
    font-size: 20px;
    margin-left:10px;

  }
`;
function Manage() {
  return (
    <PageWrapper>
      <Header>
        <LogoText>LOGOTEXT</LogoText>
      </Header>

      <GrayBox>
      <TopWrapper>
        <ManImage src={man} alt="역무원 이미지"/>
        <ManualTitle>역무원 대응 매뉴얼!</ManualTitle>
      </TopWrapper>
      <ManualText>dddd</ManualText>
      </GrayBox>
    </PageWrapper>
  );
}

export default Manage;
