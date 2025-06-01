import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Webcam from 'react-webcam'; 
import io from 'socket.io-client';
import { isAuthenticated } from '../utils/auth';
import Modal from 'react-modal';

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
  const roomId = location.state?.roomId || 'default-room';

  const webcamRef = useRef(null); // react-webcam ref
  const peerRef = useRef(null);
  const [isManConnected, setManagerOnline] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [connected, setConnected] = useState(false);
  const previousStatusRef = useRef(false);

  useEffect(() => {
    console.log("[Cam] 컴포넌트 마운트됨");
  
    if (!isAuthenticated()) {
      alert("로그인이 필요합니다.");
      navigate('/');
      return;
    }
  
    console.log(`[Cam] Room 입장 요청: roomId = ${roomId}`);
    socket.emit('join-room', { roomId, role: 'customer' });
  

    socket.on('manager-status', ({ connected }) => {
      console.log(`[manager-status] 역무원 접속 상태: ${connected}`);
      setManagerOnline(connected);

      if (connected && !previousStatusRef.current) {
        console.log("[manager-status] 역무원 접속됨 → WebRTC 연결 초기화 시도");
        initializeWebRTC();
      }

      previousStatusRef.current = connected;
    });

    
  
    socket.on('play-db-video', (url) => {
      console.log(`[play-db-video] 영상 URL 수신: ${url}`);
      setVideoUrl(url);
      setShowVideoModal(true);
    });
  
    socket.on('play-gif-url', (url) => {
      console.log(`[play-gif-url] GIF URL 수신: ${url}`);
      stopLocalStream();
      setVideoUrl(url);
      setShowVideoModal(true);
      setTimeout(() => {
        console.log("[play-gif-url] GIF 재생 종료 → 스트림 복구");
        setShowVideoModal(false);
        setVideoUrl('');
        restoreLocalStream();
      }, 5000);
    });
  
    socket.on('play-video-url', (url) => {
      console.log(`[play-video-url] 스트리밍 URL 수신: ${url}`);
      stopLocalStream();
      if (webcamRef.current && webcamRef.current.video) {
        webcamRef.current.video.src = url;
        webcamRef.current.video.play().catch(console.error);
      }
    });
  
    socket.on('offer', async ({ offer }) => {
      console.log('[WebRTC] offer 수신');
    
      const peer = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerRef.current = peer;
    
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      // 화면 표시
      if (webcamRef.current && webcamRef.current.video) {
        webcamRef.current.video.srcObject = stream;
      }
    
      stream.getTracks().forEach(track => peer.addTrack(track, stream));
    
      peer.onicecandidate = event => {
        if (event.candidate) {
          console.log('[WebRTC] ICE candidate 전송');
          socket.emit('ice-candidate', { candidate: event.candidate, roomId });
        }
      };
    
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
    
      socket.emit('answer', { answer, roomId });
      console.log('[WebRTC] answer 생성 및 전송 완료');
    });
    
    socket.on('answer', async ({ answer }) => {
      try {
        console.log("[answer] 역무원으로부터 answer 수신");
        await peerRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
        setConnected(true);
      } catch (e) {
        console.error("[answer] 처리 오류:", e);
      }
    });
  
    socket.on('ice-candidate', async ({ candidate }) => {
      try {
        console.log("[ice-candidate] ICE 후보 수신");
        await peerRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("[ice-candidate] 처리 오류:", err);
      }
    });
  
    return () => {
      console.log("[Cam] 컴포넌트 언마운트 → 소켓 해제 및 스트림 정리");
      socket.off('room-info');
      socket.off('play-db-video');
      socket.off('play-gif-url');
      socket.off('play-video-url');
      socket.off('answer');
      socket.off('ice-candidate');
      stopLocalStream();
      peerRef.current?.close();
      peerRef.current = null;
    };
  }, [roomId]);
  
  const initializeWebRTC = async () => {
    try {
      console.log("[WebRTC] 로컬 스트림 요청 중...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  
      if (webcamRef.current && webcamRef.current.video) {
        webcamRef.current.video.srcObject = stream;
        console.log("[WebRTC] 로컬 스트림 시작됨");
      }
  
      const peer = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerRef.current = peer;
  
      stream.getTracks().forEach(track => peer.addTrack(track, stream));
  
      peer.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("[WebRTC] ICE 후보 전송");
          socket.emit('ice-candidate', { candidate: event.candidate, roomId });
        }
      };
  
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      console.log("[WebRTC] offer 생성 및 전송");
      socket.emit('offer', { offer, roomId });
  
    } catch (err) {
      console.error("[WebRTC] 초기화 실패:", err);
    }
  };
  
  const stopLocalStream = () => {
    console.log("[WebRTC] 로컬 스트림 중지");
    if (webcamRef.current?.video?.srcObject) {
      webcamRef.current.video.srcObject.getTracks().forEach(track => track.stop());
      webcamRef.current.video.srcObject = null;
    }
  };
  
  const restoreLocalStream = async () => {
    try {
      console.log("[WebRTC] 로컬 스트림 복구 시도");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (webcamRef.current && webcamRef.current.video) {
        webcamRef.current.video.srcObject = stream;
        console.log("[WebRTC] 로컬 스트림 복구 완료");
      }
    } catch (err) {
      console.error("[WebRTC] 로컬 스트림 복구 실패:", err);
    }
  };
  

  const goBackToMain = () => {
    navigate('/main');
  };

  const handleVideoEnded = () => {
    setShowVideoModal(false);
    setVideoUrl('');
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
          autoPlay
          playsInline
          muted
          mirrored={true}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: 'user' }}
          style={{ width: '100%', height: '100%' }}
        />
      </WebcamBox>

      {showVideoModal && videoUrl && (
        <Modal
          isOpen={showVideoModal}
          onRequestClose={() => setShowVideoModal(false)}
          style={{
            overlay: { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
            content: {
              top: '50%', left: '50%', right: 'auto', bottom: 'auto',
              marginRight: '-50%', transform: 'translate(-50%, -50%)',
              background: '#000', border: 'none', padding: 0,
            }
          }}
        >
          {/* ✅ .mp4와 .gif에 따라 모달 내용 분기 */}
          {videoUrl.endsWith('.mp4') ? (
            <video width="500" autoPlay controls={false} onEnded={handleVideoEnded}>
              <source src={videoUrl} type="video/mp4" />
              브라우저가 video 태그를 지원하지 않습니다.
            </video>
          ) : (
            <img src={videoUrl} alt="수어 GIF" onClick={handleVideoEnded} style={{ width: '500px' }} />
          )}
        </Modal>
      )}

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
