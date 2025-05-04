import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
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

function Mancam() {
  const navigate = useNavigate();
  const remoteVideoRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false); // 연결 상태 추가
  const peerRef = useRef(null);

  useEffect(() => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

  const peer = new RTCPeerConnection();
  peerRef.current = peer;

    socket.emit('join-as-manager');

    socket.on('offer', async (offer) => {
      try {
        // 오퍼를 받은 후 원격 설명을 설정
        await peer.setRemoteDescription(new RTCSessionDescription(offer));

        // 응답을 생성
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit('answer', answer); // 응답을 서버로 전송
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    peer.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', event.candidate);
      }
    };

    socket.on('ice-candidate', async (candidate) => {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding ice candidate:', error);
      }
    });

    // 고객 화면 송출을 위한 offer 요청
    const startWebRTC = async () => {
      try {
        // 고객의 웹캠을 가져오는 부분
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });

        // 스트림을 peer 연결에 추가
        stream.getTracks().forEach((track) => peer.addTrack(track, stream));

        // 오퍼 생성
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        // 오퍼를 서버로 전송
        socket.emit('offer', offer);

        setIsConnected(true); // 연결 성공 상태 변경
      } catch (error) {
        console.error('WebRTC 오류:', error);
      }
    };

    startWebRTC(); // WebRTC 시작

    return () => {
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
    };
  }, []);

  const goBackToManage = () => {
    navigate('/manage');
  };

  return (
    <PageWrapper>
      <Header>
        <LogoText>LOGOTEXT</LogoText>
      </Header>

      <WebcamBox>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
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
