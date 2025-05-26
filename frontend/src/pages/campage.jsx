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

  useEffect(() => {
    if (!isAuthenticated()) {
      alert("로그인이 필요합니다.");
      navigate('/');
      return;
    }

    socket.emit('join-room', { roomId, role: 'customer' });

    socket.on('room-info', ({ users }) => {
      const managerExists = users.some(user => user.role === 'manager');
      setManagerOnline(managerExists);
      if (managerExists && !connected) {
        initializeWebRTC();
      }
    });

    socket.on('play-db-video', (url) => {
      setVideoUrl(url);
      setShowVideoModal(true);
    });

    socket.on('play-gif-url', (url) => {
      // GIF 재생 시 로컬 스트림 잠시 중지
      stopLocalStream();
      setVideoUrl(url);
      setShowVideoModal(true);
      setTimeout(() => {
        setShowVideoModal(false);
        setVideoUrl('');
        restoreLocalStream();
      }, 5000);
    });

    socket.on('play-video-url', (url) => {
      stopLocalStream();
      if (webcamRef.current && webcamRef.current.video) {
        webcamRef.current.video.src = url;
        webcamRef.current.video.play().catch(console.error);
      }
    });

    socket.on('answer', async ({ answer }) => {
      try {
        await peerRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
        setConnected(true);
      } catch (e) {
        console.error("answer 처리 오류", e);
      }
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      try {
        await peerRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("ICE 후보 처리 오류", err);
      }
    });

    return () => {
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (webcamRef.current && webcamRef.current.video) {
        webcamRef.current.video.srcObject = stream;
      }

      const peer = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerRef.current = peer;

      stream.getTracks().forEach(track => peer.addTrack(track, stream));

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', { candidate: event.candidate, roomId });
        }
      };

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit('offer', { offer, roomId });

    } catch (err) {
      console.error("웹캠 초기화 실패:", err);
    }
  };

  const stopLocalStream = () => {
    if (webcamRef.current?.video?.srcObject) {
      webcamRef.current.video.srcObject.getTracks().forEach(track => track.stop());
      webcamRef.current.video.srcObject = null;
    }
  };

  const restoreLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (webcamRef.current && webcamRef.current.video) {
        webcamRef.current.video.srcObject = stream;
      }
    } catch (err) {
      console.error("로컬 스트림 복구 실패", err);
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
