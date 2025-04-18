import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import subway from "../assets/imgs/subway.png";

// 호선별 색상 매핑
const lineColors = {
  1: '#0052A4',
  2: '#009D3E',
  3: '#EF7C1C',
  4: '#00A5DE',
  5: '#996CAC',
  6: '#CD7C2F',
  7: '#747F00',
  8: '#E6186C',
  9: '#BDB092'
};

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

const TopWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding-bottom: 10px;
`;

const SubwayLogo = styled.img`
  width: 120px;
  height: 120px;
  object-fit: contain;
  margin-left : -30px;
  margin-top:10px;
  margin-bottom: -20px;
  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
  }
`;

const UserName = styled.div`
  font-size: 45px;
  font-weight: bold;
  color: #333;
  margin-top:10px;
  margin-bottom: -20px;
  @media (max-width: 768px) {
    font-size: 42px;
  }
  @media (max-width: 480px) {
    font-size: 35px;
  }
`;

const GrayBoxWrapper = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const GrayBox = styled.div`
  background-color: #f0f0f0;
  width: 80%;
  max-width: 450px;
  height: 95%;
  border-radius: 15px;
  border: 2.5px solid #ccc;
  margin-top:-30px;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;

  @media (max-width: 768px) {
    width: 90%;
  }
`;

const Title = styled.div`
  font-size: 25px;
  font-weight: bold;
  margin-bottom: 8px;
  margin-top:15px;
  text-align: left;
  padding-left: 8px;
`;

const StationList = styled.div`
  max-height: 700px;
  overflow-y: auto;
  width: 100%;
  padding: 0 10px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #ccc;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
`;

const StationItem = styled.div`
  display: flex;
  align-items: center;
  background-color: white;
  padding: 15px 20px;
  border-radius: 10px;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  font-size: 25px;
  line-height: 2.5;

  @media (max-width: 768px) {
    padding: 12px 15px;
  }

  @media (max-width: 480px) {
    padding: 10px 12px;
  }
`;

const LineCircle = styled.div`
  width: 40px;
  height: 40px;
  background-color: ${props => lineColors[props.line] || '#aaa'};
  color: white;
  font-weight: bold;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  flex-shrink: 0;
`;

const StationName = styled.div`
  font-size: 23px;
  color: #333;
`;

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
`;

const Modal = styled.div`
  background-color: white;
  padding: 30px;
  border-radius: 10px;
  width: 80%;
  max-width: 400px;
  text-align: center;
`;

const ModalTitle = styled.h2`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
`;

const CloseButton = styled.button`
  background-color: #EE3232;
  color: white;
  border: 100px;
  padding: 10px 15px;
  border-radius: 50%;
  cursor: pointer;

  &:hover {
    background-color: #EE3232;
  }
`;

function Main() {
  const [selectedStation, setSelectedStation] = useState(null);
  const navigate = useNavigate();

  // 샘플 데이터 (API로 바꿔도 OK)
  const nearbyStations = [
    { name: "서울역", line: 1 },
    { name: "충정로", line: 2 },
    { name: "신촌", line: 2 },
    { name: "공덕", line: 5 },
    { name: "종로3가", line: 3 },
    { name: "명동", line: 4 },
    { name: "충정로", line: 2 },
    { name: "신촌", line: 2 },
    { name: "공덕", line: 5 },
    { name: "종로3가", line: 3 },
    { name: "명동", line: 4 },
  ];

  const handleStationClick = (stationName) => {
    setSelectedStation(stationName); // 클릭한 역 이름 저장
  };

  const closeModal = () => {
    setSelectedStation(null); // 모달 닫기
  };

  return (
    <PageWrapper>
      <Header>
        <LogoText>LOGOTEXT</LogoText>
      </Header>

      <TopWrapper>
        <SubwayLogo src={subway} alt="지하철 로고" />
        <UserName>홍길동님!</UserName>
      </TopWrapper>

      <GrayBoxWrapper>
        <GrayBox>
          <Title>해당 역을 선택하세요!</Title>
          <StationList>
            {nearbyStations.map((station, index) => (
              <StationItem key={index} onClick={() => handleStationClick(station.name)}>
                <LineCircle line={station.line}>{station.line}</LineCircle>
                <StationName>{station.name}</StationName>
              </StationItem>
            ))}
          </StationList>
        </GrayBox>
      </GrayBoxWrapper>

      {/* 모달 창 */}
      {selectedStation && (
        <ModalBackdrop>
          <Modal>
            <ModalTitle>{selectedStation} 역의 역무원...✆</ModalTitle>
            <CloseButton onClick={closeModal}>✆</CloseButton>
          </Modal>
        </ModalBackdrop>
      )}
    </PageWrapper>
  );
}

export default Main;
