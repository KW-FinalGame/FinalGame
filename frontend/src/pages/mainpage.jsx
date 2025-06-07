import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import subway from "../assets/imgs/subway.png";
import axios from 'axios';
import { isAuthenticated } from '../utils/auth';
import Link from "../assets/imgs/link.png"; 
import Station from "../assets/imgs/station.png";
import { motion , AnimatePresence } from 'framer-motion';

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
  9: '#BDB092',
};

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #273A96;

  
  /* 중앙 정렬 + 폭 제한 */
  max-width: 480px;  // 모바일 크기 기준
  margin: 0 auto;
  width: 100%;
  
  min-height: 100vh;   
  overflow-x: hidden; // ✅ 좌우 스크롤 막기

  /* ✅ 테두리와 그림자 추가 */
  border: 2px solid lightgray;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); // 살짝 그림자
`;

const Logocontainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 480px;
  display: flex;
`;

const Logoicon = styled.img`
width: 30px; /* 텍스트 크기(30px)에 맞춰 조정 */
height: 30px;
margin: 45px 0 5px 50px; /* Logotext padding에 맞춰 정렬 */
margin-right: 0em;
`;

const Logotext = styled.h1`
  font-family: 'YeongdoBold';
  align-self: flex-start;
  color: #FFFFFF;
  font-size: 30px;
  padding: 45px 15px 5px 10px; 
  margin-top:-4px;

  @media (max-width: 768px) {
    font-size: 30px;
  }

  @media (max-width: 480px) {
    font-size: 30px;
  }
`;

const Stationimg = styled.img`
  margin-top:-30px;
  margin-left:30vh;
  margin bottom:-20px;

  width: 45%;
  height: auto;

  @media (max-width: 480px) {
    width: 45%;
    height: auto;
    margin-right:-81px;
    margin-left:27vh;
    margin bottom:-20px;
  }
`;

const WhiteBox = styled.div`
  width: 100%;
  height:74vh;
  background-color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 10px;
  margin-top:-14px;
  box-sizing: border-box;
  padding: 15px 10px 0px 10px;

  
  /* 위쪽 모서리에만 둥근 처리 */
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
`;


const TopWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  max-width: 450px; /* ✅ GrayBox와 너비 맞춤 */
  padding-left:25px; /* ✅ 좌측 정렬 이쁘게 */
  padding-top:10px;

  @media (max-width: 480px) {
    padding-left: 25px;
  }
`;


const UserName = styled.div`
  font-size: 25px;
  font-weight: bold;
  color: #333;
  margin-bottom: -20px;
  @media (max-width: 768px) {
    font-size: 35px;
  }
  @media (max-width: 480px) {
    font-size: 30px;
  }
`;
const Title = styled.div`
  font-size: 25px;
  font-weight: bold;
  margin-top:15px;
  text-align: left;
`;

const GrayBoxWrapper = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
`;

const GrayBox = styled.div`
position: relative; /* 세로줄의 기준이 되는 relative 위치 */
  background-color: #f0f0f0;
  width: 90%;
  height: 55vh;
  border-radius: 15px;
  border: 1.5px solid #ccc;
  margin-top:10px;
  margin-bottom:20px;
  display: flex;
  flex-direction: column;
  padding: 15px 20px 0px 20px;
  overflow: hidden;

  @media (max-width: 480px) {
    width: 90%;
    padding: 15px 15px 0px 0px;
  }
`;

const VerticalLine = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;  /* LineCircle의 중심에 맞춰 조정 */
  width: 3px;
  background-color: #ccc;
  z-index: 0; /* LineCircle 뒤에 배치 */
  left:55px;

  @media (max-width: 768px) {
    left: 70px;
  }
  @media (max-width: 480px) {
    left: 43px;
  }
`;

const StationList = styled.div`
position: relative;  /* ⭐ 필수 */
  max-height: 55vh;
  overflow-y: auto;
  width: 100%;
  padding: 0 10px;
  margin-bottom:10px;

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
position: relative;  // ⭐ 필요함
  display: flex;
  align-items: center;
  border-radius: 10px;
  margin-bottom: 10px;
  cursor: pointer;  
  font-size: 25px;
  background-color: transparent;  // 배경 투명
  line-height: 2.5;
  z-index: 1;  // ⭐ 세로선보다 위

  @media (max-width: 768px) {
    padding: 12px 15px;
  }

  @media (max-width: 480px) {
    padding: 10px 12px; 
    font-size: 20px;
  }
`;
const StationTextWrapper = styled.div`
  display: flex;
  flex-direction: row;  /* ⬅️ 가로 정렬 */
  align-items: center;
  gap: 10px;             /* 호선과 역 이름 간격 */
  flex-grow: 1;

  @media (max-width: 480px) {
    gap: 20px; 
  }
`;

const LineLabel = styled.span`
  font-size: 16px;
  color: gray;
  margin-bottom: -2px;

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const DistanceText = styled.span`
  font-size: 16px;
  color: #555;
  margin-left: auto; /* 오른쪽 정렬 */
  white-space: nowrap;

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const LineCircle = styled.div`
  width: 50px;
  height: 50px;
  background-color: ${props => lineColors[props.line] || '#aaa'};
  color: white;
  font-weight: bold;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  flex-shrink: 0;

  @media (max-width: 480px) {
    width: 45px;
  height: 45px;
  }
