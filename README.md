# FinalGame - KWU 캡스톤 과제

## 주제
실시간 수어 모션 인식 기반 청각장애인의 지하철 민원 처리 웹서비스

## 목표
청각·언어장애인을 위한 실시간 수어 기반 지하철 민원 처리 웹 플랫폼을 개발합니다. 사용자의 손동작을 인식하여 자연어로 번역하고, 이를 역무원에게 전달함으로써 정확하고 빠른 실시간 의사소통을 지원합니다. 수어 패턴은 긴급 상황, 길 안내 등 지하철 이용 시 자주 발생하는 상황을 기반으로 설계됩니다.

## 실행방법
<strong> 1. FinalGame/ 에서 npm start </string>
   
## 파일구조
```
📦backend
 ├ 📂middlewares 
 ├ 📂ml           :수화 인식 관련 머신러닝 로직
 ├ 📂models       :Mongoose 스키마 모음
 │  └ 📜User.js   :사용자 정보 스키마
 ├ 📂routes              
 │  ├ 📜authRoutes.js   :로그인, 회원가입 관련 라우터
 │  └ 📜signRoutes.js   :수화 인식 결과 요청 및 응답API
 ├ 📜.env                 
 ├ 📜.gitignore           
 ├ 📜package.json         
 ├ 📜package-lock.json    
 └ 📜server.js 
📦frontend  
 ├ 📂public  
 │  ├ 📜favicon.ico : 기본 리액트 로고 ( 바꿀 예정)   
 │  └ 📜index.html : 기본 HTML 템플릿  
 ├ 📂src  
 │  ├ 📂assets   
 │  │  └ 📂imgs : 이미지 파일   
 │  ├ 📂pages  
 │  │  └ 📜homepage.jsx : 홈페이지 컴포넌트  
 │  ├ 📜App.js : 메인 컴포넌트  
 │  ├ 📜App.css : 앱 전역 스타일  
 │  ├ 📜index.js : 리액트 렌더링  
 │  └ 📜index.css 
 ├ 📜.gitignore 
 ├ 📜package-lock.json 
 └📜package.json  
   
