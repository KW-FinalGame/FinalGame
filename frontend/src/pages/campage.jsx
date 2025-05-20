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
  const webcamRef = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const [isManConnected, setManagerOnline] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      alert("로그인이 필요합니다.");
      navigate('/');
      return;
    }
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

    socket.on('play-db-video', (url) => {
      setVideoUrl(url);
      setShowVideoModal(true);
    });

    // ✅ 추가: GIF 재생 소켓 수신
    socket.on('play-gif-url', (url) => {
      setVideoUrl(url);
      setShowVideoModal(true);

      
    // ✅ 5초 후 자동으로 모달 닫기
    setTimeout(() => {
      setShowVideoModal(false);
      setVideoUrl('');
    }, 5000);
    });

    const initializeWebRTC = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (webcamRef.current && webcamRef.current.video) {
          webcamRef.current.video.srcObject = stream;
        }

        const peer = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        peerRef.current = peer;

        stream.getTracks().forEach(track => {
          peer.addTrack(track, stream);
        });

        peer.onconnectionstatechange = () => {
          console.log("연결 상태 변경:", peer.connectionState);
        };
        
        peer.oniceconnectionstatechange = () => {
          console.log("ICE 연결 상태 변경:", peer.iceConnectionState);
        };

        peer.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('ice-candidate', event.candidate);
          }
        };

        peer.onsignalingstatechange = () => {
          console.log("시그널링 상태 변경:", peer.signalingState);
        };

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit('offer', offer);
      } catch (error) {
        console.error('웹캠 접근 오류:', error);
      }
    };

    socket.on('answer', async (answer) => {
      try {
        if (peerRef.current && peerRef.current.signalingState !== 'closed') {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (error) {
        console.error('응답 처리 오류:', error);
      }
    });

    socket.on('ice-candidate', async (candidate) => {
      try {
        if (peerRef.current && peerRef.current.signalingState !== 'closed') {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (error) {
        console.error('ICE 후보 처리 오류:', error);
      }
    });

    initializeWebRTC();

    return () => {
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('manager-status');
      socket.off('play-db-video');
      socket.off('play-gif-url'); // ✅ 정리

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
    };
  }, [navigate]);

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
          audio={true}
          mute
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