`;

const StationName = styled.div`
  font-size: 23px;
  color: #333;
  font-weight: bold;

  @media (max-width: 480px) {
    font-size : 20px;
    font-weight: bold;

  }
`; 

const ModalBackdrop = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
  display: flex;
  justify-content: center;
  align-items: flex-end; /* 아래에서부터 정렬 */
`;

const SlideUpModal = styled(motion.div)`
  background-color: white;
  padding: 30px 20px;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  width: 80%;
  max-width: 470px;
  text-align: center;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);

  @media (max-width: 480px) {
    width: 98%;
  max-width: 480px;

  }
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

const OpenButton = styled.button`
  background-color: #73CD37;
  font-size: 23px;
  color: white;
  border: 100px;
  padding: 10px 19px;
  border-radius: 50%;
  cursor: pointer;
  margin-right: 15px;

  &:hover {
    background-color: #73CD37;
  }
`;

const CloseButton = styled.button`
  background-color: #EE3232;
  font-size: 23px;
  color: white;
  border: 100px;
  padding: 10px 19px;
  border-radius: 50%;
  cursor: pointer;
  margin-left: 15px;

  &:hover {
    background-color: #EE3232;
  }
`;

function Main() {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      alert("로그인이 필요합니다.");
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const storedName = sessionStorage.getItem('userId');
    if (storedName) {
      setUsername(storedName);
    }
  }, []);

  //api 호출 함수
  useEffect(() => {
    let isCalled = false; // ✅ 중복 호출 방지용 플래그
  
    if (!isCalled) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log('📍 현재 위치:', latitude, longitude);
  
          try {
            const response = await axios.post('http://localhost:3002/nearby-subway-stations', {
              latitude,
              longitude
            });
  
            console.log('📡 서버 응답:', response.data);
            setStations(response.data);
            isCalled = true; // ✅ 첫 호출 이후엔 다시 실행되지 않음
          } catch (error) {
            console.error('❌ 역 정보 가져오기 실패:', error);
          }
        },
        (err) => {
          console.error('❌ 위치 권한이 거부됨:', err);
        }
      );
    }
  }, []);
  
  

  const handleStationClick = (stationName) => {
    setSelectedStation(stationName); // 클릭한 역 이름 저장
  };

  const closeModal = () => {
    setSelectedStation(null); // 모달 닫기
  };

  const OpenCam = () => {
    navigate('/cam', { state: { stationName: selectedStation } });
  };
  const containerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.3,  // 자식들 간 0.3초 간격
      },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.3 },
    },
  };

  const slideUpVariants = {
    hidden: { y: "100%" },
    visible: { y: 0, transition: { type: "spring", stiffness: 100 } },
    exit: { y: "100%", transition: { duration: 0.3 } },
  };
  
  
  // 자식 애니메이션 (아래에서 위로 등장)
  const itemVariants = {
    initial: { opacity: 0, y: 100 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  };
  
  
  
  return (
    <PageWrapper>
      <Logocontainer>
        <Logoicon src={Link} alt="링크 아이콘 이미지"></Logoicon>
        <Logotext>손말이음</Logotext>
        </Logocontainer>


        <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <motion.div variants={itemVariants}>
              <Stationimg src={Station} alt="지하철역 이미지" />
            </motion.div>

            
      <motion.div variants={itemVariants}>
    <WhiteBox>
      <TopWrapper>
          <UserName>{username}님</UserName> {/* ✅ 이름 출력 */}
      <Title>현재 지하철 역을 선택하세요!</Title>
      </TopWrapper>

      <GrayBoxWrapper>
      <GrayBox>
        <VerticalLine />
        <StationList>
          
          {stations.map((station, index) => {
            const lineNumber = parseInt(station.line.toString().match(/\d+/)?.[0], 10);
            return (
              <StationItem key={index} onClick={() => handleStationClick(station.name)}>
                <LineCircle line={lineNumber}>{lineNumber}</LineCircle>

                <StationTextWrapper>
                  <LineLabel>{lineNumber}호선</LineLabel>
                  <StationName>{station.name}</StationName>
                </StationTextWrapper>
                <DistanceText>
                    {typeof station.distance_km === "number" ? `📍${station.distance_km.toFixed(2)}km` : ""}
                  </DistanceText>

                  </StationItem>

            );
          })}
        </StationList>
      </GrayBox>



</GrayBoxWrapper>
</WhiteBox>
</motion.div>
</motion.div>

      {/* 모달 창 */}
      <AnimatePresence>
        {selectedStation && (
          <ModalBackdrop>
            <SlideUpModal
              variants={slideUpVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <ModalTitle>{selectedStation} 역의 역무원...☎</ModalTitle>
              <OpenButton onClick={OpenCam}>✆</OpenButton>
              <CloseButton onClick={closeModal}>✆</CloseButton>
            </SlideUpModal>
          </ModalBackdrop>
        )}
      </AnimatePresence>

    </PageWrapper>
  );
}

export default Main;
