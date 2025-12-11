# 📘 Git & GitHub Guide  
---

## 🔶 Git 개요
Git은 파일 변경 이력을 추적·관리하는 **분산 버전 관리 시스템(DVCS)**이다.  
이를 통해 여러 개발자가 협업하면서 동일한 프로젝트를 안정적으로 관리할 수 있다.

### ✔ Git의 주요 기능
- **버전 관리**: 파일의 수정 기록을 남기고 과거 버전으로 복구 가능  
- **백업**: 원격 저장소(GitHub 등)에 안전하게 보관  
- **협업**: 여러 개발자가 동시에 작업해도 충돌 관리 가능  

---

## 🔶 Git 작동 구조
Git은 아래 **3단계 저장 구조**를 가진다.

### 1) Working Directory
실제 작업 파일이 있는 공간

### 2) Staging Area  
커밋할 파일을 선택해 올려두는 대기 공간

### 3) Repository (Commit 저장소)  
최종 버전 이력이 기록되는 공간

### 저장 흐름
Working Directory → Staging Area → Repository

---

## 🔶 Git 기본 명령어

### 🔹 전역 설정
```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

🔹 Git 저장소 초기화
git init

🔹 파일 상태 확인
git status

🔹 스테이징 (add)
git add 파일명
git add .   # 변경된 모든 파일 추가

🔹 커밋
git commit -m "커밋 메시지"

🔹 커밋 로그 확인
git log
git log --oneline

🔹 브랜치 작업
git branch                # 브랜치 목록
git branch feature/login  # 브랜치 생성
git switch feature/login  # 브랜치 이동
git merge feature/login   # 병합

🔹 되돌리기
git checkout -- 파일명          # 변경 되돌리기
git reset --hard 커밋ID         # 해당 커밋으로 완전 되돌림
