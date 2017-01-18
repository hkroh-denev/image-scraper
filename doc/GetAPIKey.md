# Google Custom Search Engine API

### Google CSE ID
* Google Custom Search Engine 사이트에 접속하여 검색 엔진을 생성한다. https://cse.google.com
* 검색할 사이트는 *.example.com 처럼 입력하면 된다.
* "만들기" 를 선택하면 검색 엔진이 생성된다.
* 검색엔진 수정하기 항목의 제어판을 선택한다.
* 이미지 검색 항목을 사용함으로 변경한다.
* 검색할 사이트 항목에서 앞서 입력한 사이트 주소 (*.example.com)를 선택한뒤 삭제한다.
* 검색할 사이트 대상을 "전체 웹을 검색하지만 포함된 사이트 강조" 를 선택한다.
* 세부정보 내용중에 "검색 엔진 ID" 버튼을 눌러서 ID를 확인한다. 이것을 googleapikey.json의 CSE_ID에 입력한다.

### Google API Key
* Google API 콘솔에 접속한다. https://console.developers.google.com/ 
* 라이브러리 항목에서 Custome Search API를 선택한다. (화면에서 잘 안보이는 경우 검색)
* "프로젝트 만들기"를 선택한다.
* 프로젝트 이름을 아무것이나 입력하고 약관에 동의한뒤 '만들기'를 선택한다.
* 사용자 인증 정보에서 "사용자 인증 정보 만들기"를 선택한다. 목록에서 API키를 선택한다.
* 생성된 API키의 편집 아이콘을 선택한다.
* 키 제한사항에서 IP주소를 선택하고, 사내 공인 IP를 입력한다. (공인 IP는 whatismyip.com 등에 접속하여 확인 가능)
* 인증정보의 API키 라고 되어 있는 부분의 값을 googleapikey.json의 API_KEY에 입력한다.

# Naver Search API

* 네이버 개발자 센터 접속 https://developers.naver.com/main
* '개발가이드'에서 '오픈 API 이용 신청' 선택
* 애플리케이션 등록 (이름은 아무것이나 입력해도 됨), 이용 목적에서 '비로그인 오픈 API' 선택 
* 생성 후 '내 애플리케이션'에서 등록된 어플리케이션 정보 확인
* Client ID 와 Client Secret을 각기 naverapikey.json의 해당 항목에 입력

