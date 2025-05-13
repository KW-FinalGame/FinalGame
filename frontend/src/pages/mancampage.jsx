import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

// 전역 소켓만 사용, 전역 peer 제거
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
  const remoteStreamRef = useRef(null); // 원격 스트림을 저장하기 위한 ref 추가
  const [videoMounted, setVideoMounted] = useState(false); // 비디오 요소 마운트 상태 추가
  
  // 디버깅을 위한 상태 추가
  const [debug, setDebug] = useState('초기화 중...');

  useEffect(() => {
    console.log("Mancam 컴포넌트 마운트");
  
    // 역무원으로 접속 알림
    socket.emit('join-as-manager');
    console.log("역무원으로 접속 알림 전송");
  
    // 새로운 RTCPeerConnection 생성
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });
    peerRef.current = peer;
    console.log("RTCPeerConnection 생성됨");
  
    // 원격 트랙 수신 이벤트 리스너
    peer.ontrack = (event) => {
      console.log("트랙 수신됨:", event);
      console.log("event.streams:", event.streams);
      console.log("event.track:", event.track);
      console.log("event.track.kind:", event.track.kind);  // video, audio
      console.log("remoteVideoRef.current:", remoteVideoRef.current);
      
      // 스트림을 ref에 저장
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        
        // 비디오 요소가 있으면 바로 설정
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
          setIsConnected(true);
          console.log("비디오 엘리먼트에 원격 스트림 설정 완료");
        } else {
          console.log("remoteVideoRef가 아직 준비되지 않음, 스트림은 저장됨");
        }
      }
    };
  
    // 연결 상태 변경 이벤트 리스너
    peer.onconnectionstatechange = (event) => {
      console.log("연결 상태 변경:", peer.connectionState);
      setDebug(`연결 상태: ${peer.connectionState}`);
    };
  
    // ICE 연결 상태 변경 이벤트 리스너
    peer.oniceconnectionstatechange = (event) => {
      console.log("ICE 연결 상태 변경:", peer.iceConnectionState);
    };
  
    // ICE 후보 생성 이벤트 리스너
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("ICE 후보 생성:", event.candidate);
        socket.emit('ice-candidate', event.candidate);
      }
    };
  
    // 시그널링 상태 변경 이벤트 리스너
    peer.onsignalingstatechange = (event) => {
      console.log("시그널링 상태 변경:", peer.signalingState);
    };
  
    // 오퍼 수신 처리
    socket.on('offer', async (offer) => {
      console.log("오퍼 수신:", offer);
      try {
        setDebug('오퍼 수신됨, 처리 중...');
        if (!peerRef.current) return;
  
        // 중복 수신 방지 및 상태 확인
        if (peerRef.current.signalingState !== 'stable') {
          console.warn('신호 상태 안정적이지 않음, offer 무시');
          return;
        }
  
        // 원격 설명 설정
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        console.log("원격 설명 설정 완료");
  
        // 응답 생성
        const answer = await peer.createAnswer();
        console.log("응답 생성됨:", answer);
  
        // 로컬 설명 설정
        await peer.setLocalDescription(answer);
        console.log("로컬 설명 설정 완료");
  
        // 응답 전송
        socket.emit('answer', answer);
        console.log("응답 전송됨");
  
        setDebug('응답 전송 완료, 연결 대기 중...');
      } catch (error) {
        console.error('오퍼 처리 오류:', error);
        setDebug(`오류 발생: ${error.message}`);
      }
    });
  
    // ICE 후보 수신 처리
    socket.on('ice-candidate', async (candidate) => {
      console.log("ICE 후보 수신:", candidate);
      try {
        if (peer.signalingState !== 'closed') {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("ICE 후보 추가됨");
        }
      } catch (error) {
        console.error('ICE 후보 처리 오류:', error);
      }
    });
  
    // 컴포넌트 언마운트 시 정리
    return () => {
      console.log("Mancam 컴포넌트 언마운트");
  
      // 이벤트 리스너 제거
      socket.off('offer');
      socket.off('ice-candidate');
  
      // 원격 비디오 스트림 정리
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
        const tracks = remoteVideoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        remoteVideoRef.current.srcObject = null;
      }
  
      // RTCPeerConnection 종료
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
    };
  }, []);
  
  // 비디오 마운트 상태와 스트림 상태를 함께 관찰하여 연결 설정
  useEffect(() => {
    console.log("비디오 마운트 상태 변경 감지:", videoMounted);
    console.log("스트림 상태:", !!remoteStreamRef.current);
    
    if (videoMounted && remoteStreamRef.current) {
      console.log("비디오 마운트됨 & 스트림 있음 -> 연결 설정");
      setIsConnected(true);
    }
  }, [videoMounted, remoteStreamRef.current]);

  const goBackToManage = () => {
    navigate('/manage');
  };
  const handlePlayVideo = (videoId) => {
    const url = `http://localhost:3002/videos/${videoId}.mp4`; // 예시 경로
    socket.emit('trigger-play-db-video', url);
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
        console.log("비디오 요소 마운트됨");
        setVideoMounted(true);
        if (remoteStreamRef.current) {
          console.log("마운트 시 저장된 스트림으로 비디오 설정");
          el.srcObject = remoteStreamRef.current;
          console.log("remoteStreamRef.current:", remoteStreamRef.current);
          el.onloadedmetadata = () => {
            console.log("비디오 메타데이터 로드됨, 재생 시도");
            el.play().catch(e => console.error("비디오 재생 실패:", e));
          };
        }
      }
    }}
    autoPlay
    playsInline
    muted
    style={{ width: '100%', height: '100%',transform: 'scaleX(-1)' }}
  />
</WebcamBox>
<TextBox>
  {isConnected ? "사용자와 연결되었습니다!" : "사용자 연결 대기 중..."}
</TextBox>

      <TextBox>
        여기에 사용자의 수화를 인식한 텍스트가 나와요.
      </TextBox>
      <ButtonWrapper>
        <ButtonGrid>
          <SmallButton onClick={() => handlePlayVideo('sample1')}>기다려주세요</SmallButton>
          <SmallButton onClick={() => handlePlayVideo('sample2')}>문 열어드릴게요</SmallButton>
          <SmallButton onClick={() => handlePlayVideo('sample3')}>맞습니다</SmallButton>
          <SmallButton onClick={() => handlePlayVideo('sample4')}>아닙니다</SmallButton>
        </ButtonGrid>
        <WideButton onClick={() => handlePlayVideo('sample5')}>다시 한번 인식해주시겠어요?</WideButton>
        <WideButton onClick={() => handlePlayVideo('sample6')}>지원되는 수어 리스트</WideButton>
        <WideButton onClick={() => handlePlayVideo('sample7')}>민원이 해결되었나요?</WideButton>
      </ButtonWrapper>

      <RoundButton onClick={goBackToManage}>✆</RoundButton>
    </PageWrapper>
  );
}

export default Mancam;