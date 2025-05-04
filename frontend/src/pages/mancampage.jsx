import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

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

function Mancam() {
  const navigate = useNavigate();
  const remoteVideoRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const peerRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const [videoMounted, setVideoMounted] = useState(false);
  const [debug, setDebug] = useState('초기화 중...');

  const createPeer = () => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    peer.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
          setIsConnected(true);
        } else {
          console.log("remoteVideoRef가 아직 준비되지 않음, 스트림은 저장됨");
        }
      }
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', event.candidate);
      }
    };

    peer.onconnectionstatechange = () => {
      setDebug(`연결 상태: ${peer.connectionState}`);
    };

    return peer;
  };

  useEffect(() => {
    console.log("Mancam 컴포넌트 마운트");
    socket.emit('join-as-manager');

    // 💡 고객에게 offer 재요청
    socket.emit('request-offer');

    peerRef.current = createPeer();

    const handleOffer = async (offer) => {
      try {
        if (!peerRef.current || peerRef.current.signalingState !== 'stable') {
          console.warn('기존 peer 상태가 안정적이지 않음. 새로 생성');
          if (peerRef.current) peerRef.current.close();
          peerRef.current = createPeer();
        }

        await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        socket.emit('answer', answer);
      } catch (error) {
        console.error("오퍼 처리 오류:", error);
      }
    };

    const handleIceCandidate = async (candidate) => {
      try {
        if (peerRef.current && peerRef.current.signalingState !== 'closed') {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (error) {
        console.error('ICE 후보 처리 오류:', error);
      }
    };

    socket.on('offer', handleOffer);
    socket.on('ice-candidate', handleIceCandidate);

    return () => {
      console.log("Mancam 컴포넌트 언마운트");
      socket.off('offer', handleOffer);
      socket.off('ice-candidate', handleIceCandidate);

      if (remoteVideoRef.current?.srcObject) {
        remoteVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        remoteVideoRef.current.srcObject = null;
      }

      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (videoMounted && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
      setIsConnected(true);
    }
  }, [videoMounted]);

  const goBackToManage = () => {
    navigate('/manage');
  };

  return (
    <PageWrapper>
      <Header><LogoText>LOGOTEXT</LogoText></Header>

      {isConnected ? (
        <WebcamBox>
          <video
            ref={(el) => {
              remoteVideoRef.current = el;
              if (el) {
                setVideoMounted(true);
                if (remoteStreamRef.current) {
                  el.srcObject = remoteStreamRef.current;
                  el.onloadedmetadata = () => el.play().catch(console.error);
                }
              }
            }}
            autoPlay
            playsInline
            style={{ width: '100%', height: '100%' }}
          />
        </WebcamBox>
      ) : (
        <TextBox>사용자 연결 대기 중...</TextBox>
      )}

      <TextBox>여기에 사용자의 수화를 인식한 텍스트가 나와요.</TextBox>
      <RoundButton onClick={goBackToManage}>✆</RoundButton>
    </PageWrapper>
  );
}

export default Mancam;
