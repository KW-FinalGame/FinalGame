import React from 'react';
import styled from 'styled-components';
import man from "../assets/imgs/man.png";

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
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

const GrayBox = styled.div`
  background-color: #D9D9D9;
  margin-top: 60px;
  margin-bottom: 30px;
  padding: 20px;
  width: 35%;
  height: auto;
  border-radius: 12px;

  @media (max-width: 768px) {
    width: 90%;
  }

  @media (max-width: 480px) {
    width: 95%;
  }
`;
const TopWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding-bottom: 0px;
`;

const ManImage = styled.img`
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-top:10px;
  margin-bottom: -20px;
  @media (max-width: 768px) {
    width: 80px;
    height: 80px;
  }
`;

const ManualTitle = styled.div`
  font-size: 35px;
  font-weight: bold;
  color: #333;
  margin-top:20px;
  margin-bottom: -20px;
  @media (max-width: 768px) {
    font-size: 25px;
  }
  @media (max-width: 480px) {
    margin-top:10px;
    font-size: 26px;
  }
`;

const ManualText = styled.div`
  font-size: 18px; /* 전체적으로 줄임 (기존 25px → 18px) */
  font-weight: normal;
  color: #333;
  margin-top: 40px;
  margin-left: 30px;

  h3 {
    font-size: 20px;
    font-weight: bold;
    margin-top: 20px;
  }

  ul {
    padding-left: 20px;
    margin-bottom: 20px;
  }

  li {
    font-size: 17px;
    margin-bottom: 10px;
  }

  blockquote {
    font-size: 16px;
    font-style: italic;
    background-color: #BEBEBE;
    padding: 15px;
    border-left: 5px solid #ccc;
    margin-top: 20px;
  }

  a {
    color: inherit;
    text-decoration: underline;
  }

  @media (max-width: 768px) {
    font-size: 16px;

    h3 {
      font-size: 18px;
    }

    li {
      font-size: 15px;
    }

    blockquote {
      font-size: 14px;
    }
  }

  @media (max-width: 480px) {
    font-size: 15px;
    margin-left: 10px;

    h3 {
      font-size: 16px;
    }

    li {
      font-size: 14px;
    }

    blockquote {
      font-size: 13px;
    }
  }
`;


function Manage() {
  return (
    <PageWrapper>
      <Header>
        <LogoText>LOGOTEXT</LogoText>
      </Header>

      <GrayBox>
      <TopWrapper>
        <ManImage src={man} alt="역무원 이미지"/>
        <ManualTitle>역무원 수어 민원 대응 매뉴얼</ManualTitle>
      </TopWrapper>
      <ManualText>
        <h3> <strong>1.수어 요청이 들어오면 어떻게 해야 하나요?👀</strong></h3>
        <ul>
          <li><strong>웹캠을 정면에 두고 고객 화면 주시</strong></li>
          <li>고객이 손동작을 시작하면, 자동으로 <strong>텍스트 해석 결과</strong>가 화면에 출력됨</li>
          <li>민원 내용을 파악하고, <strong>즉각적/적절한 대응</strong> 준비</li>
        </ul>

        <h3> <strong>2.민원 상황별 대응법 💬</strong></h3>
        <ul>
          <li>개찰구의 문이 안열릴경우 - 문열림 버튼 누르기</li>
          <li>고객이 질문한 경우 - 질문에 따른 답변(예,아니오) 버튼 누르기</li>
          <li>버튼으로 대응불가한 경우 - 기다려주세요 버튼 누른 후 고객의 위치로 가서 도와드리기</li>
          <li>수화인식이 실패한 경우 - 다시 인식해주시겠어요 버튼 누른 후 대응하기 또는 인식가능한 수화 리스트 보여드리기</li>
        </ul>

        <blockquote>
          <strong>[수어 인식 실패 상황]</strong><br />
          이용자가 시스템에 등록되지 않은 수어를 수행했습니다.<br />
          의사소통이 어려운 상황으로 보이며, 직접적인 도움이 필요합니다.<br />
          <br />
          👉 참고사항:<br />
          - 시스템 인식 범위를 벗어난 수어일 수 있습니다.<br />
          - 긴급한 상황일 수 있으니 직접 의사소통을 시도해 주세요.<br />
          - 성북구 수어통역센터 전화번호: <a href="tel:029227892">02-922-7892</a>
        </blockquote>

        <h3>3. ✅ <strong>대응 시 태도 지침</strong></h3>
        <ul>
          <li>말 대신 <strong>화면의 응답 버튼</strong>을 눌러 텍스트 전송</li>
          <li><strong>차분하게</strong> 화면에 집중</li>
          <li>마지막엔 꼭 <strong>“민원 해결이 되었나요?”</strong> 라는 버튼 전송</li>
        </ul>
      </ManualText>

      </GrayBox>
    </PageWrapper>
  );
}

export default Manage;
