import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Webcam from 'react-webcam'; 
import io from 'socket.io-client';
import { isAuthenticated } from '../utils/auth';
import Modal from 'react-modal';
import Link from "../assets/imgs/link.png"; 
import { motion , AnimatePresence } from 'framer-motion';

const socket = io('http://localhost:3002');

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


const WebcamBox = styled.div`
  position: relative; // ✅ 추가!
  margin-top: 40px;
  width: 80%;
  max-width: 500px;
  aspect-ratio: 4 / 3;
  background: black;
  border-radius: 20px;
  overflow: hidden;

  
  /* ✅ 테두리와 그림자 추가 */
  border: 2px solid gray;
  box-shadow: 0 10px 10px rgba(0, 0, 0, 0.2); // 살짝 그림자
`;

const TextBox = styled.div`
  width: 80%;
  max-width: 500px;
  margin-top: 50px;
  font-size: 30px;
  color: black;
  text-align: center;
`;

//수화 모델 번역 결과 창
const TextBox2 = styled.div`
  width: 80%;
  max-width: 500px;
  margin-top: 30px;
  font-size: 20px;
  color: blalck;
  text-align: center;
  background-color: #f0f0f0;
  border: 2px solid #ccc;
  border-radius: 10px;
  padding: 15px;

  
  max-height: 150px;         // ✅ 높이 제한
  overflow-y: auto;          // ✅ 세로 스크롤
  white-space: pre-wrap;     // ✅ 줄바꿈 유지
`;

const RoundButton = styled.button`
  width: 60px;
  height: 60px;
  background-color: #EE3232;
  color: white;
  font-size: 25px;
  border: none;
  border-radius: 50%;
  margin-top: 50px;
  cursor: pointer;
  &:hover {
    background-color: #c02727;
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


const SlideUpModal = styled(motion.div)`
  width: 95%;
  height:80vh;
  background-color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  margin-top:5vh;

  
  /* 위쪽 모서리에만 둥근 처리 */
  border-radius: 40px;

  
  /* ✅ 테두리와 그림자 추가 */
  border: 3px solid lightgray;
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.2); // 살짝 그림자
`;

function Cam() {
  const navigate = useNavigate();
  const location = useLocation();
  const stationName = location.state?.stationName || "알 수 없음";
  const roomId = location.state?.roomId || 'default-room';

  const webcamRef = useRef(null); // react-webcam ref
  const canvasRef = useRef(null);
  const peerRef = useRef(null);
  const [isManConnected, setManagerOnline] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [, setConnected] = useState(false);
  const previousStatusRef = useRef(false);
  const [modelResult, setModelResult] = useState(''); // 수화 인식 결과 저장용


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

  useEffect(() => {
  socket.on('prediction', (data) => {
    console.log("🧠 예측 결과:", data);
    setModelResult(data.sentence || data.label);
  });
  return () => socket.off('prediction');
  }, []);


  const landmarkBuffer = useRef([]);
  const lastFrameTime = useRef(Date.now());

  // hand 처리 함수
  const processHandsAbsolute = (handsLandmarks) => {
    const raw = [];
    const wristsX = [];

    for (const hand of handsLandmarks) {
      const coords = hand.map(pt => [pt.x, pt.y, pt.z]).flat();
      const safe = coords.map(v => (Number.isFinite(v) ? v : 0));
      raw.push(safe);
      wristsX.push(hand[0].x);
    }

    let left, right;
    if (raw.length === 0) {
      left = new Array(63).fill(0);
      right = new Array(63).fill(0);
    } else if (raw.length === 1) {
      left = raw[0];
      right = new Array(63).fill(0);
    } else {
      const [iLeft, iRight] = wristsX[0] <= wristsX[1] ? [0, 1] : [1, 0];
      left = raw[iLeft];
      right = raw[iRight];
    }

    const combined = [...left, ...right]; // (126,)
    return combined;
  };


  useEffect(() => {
    const hands = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((results) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        landmarkBuffer.current = results.multiHandLandmarks;
        lastFrameTime.current = Date.now();
      } else {
        landmarkBuffer.current = [];
      }
    });

    const camera = new window.Camera(webcamRef.current.video, {
      onFrame: async () => {
        await hands.send({ image: webcamRef.current.video });
      },
      width: 640,
      height: 480,
    });

    camera.start();
    return () => camera.stop();
  }, []);

  useEffect(() => {
    const sequence = [];
    const intervalId = setInterval(() => {
      const now = Date.now();
      if (now - lastFrameTime.current > 300) {
        landmarkBuffer.current = [];
        return;
      }

      if (landmarkBuffer.current.length === 0) return;

      const frame = processHandsAbsolute(landmarkBuffer.current);
      sequence.push(frame);

      if (sequence.length === 30) {
        socket.emit("sequence", { sequence });
        sequence.length = 0;
      }
                
      console.log("sequence.length:", sequence.length);
      console.log("sequence:", sequence);

    }, 33);

    return () => clearInterval(intervalId);
  }, []);

  
  const initializeWebRTC = async () => {
    try {
      console.log("[WebRTC] 로컬 스트림 요청 중...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      console.log('🎥 웹캠 스트림 시작', stream); 

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
  // room에서 나가는 이벤트 emit
  socket.emit('leave-room', { roomId, userId: 'customer' }); // userId가 필요하면 맞게 수정하세요.

  // WebRTC 스트림 정리 (선택 사항)
  stopLocalStream();
  peerRef.current?.close();
  peerRef.current = null;

  // 메인 화면으로 이동
  navigate('/main');
};

  const handleVideoEnded = () => {
    setShowVideoModal(false);
    setVideoUrl('');
  };  

 
  const slideUpVariants = {
    hidden: { y: "100%" },
    visible: { y: 0, transition: { type: "spring", stiffness: 30 } },
    exit: { y: "100%", transition: { duration: 0.3 } },
  };
  
  return (
    <PageWrapper>
      <Logocontainer>
        <Logoicon src={Link} alt="링크 아이콘 이미지"></Logoicon>
        <Logotext>손말이음</Logotext>
        </Logocontainer>
      
        <AnimatePresence>

      <SlideUpModal
              variants={slideUpVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
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
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 2
          }}
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

      <TextBox2>
        {modelResult ? modelResult : '번역 결과를 기다리는 중...'}
      </TextBox2>


      <RoundButton onClick={goBackToMain}>✆</RoundButton>
      </SlideUpModal>
      
      </AnimatePresence>
    </PageWrapper>
  );
}

export default Cam;
