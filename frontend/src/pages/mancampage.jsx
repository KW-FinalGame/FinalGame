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
  const pendingCandidates = useRef([]);
  const remoteStreamRef = useRef(null);
  const [gifUrl, setGifUrl] = useState(null);
  const [debug, setDebug] = useState('초기화 중...');

  const roomId = 'default-room';

  useEffect(() => {
    console.log('[소켓] join-room 시도');
    socket.emit('join-room', { role: 'manager', roomId });
    
    
    // offer 수신 처리
    socket.on('offer', async ({ offer }) => {
      console.log('[소켓] offer 수신');
      try {
        // 1. RTCPeerConnection 생성
        const peer = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });

        // 2. ICE 후보 이벤트 등록
        peer.onicecandidate = (event) => {
          if (event.candidate) {
            console.log('[WebRTC] ICE 후보 전송');
            socket.emit('ice-candidate', { candidate: event.candidate, roomId });
          }
        };

        // 3. 연결 상태 변화 이벤트 등록
        peer.onconnectionstatechange = () => {
          console.log('[WebRTC] 연결 상태 변경:', peer.connectionState);
          setDebug(`연결 상태: ${peer.connectionState}`);
          setIsConnected(peer.connectionState === 'connected');
        };

        // 4. remote 스트림 초기화 및 비디오 엘리먼트에 연결
        const stream = new MediaStream();
        remoteStreamRef.current = stream;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }

        // 5. ontrack 이벤트 핸들러
        peer.ontrack = (event) => {
          console.log('[WebRTC] 원격 트랙 수신');
          event.streams[0].getTracks().forEach(track => {
            remoteStreamRef.current.addTrack(track);
          });
        };

        // 6. 원격 설명 설정
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        console.log('[WebRTC] 원격 설명 설정 완료');

        // 7. answer 생성 및 로컬 설명 설정
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        // 8. peerRef.current에 할당
        peerRef.current = peer;

        // 9. answer 소켓 전송
        socket.emit('answer', { answer, roomId });
        console.log('[WebRTC] answer 전송 완료');
        // offer 처리 완료 후 이전에 임시 저장한 ICE 후보 추가
        pendingCandidates.current.forEach(async (candidate) => {
          try {
            await peer.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error('[오류] 임시 저장된 ICE 후보 추가 실패:', e);
          }
        });
        pendingCandidates.current = [];
      } catch (e) {
        console.error('[오류] offer 처리 중:', e);
      }
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      console.log('[소켓] ICE 후보 수신');
      try {
        if (peerRef.current) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('[WebRTC] ICE 후보 추가 완료');
        } else {
          console.warn('[경고] peer가 아직 초기화되지 않음. ICE 후보 무시 또는 임시 저장 필요');
          // 필요하면 후보 임시 저장 후 peer 생성 후 추가하는 로직 작성 가능
        }
      } catch (error) {
        console.error('[오류] ICE 후보 처리 실패:', error);
      }
    });
    

    socket.on('room-members', (members) => {
      console.log('[소켓] room-members 업데이트:', members);
    
      const myId = socket.id;
      const otherMembers = members.filter((id) => id !== myId);
    
      if (otherMembers.length === 0) {
        // ✅ 상대방 퇴장 시 처리
        console.log('[WebRTC] 상대방 퇴장 감지');
    
        if (peerRef.current) {
          peerRef.current.close();
          peerRef.current = null;
          console.log('[WebRTC] peer 연결 종료');
        }
    
        if (remoteVideoRef.current) {
          remoteVideoRef.current.style.opacity = '0'; // 영상 숨김
          // remoteVideoRef.current.srcObject = null; // 원한다면 해제
        }
    
        setIsConnected(false);
        setDebug('상대방이 퇴장했습니다.');
      } else {
        // ✅ 상대방 입장 시 처리
        console.log('[WebRTC] 상대방 입장 감지');
    
        if (remoteVideoRef.current) {
          remoteVideoRef.current.style.opacity = '1'; // 영상 보이기
        }
    
        setDebug('상대방이 입장했습니다.');
      }
    });
    
    

    socket.on('manager-status', ({ connected }) => {
      console.log('[소켓] manager-status:', connected);
    });

    socket.on('play-video-url', (url) => {
      console.log('[소켓] 비디오 URL 수신:', url);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.src = url;
        remoteVideoRef.current.play().catch(err => console.error('비디오 재생 실패:', err));
      }
    });

    socket.on('play-gif-url', (url) => {
      console.log('[소켓] GIF URL 수신:', url);
      setGifUrl(url);
    });

    socket.on('error', (msg) => {
      console.error('[소켓] 에러 수신:', msg);
      alert(msg);
    });

    return () => {
      console.log('[정리] 이벤트 및 연결 정리');
      socket.off('offer');
      socket.off('ice-candidate');
      socket.off('room-members');
      socket.off('manager-status');
      socket.off('play-video-url');
      socket.off('play-gif-url');
      socket.off('error');

      if (remoteVideoRef.current?.srcObject) {
        remoteVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        remoteVideoRef.current.srcObject = null;
      }

      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
    };
  }, [roomId]);

  const goBackToManage = () => {
    console.log('[이동] 관리 페이지로 돌아감');
  
    // 룸 나가기 이벤트 소켓으로 알림
    socket.emit('leave-room', { roomId, userId: 'manager' }); // userId는 상황에 맞게 수정하세요.
  
    // WebRTC 연결 종료 및 스트림 정리 (필요하면)
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    
  
    // 페이지 이동
    navigate('/manage');
  };
  

  const handlePlayGif = (keyword) => {
    console.log(`[소켓] GIF 요청 전송: ${keyword}`);
    socket.emit('trigger-gif', keyword);
  };

  return (
    <PageWrapper>
      <Header>
        <LogoText>LOGOTEXT</LogoText>
      </Header>

      <WebcamBox>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
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
