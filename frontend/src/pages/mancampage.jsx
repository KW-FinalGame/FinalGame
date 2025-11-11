import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import Link from "../assets/imgs/link.png"; 

const socket = io('http://localhost:3002');

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #273A96;
  max-width: 480px;
  margin: 0 auto;
  width: 100%;
  min-height: 100vh;   
  overflow-x: hidden;
  border: 2px solid lightgray;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
`;

const Logocontainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 480px;
  display: flex;
`;

const Logoicon = styled.img`
  width: 30px;
  height: 30px;
  margin: 45px 0 5px 50px;
  margin-right: 0em;
`;

const Logotext = styled.h1`
  font-family: 'YeongdoBold';
  align-self: flex-start;
  color: #FFFFFF;
  font-size: 30px;
  padding: 45px 15px 5px 10px; 
  margin-top:-4px;
`;

const WebcamBox = styled.div`
  margin-top: 20px;
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
  margin-top: 10px;
  margin-bottom: -10px;
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
  margin-top: 15px;
  cursor: pointer;
  &:hover {
    background-color: #c02727;
  }
`;

const ButtonWrapper = styled.div`
  width: 80%;
  max-width: 500px;
  margin-top: 20px;
`;

const ButtonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 5px;
`;

const SmallButton = styled.button`
  padding: 15px 10px;
  background-color: #BEBEBE;
  color: black;
  font-size: 18px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  text-align: center;
  &:hover {
    background-color: #B3B3B3 ;
  }
`;

const WideButton = styled.button`
  margin-top: 5px;
  width: 100%;
  padding: 15px;
  background-color: #BEBEBE;
  color: black;
  font-size: 18px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  text-align: center;
  &:hover {
    background-color: #B3B3B3 ;
  }
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  margin-top: 20px;
  gap: 8px;
  font-size:20px;
  color: black;
`;

const Circle = styled.div`
  width: 12px;
  height: 12px;
  background-color: ${props => props.online ? 'green' : 'red'};
  border-radius: 50%;
`;

const getBlackStream = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas.captureStream();
};

function Mancam() {
  const navigate = useNavigate();
  const location = useLocation();
  const roomId = location.state?.roomId || 'default-room';

  const remoteVideoRef = useRef(null);
  const [videoKey, setVideoKey] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const peerRef = useRef(null);
  const pendingCandidates = useRef([]);
  const remoteStreamRef = useRef(null);
  const [gifUrl, setGifUrl] = useState(null);
  const [debug, setDebug] = useState('초기화 중...');
  const [modelResult, setModelResult] = useState('');

  useEffect(() => {
    socket.emit('join-room', { role: 'manager', roomId });

    socket.on('offer', async ({ offer }) => {
      try {
        const peer = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });

        peer.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('ice-candidate', { candidate: event.candidate, roomId });
          }
        };

        peer.onconnectionstatechange = () => {
          setIsConnected(peer.connectionState === 'connected');
        };

        const stream = new MediaStream();
        remoteStreamRef.current = stream;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;

        peer.ontrack = (event) => {
          event.streams[0].getTracks().forEach(track => {
            remoteStreamRef.current.addTrack(track);
          });
        };

        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        peerRef.current = peer;

        socket.emit('answer', { answer, roomId });

        pendingCandidates.current.forEach(async (candidate) => {
          try {
            await peer.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error('ICE 후보 추가 실패:', e);
          }
        });
        pendingCandidates.current = [];
      } catch (e) {
        console.error('offer 처리 중 오류:', e);
      }
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      if (peerRef.current) {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('ICE 추가 오류:', e);
        }
      } else {
        pendingCandidates.current.push(candidate);
      }
    });

    socket.on('room-members', (members) => {
      const myId = socket.id;
      const otherMembers = members.filter(id => id !== myId);

      if (otherMembers.length === 0) {
        setIsConnected(false);
        if (peerRef.current) peerRef.current.close();
        peerRef.current = null;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
          remoteVideoRef.current.style.opacity = '0';
        }
      } else {
        if (remoteVideoRef.current) remoteVideoRef.current.style.opacity = '1';
        setDebug('상대방이 입장했습니다.');
      }
    });

    // 🔥 모델 예측 결과 수신
    socket.on('prediction', (text) => {
      console.log('[prediction] 수신된 텍스트:', text);
      if (typeof text === 'string' && text.trim() !== '') {
        setModelResult(text);
      } else {
        setModelResult('(결과 없음)');
      }
    });    

    socket.on('play-video-url', (url) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.src = url;
        remoteVideoRef.current.play().catch(err => console.error('재생 오류:', err));
      }
    });

    socket.on('play-gif-url', (url) => {
      setGifUrl(url);
    });

    return () => {
      socket.off('offer');
      socket.off('ice-candidate');
      socket.off('room-members');
      socket.off('prediction');
      socket.off('play-video-url');
      socket.off('play-gif-url');
      if (peerRef.current) peerRef.current.close();
      peerRef.current = null;
    };
  }, [roomId]);

  const goBackToManage = () => {
    socket.emit('leave-room', { roomId, userId: 'manager' });
    if (peerRef.current) peerRef.current.close();
    peerRef.current = null;
    navigate('/manage');
  };

  const handlePlayGif = (keyword) => {
    socket.emit('trigger-gif', keyword);
  };

  return (
    <PageWrapper>
      <Logocontainer>
        <Logoicon src={Link} alt="링크 아이콘 이미지" />
        <Logotext>손말이음</Logotext>
      </Logocontainer>

      <WebcamBox>
        <video
          key={videoKey}
          ref={remoteVideoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: '100%', transform: 'scaleX(-1)' }}
        />
      </WebcamBox>

      <StatusIndicator>
        <Circle online={isConnected} />
        <span>{isConnected ? '사용자와 연결되었습니다' : '사용자 연결 대기 중...'}</span>
      </StatusIndicator>

      <TextBox>{modelResult ? modelResult : '번역된 텍스트가 여기에 표시됩니다.'}</TextBox>

      {gifUrl && (
        <div style={{ marginTop: '20px' }}>
          <img src={gifUrl} alt="수어 GIF" style={{ maxWidth: '300px', borderRadius: '10px' }} />
        </div>
      )}

      <ButtonWrapper>
        <ButtonGrid>
          <SmallButton onClick={() => handlePlayGif('기다려주세요')}>기다려주세요</SmallButton>
          <SmallButton onClick={() => handlePlayGif('문 열어드릴게요')}>문 열어드릴게요</SmallButton>
          <SmallButton onClick={() => handlePlayGif('맞습니다')}>맞습니다</SmallButton>
          <SmallButton onClick={() => handlePlayGif('아닙니다')}>아닙니다</SmallButton>
        </ButtonGrid>
        <WideButton onClick={() => handlePlayGif('다시 한번 인식해주시겠어요?')}>다시 한번 인식해주시겠어요?</WideButton>
        <WideButton onClick={() => handlePlayGif('민원이 해결되었나요?')}>민원이 해결되었나요?</WideButton>
      </ButtonWrapper>

      <RoundButton onClick={goBackToManage}>✆</RoundButton>
    </PageWrapper>
  );
}

export default Mancam;

