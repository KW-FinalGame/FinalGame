import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Webcam from 'react-webcam'; 
import io from 'socket.io-client';

const socket = io('http://localhost:3002');
const peer = new RTCPeerConnection();

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

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  margin-top: 10px;
  gap: 8px;
`;

const Circle = styled.div`
  width: 12px;
  height: 12px;
  background-color: ${props => props.online ? 'green' : 'red'};
  border-radius: 50%;
`;

function Cam() {
  const navigate = useNavigate();
  const location = useLocation();
  const stationName = location.state?.stationName || "알 수 없음";
  const webcamRef = useRef(null);
  const peerRef = useRef(null); 
  const [isManConnected, setManagerOnline] = useState(false);

  useEffect(() => {

    socket.emit('join-as-customer');

    socket.on('manager-status', (data) => {
      setManagerOnline(data.connected);
    });

    const startWebRTC = async () => {
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }

    const peer = new RTCPeerConnection();
    peerRef.current = peer;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });

        // 고객 웹캠 스트림을 비디오 엘리먼트에 연결
        if (webcamRef.current) {
          webcamRef.current.srcObject = stream;
        }

        // 스트림을 peer 연결에 추가
        stream.getTracks().forEach(track => peer.addTrack(track, stream));

        // 오퍼 생성 후 로컬 설명 설정
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        // 서버로 오퍼 전송
        socket.emit('offer', offer);
        
        // ICE 후보가 생기면 서버로 전송
        peer.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('ice-candidate', event.candidate);
          }
        };

        // 상대방으로부터의 응답을 처리
        socket.on('answer', async (answer) => {
          try {
            await peer.setRemoteDescription(new RTCSessionDescription(answer));
          } catch (error) {
            console.error('응답 처리 오류:', error);
          }
        });

        socket.on('ice-candidate', async (candidate) => {
          try {
            await peer.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (error) {
            console.error('ICE 후보 처리 오류:', error);
          }
        });

        
      } catch (error) {
        console.error("웹캠 접근 오류:", error);
      }
    };

    startWebRTC();
    
    return () => {
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
    };
  }, []);

  const goBackToMain = () => {
    navigate('/main');
  };

  return (
    <PageWrapper>
      <Header>
        <LogoText>LOGOTEXT</LogoText>
      </Header>
      
      <TextBox>
        <strong>{stationName}</strong> 의 역무원
      </TextBox>

      <WebcamBox>
        <Webcam
          ref={webcamRef}
          audio={false}
          mirrored={true}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: 'user' }}
          style={{ width: '100%', height: '100%' }}
        />
      </WebcamBox>

      <StatusIndicator>
        <Circle online={isManConnected} />
        <span>{isManConnected ? '역무원 접속중' : '역무원 미접속'}</span>
      </StatusIndicator>

      <TextBox>
        여기에 사용자의 수화를 인식한 텍스트가 나와요.
      </TextBox>

      <RoundButton onClick={goBackToMain}>✆</RoundButton>
    </PageWrapper>
  );
}

export default Cam;
