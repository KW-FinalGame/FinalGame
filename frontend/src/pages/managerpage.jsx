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
  font-size: 25px;
  font-weight: bold;
  color: #333;
  margin-top:70px;
  margin-left:55px;
  @media (max-width: 768px) {
    font-size: 25px;
  }
  @media (max-width: 480px) {
    font-size: 20px;
    margin-left:10px;

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
        <h3>1. <strong>수어 요청이 들어오면 어떻게 해야 하나요?👀</strong></h3>
        <ul>
          <li>고객이 수어 통역 웹서비스를 통해 요청을 보냅니다.</li>
          <li>[알림창]이 역무원 화면에 표시됩니다.</li>
        </ul>
        <p>👉 “고객이 수어 민원을 요청했습니다. 실시간 영상이 시작됩니다.”</p>

        <p>▶ 즉시 해야 할 일</p>
        <ol>
          <li><strong>웹캠을 정면에 두고 고객 화면 주시</strong></li>
          <li>고객이 손동작을 시작하면, 자동으로 <strong>텍스트 해석 결과</strong>가 화면에 출력됨</li>
          <li>민원 내용을 파악하고, <strong>즉각적/적절한 대응</strong> 준비</li>
        </ol>

        <h3>2. 💬 <strong>무슨 말을 해야 하지? (민원 상황별 대응법)</strong></h3>
        <table>
          <thead>
            <tr>
              <th>고객 수어 내용 (예시)</th>
              <th>AI 해석 결과</th>
              <th>역무원 응답 방법</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>핸드폰을 잃어버렸어요</td>
              <td>분실물 신고</td>
              <td>“분실물 센터로 안내드릴게요. ○○번 출구 쪽에 있습니다.”</td>
            </tr>
            <tr>
              <td>화장실이 어디예요?</td>
              <td>위치 문의</td>
              <td>“화장실은 이 개찰구 오른쪽에 있어요.”</td>
            </tr>
            <tr>
              <td>도움을 주세요</td>
              <td>일반 요청</td>
              <td>“무엇을 도와드릴까요? 다시 한 번 수어 부탁드려도 될까요?”</td>
            </tr>
          </tbody>
        </table>

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
          <li>고객의 눈높이에 맞춰 시선 맞추기</li>
          <li>말 대신 <strong>화면의 응답 버튼</strong>을 눌러 텍스트 전송 또는 음성 송출 선택</li>
          <li>당황하거나 웃지 말고, <strong>차분하게</strong> 화면에 집중</li>
          <li>마지막엔 꼭 <strong>“민원 해결이 되었나요?”</strong> 라는 안내 멘트 전송</li>
        </ul>
      </ManualText>

      </GrayBox>
    </PageWrapper>
  );
}

export default Manage;
