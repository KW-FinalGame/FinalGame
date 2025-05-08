import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Webcam from 'react-webcam'; 
import io from 'socket.io-client';
import { isAuthenticated } from '../utils/auth';

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
    if (!isAuthenticated()) {
      alert("로그인이 필요합니다.");
      navigate('/');
      return;
    }
    console.log("Cam 컴포넌트 마운트");
    
    // 고객으로 접속 알림
    socket.emit('join-as-customer');
    console.log("고객으로 접속 알림 전송");
    
    // 역무원 상태 체크
    socket.on('manager-status', (data) => {
      console.log("역무원 상태 업데이트:", data);
      setManagerOnline(data.connected);
      
      // 역무원이 연결된 경우에만 WebRTC 시작
      if (data.connected) {
        initializeWebRTC();
      }
    });

    // WebRTC 초기화 함수
    const initializeWebRTC = async () => {
      console.log("WebRTC 초기화 시작");
      try {
        // 웹캠 스트림 가져오기
        console.log("웹캠 스트림 요청 중...");
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true
        });
        console.log("웹캠 스트림 획득 성공");
        streamRef.current = stream;

        // 웹캠 비디오에 스트림 연결
        if (webcamRef.current && webcamRef.current.video) {
          console.log("웹캠 비디오에 스트림 연결");
          webcamRef.current.video.srcObject = stream;
        }

        // RTCPeerConnection 생성
        console.log("RTCPeerConnection 생성 중");
        const peer = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
          ]
        });
        peerRef.current = peer;
        console.log("RTCPeerConnection 생성됨");

        // 스트림에서 트랙 추가
        console.log("스트림에서 트랙 추가 중");
        stream.getTracks().forEach(track => {
          console.log(`트랙 추가: ${track.kind}`);
          peer.addTrack(track, stream);
        });
        console.log(stream.getVideoTracks()); // 비어있으면 비디오가 없음


        // 연결 상태 변경 이벤트
        peer.onconnectionstatechange = (event) => {
          console.log("연결 상태 변경:", peer.connectionState);
        };
        
        // ICE 연결 상태 변경 이벤트
        peer.oniceconnectionstatechange = (event) => {
          console.log("ICE 연결 상태 변경:", peer.iceConnectionState);
        };

        // ICE 후보 생성 이벤트
        peer.onicecandidate = (event) => {
          if (event.candidate) {
            console.log("ICE 후보 생성:", event.candidate);
            socket.emit('ice-candidate', event.candidate);
          }
        };
        
        // 시그널링 상태 변경 이벤트
        peer.onsignalingstatechange = (event) => {
          console.log("시그널링 상태 변경:", peer.signalingState);
        };

        // 오퍼 생성 및 전송
        console.log("오퍼 생성 중");
        const offer = await peer.createOffer();
        console.log("오퍼 생성됨:", offer);
        
        console.log("로컬 설명 설정 중");
        await peer.setLocalDescription(offer);
        console.log("로컬 설명 설정됨");
        
        console.log("오퍼 전송 중");
        socket.emit('offer', offer);
        console.log("오퍼 전송됨");
      } catch (error) {
        console.error('웹캠 접근 오류:', error);
      }
    };

    // 원격 답변 처리
    socket.on('answer', async (answer) => {
      console.log("답변 수신:", answer);
      try {
        if (peerRef.current && peerRef.current.signalingState !== 'closed') {
          console.log("원격 설명 설정 중");
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          console.log("원격 설명 설정됨");
        } else {
          console.warn("peer가 없거나 닫힘 상태, 답변 무시");
        }
      } catch (error) {
        console.error('응답 처리 오류:', error);
      }
    });

    // ICE 후보 처리
    socket.on('ice-candidate', async (candidate) => {
      console.log("ICE 후보 수신:", candidate);
      try {
        if (peerRef.current && peerRef.current.signalingState !== 'closed') {
          console.log("ICE 후보 추가 중");
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("ICE 후보 추가됨");
        } else {
          console.warn("peer가 없거나 닫힘 상태, ICE 후보 무시");
        }
      } catch (error) {
        console.error('ICE 후보 처리 오류:', error);
      }
    });

    // WebRTC 초기화
    initializeWebRTC();

    // 컴포넌트 정리 함수
    return () => {
      console.log("Cam 컴포넌트 언마운트");
      
      // 소켓 이벤트 리스너 제거
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('manager-status');

      // 스트림 트랙 중지
      if (streamRef.current) {
        console.log("스트림 트랙 정리 중");
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log(`트랙 중지됨: ${track.kind}`);
        });
      }

      // Peer 연결 종료
      if (peerRef.current) {
        console.log("RTCPeerConnection 닫는 중");
        peerRef.current.close();
        peerRef.current = null;
        console.log("RTCPeerConnection 닫힘");
      }
    };
  }, [navigate]);

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