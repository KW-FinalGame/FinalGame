import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import Webcam from 'react-webcam';
import { isAuthenticated } from '../utils/auth';
import Modal from 'react-modal';
import Link from "../assets/imgs/link.png";
import { motion, AnimatePresence } from 'framer-motion';

// ✅ 백엔드 서버 URL (백엔드가 Flask로 중계)
//  - exe/배포: 같은 포트(3002)에서 '/predict'로 요청
//  - 로컬 개발: 백엔드 3002 포트로 직접 요청
const PREDICT_URL =
  process.env.NODE_ENV === 'production'
    ? '/predict'
    : 'http://localhost:3002/predict';

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
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
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
`;

const Logotext = styled.h1`
  font-family: 'YeongdoBold';
  color: #fff;
  font-size: 30px;
  padding: 45px 15px 5px 10px;
`;

const WebcamBox = styled.div`
  position: relative;
  margin-top: 40px;
  width: 80%;
  max-width: 500px;
  aspect-ratio: 4 / 3;
  background: black;
  border-radius: 20px;
  overflow: hidden;
  border: 2px solid gray;
  box-shadow: 0 10px 10px rgba(0,0,0,0.2);
`;

const TextBox = styled.div`
  width: 80%;
  max-width: 500px;
  margin-top: 50px;
  font-size: 30px;
  color: white;
  text-align: center;
`;

const TextBox2 = styled.div`
  width: 80%;
  max-width: 500px;
  margin-top: 30px;
  font-size: 20px;
  color: black;
  text-align: center;
  background-color: #f0f0f0;
  border: 2px solid #ccc;
  border-radius: 10px;
  padding: 15px;
  max-height: 150px;
  overflow-y: auto;
  white-space: pre-wrap;
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

const SlideUpModal = styled(motion.div)`
  width: 95%;
  height:80vh;
  background-color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  margin-top:5vh;
  border-radius: 40px;
  border: 3px solid lightgray;
  box-shadow: 0 6px 10px rgba(0,0,0,0.2);
`;

function ComPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const stationName = location.state?.stationName || "알 수 없음";

  const webcamRef = useRef(null);
  const [modelResult, setModelResult] = useState("번역 결과를 기다리는 중...");
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  // Mediapipe 관련
  const landmarkBuffer = useRef([]);
  const lastFrameTime = useRef(Date.now());

  // 한 프레임(양손 절대좌표) 처리
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

  // Mediapipe 초기화
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

    const videoEl = webcamRef.current?.video;
    if (!videoEl) return;

    const camera = new window.Camera(videoEl, {
      onFrame: async () => {
        await hands.send({ image: videoEl });
      },
      width: 640,
      height: 480,
    });

    camera.start();

    // 🔥 cleanup
    return () => {
      camera.stop();
      hands.close(); // Mediapipe 객체 정리
    };
  }, []);

  // 시퀀스 전송
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
      // ✅ 30프레임마다 백엔드로 전송
      if (sequence.length === 30) {
        fetch(PREDICT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sequence }),
        })
          .then((res) => res.json())
          .then((data) => {
            console.log("🧠 예측 결과:", data);
            console.log("📊 traj_var:", data.debug.traj_var);
            setModelResult(data.sentence || data.label);
          })
          .catch((err) => console.error("예측 오류:", err));

        sequence.length = 0;
      }

    }, 33);

    return () => clearInterval(intervalId);
  }, []);

  const handleVideoEnded = () => {
    setShowVideoModal(false);
    setVideoUrl('');
  };

  const goBackToMain = () => {
    navigate('/main');
  };

  const slideUpVariants = {
    hidden: { y: "100%" },
    visible: { y: 0, transition: { type: "spring", stiffness: 30 } },
    exit: { y: "100%", transition: { duration: 0.3 } },
  };

  return (
    <PageWrapper>
      <Logocontainer>
        <Logoicon src={Link} alt="링크 아이콘 이미지" />
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
          </WebcamBox>

          <TextBox2>
            {modelResult}
          </TextBox2>

          <RoundButton onClick={goBackToMain}>✆</RoundButton>
        </SlideUpModal>
      </AnimatePresence>
    </PageWrapper>
  );
}

export default ComPage;
