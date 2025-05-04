import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Webcam from 'react-webcam'; 
import io from 'socket.io-client';

// 소켓 연결만 초기화
const socket = io('http://localhost:3002');

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
  const streamRef = useRef(null);
  const [isManConnected, setManagerOnline] = useState(false);

  useEffect(() => {
    console.log("Cam 컴포넌트 마운트");

    socket.emit('join-as-customer');
    console.log("고객으로 접속 알림 전송");

    socket.on('manager-status', (data) => {
      console.log("역무원 상태 업데이트:", data);
      setManagerOnline(data.connected);

      if (data.connected) {
        initializeWebRTC();
      }
    });

    const initializeWebRTC = async () => {
      console.log("WebRTC 초기화 시작");
      try {
        let checkCount = 0;
        while (!webcamRef.current || !webcamRef.current.stream) {
          console.log("웹캠 스트림 대기 중...");
          await new Promise(resolve => setTimeout(resolve, 100));
          checkCount++;
          if (checkCount > 50) throw new Error("웹캠 스트림 초기화 실패");
        }

        const stream = webcamRef.current.stream;
        streamRef.current = stream;
        console.log("웹캠 스트림 획득 성공:", stream);

        const peer = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
          ]
        });
        peerRef.current = peer;
        console.log("RTCPeerConnection 생성됨");

        stream.getTracks().forEach(track => {
          console.log(`트랙 추가: ${track.kind}`);
          peer.addTrack(track, stream);
        });

        peer.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('ice-candidate', event.candidate);
            console.log("ICE 후보 전송:", event.candidate);
          }
        };

        await new Promise(resolve => setTimeout(resolve, 100));
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit('offer', offer);
        console.log("오퍼 전송됨");

      } catch (error) {
        console.error('WebRTC 초기화 중 오류:', error.message);
      }
    };

    socket.on('answer', async (answer) => {
      console.log("답변 수신:", answer);
      try {
        if (peerRef.current && peerRef.current.signalingState !== 'closed') {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          console.log("원격 설명 설정됨");
        } else {
          console.warn("peer가 없거나 닫힘 상태, 답변 무시");
        }
      } catch (error) {
        console.error('응답 처리 오류:', error);
      }
    });

    socket.on('ice-candidate', async (candidate) => {
      console.log("ICE 후보 수신:", candidate);
      try {
        if (peerRef.current && peerRef.current.signalingState !== 'closed') {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("ICE 후보 추가됨");
        } else {
          console.warn("peer가 없거나 닫힘 상태, ICE 후보 무시");
        }
      } catch (error) {
        console.error('ICE 후보 처리 오류:', error);
      }
    });

    // ✅ 역무원에게서 요청받으면 offer 재전송
    socket.on('request-offer', async () => {
      console.log("request-offer 이벤트 수신 → 오퍼 재전송");
      if (peerRef.current && streamRef.current) {
        const offer = await peerRef.current.createOffer();
        await peerRef.current.setLocalDescription(offer);
        socket.emit('offer', offer);
        console.log("오퍼 재전송 완료");
      }
    });

    initializeWebRTC();

    return () => {
      console.log("Cam 컴포넌트 언마운트");
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('manager-status');
      socket.off('request-offer');

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

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
          audio={true}
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