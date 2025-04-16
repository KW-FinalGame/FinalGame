# FinalGame
KWU 캡스톤 과제

## 실행방법

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
   
