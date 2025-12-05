# 🚀 배포 가이드 (Supabase + Render + Vercel)

이 가이드는 **Supabase (DB)**, **Render (Backend)**, **Vercel (Frontend)** 조합으로 서비스를 배포하는 방법을 단계별로 설명합니다.

---

## 1단계: 데이터베이스 생성 (Supabase)
1. [Supabase](https://supabase.com/)에 가입하고 로그인합니다.
2. **"New Project"**를 클릭합니다.
3. 프로젝트 정보를 입력합니다:
   - **Name**: `ai-calendar` (원하는 이름)
   - **Database Password**: **강력한 비밀번호**를 생성하고 **반드시 복사해두세요!** (나중에 다시 볼 수 없습니다)
   - **Region**: `Seoul` (또는 가까운 곳)
4. 프로젝트가 생성될 때까지 기다립니다 (약 1~2분).
5. 생성 후, 왼쪽 메뉴에서 **Project Settings (톱니바퀴 아이콘)** -> **Database**로 이동합니다.
6. **Connection String** 섹션에서 `URI` 탭을 선택합니다.
7. 주소를 복사합니다.
   - 예: `postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`
   - `[YOUR-PASSWORD]` 부분을 아까 설정한 비밀번호로 바꿔주세요.
   - **이 주소가 바로 `DATABASE_URL`입니다.** 메모장에 잘 저장해두세요.

---

## 2단계: 백엔드 배포 (Render)
1. [Render](https://render.com/)에 가입하고 로그인합니다.
2. 우측 상단 **"New +"** 버튼 -> **"Web Service"**를 클릭합니다.
3. **"Build and deploy from a Git repository"**를 선택하고, GitHub 계정을 연동하여 `ai-calendar` 저장소를 선택합니다. (아직 GitHub에 코드를 올리지 않았다면, 먼저 GitHub에 코드를 푸시해야 합니다!)
   - *GitHub에 코드가 없다면 저에게 말씀해주세요. GitHub 업로드부터 도와드리겠습니다.*
4. 설정 화면에서 다음 내용을 입력합니다:
   - **Name**: `ai-calendar-backend`
   - **Region**: `Singapore` (한국과 가장 가까움)
   - **Branch**: `main` (또는 작업 중인 브랜치)
   - **Root Directory**: `backend` (중요! 백엔드 코드가 이 폴더 안에 있으므로)
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. 아래로 내려가 **"Environment Variables"** 섹션에서 변수를 추가합니다:
   - Key: `DATABASE_URL`
   - Value: (1단계에서 복사한 Supabase 접속 주소)
   - Key: `NODE_ENV`
   - Value: `production`
6. **"Create Web Service"**를 클릭합니다.
7. 배포가 시작됩니다. 완료되면 상단에 `https://ai-calendar-backend.onrender.com` 같은 **Backend URL**이 표시됩니다. **이 주소를 복사해두세요.**

---

## 3단계: 프론트엔드 배포 (Vercel)
1. [Vercel](https://vercel.com/)에 가입하고 로그인합니다.
2. **"Add New..."** -> **"Project"**를 클릭합니다.
3. GitHub 저장소를 가져옵니다 (`ai-calendar` 선택).
4. **Configure Project** 화면에서:
   - **Framework Preset**: `Vite` (자동으로 감지될 것입니다)
   - **Root Directory**: `Edit`을 눌러 `ai-calendar` (프론트엔드 폴더)를 선택합니다.
5. **Environment Variables** 섹션을 펼쳐서 변수를 추가합니다:
   - Key: `VITE_API_URL`
   - Value: (2단계에서 복사한 Render Backend URL) **주의: 뒤에 `/`를 붙이지 마세요.** (예: `https://ai-calendar-backend.onrender.com`)
6. **"Deploy"**를 클릭합니다.
7. 잠시 후 배포가 완료되고, 폭죽이 터지면 성공입니다! 🎉

---

## 4단계: 데이터베이스 스키마 적용 (중요!)
백엔드가 배포되었지만, 데이터베이스는 아직 비어있습니다. 로컬에서 Supabase로 테이블을 생성해줘야 합니다.

1. VS Code 터미널을 엽니다.
2. `backend` 폴더로 이동: `cd backend`
3. `.env` 파일의 `DATABASE_URL`을 **Supabase 주소**로 잠시 변경합니다. (배포 후 다시 되돌리거나, 명령어로만 실행할 수도 있습니다)
   - 또는 아래 명령어를 직접 실행합니다 (Windows Powershell):
     ```powershell
     $env:DATABASE_URL="postgresql://postgres.xxxx:[비밀번호]@..."
     npx prisma db push
     ```
   - `npx prisma db push` 명령어가 성공하면 테이블이 생성된 것입니다.

---

### 💡 팁
- 배포 후 프론트엔드 접속 시 "Network Error"가 뜬다면, 백엔드(Render)가 무료 플랜이라 잠들어서 그럴 수 있습니다. 1분 정도 기다렸다가 새로고침 해보세요.
