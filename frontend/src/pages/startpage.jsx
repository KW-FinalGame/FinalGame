// frontend/src/pages/Home.jsx
import React, { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import styled from 'styled-components';
import { motion } from 'framer-motion';

import { Button } from 'react-bootstrap';
import axios from 'axios';
import Phone from "../assets/imgs/phoneImg.png"; 
import Link from "../assets/imgs/link.png"; 
import { isAuthenticated } from '../utils/auth';


const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #273A96;

  
  /* 중앙 정렬 + 폭 제한 */
  max-width: 480px;  // 모바일 크기 기준
  margin: 0 auto;
  width: 100%;
  
  height: 100vh;   
  
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

const Usercontainer = styled.div`
  display: flex;
  flex-direction: column;
  align-self: flex-start; /* 왼쪽 정렬 */
  padding-left: 80px;      /* 왼쪽 여백 */
  margin-top: 50px;

  @media (max-width: 480px) {
    
    padding-left: 50px; 
    }
`;

const UserName = styled.h2`
  color: white;
  font-size: 40px;
  
  margin: 0;

  @media (max-width: 480px) {
    
  font-size: 35px;
  }
`;

const Usertext = styled.p`
  color: white;
  font-size: 40px;
  margin-top: 8px;

  @media (max-width: 480px) {
    
  font-size: 35px;
  }
`;

const StyledImage = styled.img`
  margin-top:20px;
  margin-left:10px;
  width: 75%;
  height: auto;

  margin-left:80px;
  @media (max-width: 480px) {
    width: 80%;
    height: auto;
    margin-left:30px;
  }
`;

const CustomButton = styled(Button)`
  background-color: #FFFFFF !important;
  border: none !important;
  font-size: 25px;
  font-weight: bold;
  color: gray !important;
  border-radius: 20px;
  outline: none !important;
  box-shadow: none !important;
  margin-top:70px;
  margin-left:80px;
  
  
  width: 65%;        /* ✅ 부모(PageWrapper) 너비만큼 */
  max-width: 100%; 
  padding: 10px 70px;

  &:hover {
    background-color: #687AD1 !important;
  }

  @media (max-width: 480px) {
    margin-top:50px;
    width: 85%;
    font-size: 25px;
    margin-left:30px;
  }
`;

const LogoutText = styled.div`
  text-align: center;
  font-size: 25px;
  margin-top:30px;
  margin-bottom:22px;
  color: #ffffff;
  text-decoration: underline;
  cursor: pointer;

  &:hover {
    color: #333;
  }
`;

// ===== Component =====
function Start() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');

    useEffect(() => {
        if (!isAuthenticated()) {
          alert("로그인이 필요합니다.");
          navigate('/');
        }
      }, [navigate]);

    useEffect(() => {
        const storedName = sessionStorage.getItem('userId');
        if (storedName) {
          setUsername(storedName);
        }
      }, []);
    
    const GotoMain = () => {
        navigate('/main');
    }
    const handleLogout = () => {
        sessionStorage.clear();
        navigate('/');
      };
  return (
    <PageWrapper>
        <Logocontainer>
        <Logoicon src={Link} alt="링크 아이콘 이미지"></Logoicon>
        <Logotext>손말이음</Logotext>
        </Logocontainer>

        <motion.div
      initial={{ opacity: 1, y: 0 }}       // 시작은 원래 위치
      exit={{ opacity: 0, y: -100 }}       // 사라질 때 위로 밀려나감
      transition={{ duration: 1.0}}
    >

        <Usercontainer>
            <UserName>
            <strong>{username}님</strong> 
            </UserName>
        <Usertext><strong>도움이 필요하신가요?</strong></Usertext>
        </Usercontainer>

        
      <StyledImage src={Phone} alt="휴대폰 이미지" />

      <CustomButton onClick={GotoMain}>
        도움요청하기
      </CustomButton>
      
    <LogoutText onClick={handleLogout}>로그아웃</LogoutText>
    </motion.div> 
    </PageWrapper>
  );
}

export default Start;
