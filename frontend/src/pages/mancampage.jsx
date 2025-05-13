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
  margin-top: -35px;
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

const ButtonWrapper = styled.div`
  width: 80%;
  max-width: 500px;
  margin-top: 20px;
`;

const ButtonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
`;

const SmallButton = styled.button`
  padding: 15px 10px;
  background-color: #BEBEBE;
  color: white;
  font-size: 16px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  text-align: center;
  &:hover {
    background-color: #B3B3B3 ;
  }
`;

const WideButton = styled.button`
  margin-top: 10px;
  width: 100%;
  padding: 15px;
  background-color: #BEBEBE;
  color: white;
  font-size: 16px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  text-align: center;
  &:hover {
    background-color: #B3B3B3 ;
  }
`;

function Mancam() {
  const navigate = useNavigate();
  const remoteVideoRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const peerRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const [videoMounted, setVideoMounted] = useState(false);
  const [gifUrl, setGifUrl] = useState(null); // ✅ 수어 GIF URL 상태
  const [debug, setDebug] = useState('초기화 중...');

  useEffect(() => {
    socket.emit('join-as-manager');
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    peerRef.current = peer;

    peer.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
          setIsConnected(true);
        }
      }
    };

    peer.onconnectionstatechange = () => {
      setDebug(`연결 상태: ${peer.connectionState}`);
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', event.candidate);
      }
    };

    socket.on('offer', async (offer) => {
      try {
        if (!peerRef.current || peerRef.current.signalingState !== 'stable') return;
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit('answer', answer);
      } catch (error) {
        setDebug(`오류 발생: ${error.message}`);
      }
    });

    socket.on('ice-candidate', async (candidate) => {
      try {
        if (peer.signalingState !== 'closed') {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (error) {
        console.error('ICE 후보 처리 오류:', error);
      }
    });

    return () => {
      socket.off('offer');
      socket.off('ice-candidate');
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
      setIsConnected(true);
    }
  }, [videoMounted, remoteStreamRef.current]);

  useEffect(() => {
    socket.on('play-video-url', (url) => {
      const videoEl = remoteVideoRef.current;
      if (videoEl) {
        videoEl.src = url;
        videoEl.play();
      }
    });

    socket.on('play-gif-url', (url) => {
      setGifUrl(url); // ✅ GIF URL 수신
    });

    socket.on('error', (msg) => {
      alert(msg);
    });

    return () => {
      socket.off('play-video-url');
      socket.off('play-gif-url');
      socket.off('error');
    };
  }, []);

  const goBackToManage = () => {
    navigate('/manage');
  };

  const handlePlayVideo = (videoId) => {
    const url = `http://localhost:3002/videos/${videoId}.mp4`;
    socket.emit('trigger-play-db-video', url);
  };

  const handlePlayGif = (keyword) => {
    socket.emit('trigger-gif', keyword); // ✅ GIF 요청
  };

  return (
    <PageWrapper>
      <Header>
        <LogoText>LOGOTEXT</LogoText>
      </Header>

      <WebcamBox>
        <video
          ref={(el) => {
            remoteVideoRef.current = el;
            if (el) {
              setVideoMounted(true);
              if (remoteStreamRef.current) {
                el.srcObject = remoteStreamRef.current;
                el.onloadedmetadata = () => {
                  el.play().catch(e => console.error("비디오 재생 실패:", e));
                };
              }
            }
          }}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: '100%', transform: 'scaleX(-1)' }}
        />
      </WebcamBox>

      <TextBox>
        {isConnected ? "사용자와 연결되었습니다!" : "사용자 연결 대기 중..."}
      </TextBox>

      <TextBox>여기에 사용자의 수화를 인식한 텍스트가 나와요.</TextBox>

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
        <WideButton onClick={() => handlePlayGif('지원되는 수어 리스트')}>지원되는 수어 리스트</WideButton>
        <WideButton onClick={() => handlePlayGif('민원이 해결되었나요?')}>민원이 해결되었나요?</WideButton>
      </ButtonWrapper>

      <RoundButton onClick={goBackToManage}>✆</RoundButton>
    </PageWrapper>
  );
}

export default Mancam;
