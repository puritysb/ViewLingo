# ViewLingo - macOS용 실시간 화면 번역기

🌍 Language: [English](../README.md) | **한국어** | [日本語](README-ja.md) | [简体中文](README-zh-Hans.md) | [繁體中文](README-zh-Hant.md) | [ไทย](README-th.md) | [Español](README-es.md) | [Français](README-fr.md) | [Deutsch](README-de.md) | [Tiếng Việt](README-vi.md)

[![Mac App Store에서 다운로드](https://developer.apple.com/app-store/marketing/guidelines/images/badge-download-on-the-mac-app-store.svg)](https://apps.apple.com/app/apple-store/id6749508592?pt=128040795&ct=github&mt=12)

## 🎯 화면의 글자를 그 자리에서 내 언어로

게임, 영상, 사진, PDF, 앱 창 위로 뷰파인더를 드래그하세요. ViewLingo가 글자를 인식해 번역을 원문 바로 위에 AR처럼 겹쳐 보여 줍니다. 복사하거나 앱을 전환하지 않고 읽을 수 있습니다.

### ✨ 주요 기능
- 🔍 **뷰파인더 번역**: `fn+Control+Option`을 누르고 읽고 싶은 글자 위로 드래그하세요. `fn+Control`을 두 번 탭하면 포인터 위치에 바로 뷰파인더가 열립니다. 옮기거나 크기를 바꿔도 번역이 따라옵니다.
- 🎨 **제자리 AR 오버레이**: 원문의 배치와 색에 맞춰 번역을 겹쳐 그리고, 긴 번역도 읽기 좋게 글자 크기를 자동으로 맞춥니다. 공간이 좁을 때는 마우스를 올리면 전체 번역이 보입니다.
- ⚡ **Live 모드**: 영상 자막, 게임, 슬라이드, 라이브 방송처럼 바뀌는 글자를 따라가고, 화면이 그대로일 때는 번역도 흔들림 없이 유지됩니다. 뷰파인더를 잠그면 번역을 띄운 채로 아래 화면을 클릭하고 스크롤할 수 있습니다.
- 🎛️ **간결한 도구막대**: Live, 다시 시도, 닫기를 쉽게 조작합니다. 3.0의 화면을 채운 뷰파인더에서는 테두리 크기 조절 공간을 남기고 도구막대를 안쪽에 배치합니다.
- 📐 **세로쓰기 지원**: 일본어·중국어·한국어 세로쓰기 글자도 인식해 번역합니다.
- 🌍 **내 Mac이 지원하는 언어**: Mac의 문자 인식(OCR)과 Apple 번역이 함께 지원하는 모든 언어를 제공하며, macOS가 발전할수록 함께 늘어납니다. 언어팩은 첫 설정 안내에 따라 한 번만 내려받으면 이후 기본 Apple 번역은 오프라인으로 동작합니다.
- 🔒 **프라이버시 중심 설계**: 기본 Apple 번역은 기기에서 처리합니다. 앱 분석·추적은 없으며 화면 기록 권한이 필요합니다. 3.0의 선택형 외부 비교는 아래 안내를 확인하세요.

### 💡 간단하고 정직한 가격
- 한 번 구매, 구독 없음. 지역별 가격은 App Store에서 확인하세요.
- Apple 번역에는 계정이 필요 없습니다. 3.0의 선택형 DeepL 비교에는 본인의 API 계정이 필요하며 제공자의 비용과 한도가 별도로 적용됩니다.
- Mac에 내장된 Apple 번역 엔진 사용
- 기본 Apple 번역은 언어팩을 받은 뒤 인터넷 없이 동작합니다.

### 🚀 시작하기
1. Mac App Store에서 다운로드
2. 첫 실행 안내에 따라 화면 기록 권한을 허용하고 언어팩 다운로드
3. `fn+Control+Option`을 누르고 번역할 글자 위로 드래그
4. 원문 위에 표시된 번역을 바로 읽으세요!

### ⌨️ 키보드 단축키
- `fn+Control+Option` - 새 뷰파인더 만들기 (설정에서 변경 가능)
- `fn+Control` 두 번 탭 - 포인터 위치에 뷰파인더 바로 열기
- `ESC` 또는 세 번 클릭 - 뷰파인더 닫기
- 뷰파인더 옆 **Live** 버튼 - Live 모드 켜기/끄기

### 📋 시스템 요구사항
- macOS 15.0 이상
- Apple 실리콘과 Intel Mac을 모두 지원하는 유니버설 앱
- 화면 기록 권한

### 📮 지원 및 피드백
- 🐛 버그 신고: [Issues](https://github.com/puritysb/ViewLingo/issues)
- 💡 기능 요청: [Discussions](https://github.com/puritysb/ViewLingo/discussions)
- 📧 이메일: admin@foundby.kr

### 🔐 개인정보 보호
일반 캡처와 Live는 Apple을 사용해 Mac에서 처리하며 2.x는 계속 로컬에서 동작합니다. 3.0에서는 자신의 DeepL API 키를 Keychain에 저장하고 동의한 뒤 별도 비교를 요청할 수 있습니다. 직접 선택한 원문, 같은 캡처의 이전 문맥 최대 5개, 용어 최대 5개만 보냅니다. 스크린샷·창 제목·전체 기록은 보내지 않습니다. 기록과 프로젝트는 로컬에 저장하며 앱 사용 통계를 수집하지 않습니다. 제공자의 데이터 처리 조건을 확인하고, Free / Developer로 개인 정보나 기밀 텍스트를 보내지 마세요. 자세한 내용은 [개인정보 처리방침](https://puritysb.github.io/ViewLingo/ko/privacy.html)을 확인하세요.

### 🌟 왜 ViewLingo인가?
- **즉시**: 복사-붙여넣기도, 앱 전환도 없음
- **자연스러움**: 번역이 원문 레이아웃 그대로 겹쳐 표시
- **프라이빗**: 기본 Apple 번역은 로컬 처리, 외부 비교는 직접 동의하고 요청할 때만
- **오프라인**: 기본 Apple 번역은 언어팩 다운로드 후 인터넷 없이 동작
- **익숙한 언어로**: 한국어를 포함한 12개 언어로 앱 인터페이스 제공

---

<p align="center">
언어 학습자와 세계 시민을 위해 ❤️로 만들었습니다
</p>

<p align="center">
  <a href="https://puritysb.github.io/ViewLingo/ko/privacy.html">개인정보 처리방침</a> •
  <a href="SUPPORT-ko.md">지원</a> •
  <a href="https://github.com/puritysb/ViewLingo/releases">릴리즈 노트</a>
</p>
