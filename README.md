# CleverSchool Frontend

Frontend của hệ thống **CleverSchool LMS** — nền tảng quản lý học tập cho Admin, Giáo viên và Học sinh.

- **Demo:** https://clever-school-fe-wmft-nviethung04s-projects.vercel.app  
- **Backend:** https://github.com/nviethung04/CleverSchool-be  
- **Nhánh mặc định:** `develop`

---

## Giới thiệu

Ứng dụng web Next.js gọi API backend CleverSchool để phục vụ:

- Đăng nhập / đăng ký / quên mật khẩu / đặt lại mật khẩu
- Quản trị (`/manage`): trường, lớp, khóa học, chương trình, bài học, câu hỏi…
- Dashboard & báo cáo tiến độ
- Module học tập: bài kiểm tra, bài tập về nhà, luyện tập, flashcard, H5P
- Đa ngôn ngữ VI / EN (`next-intl`, thư mục `messages/`)

---

## Tech stack

| Thành phần | Công nghệ |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS, shadcn/ui (Radix) |
| State / data | Redux Toolkit, TanStack Query, Axios |
| Form | React Hook Form + Zod |
| i18n | next-intl |
| Package manager | pnpm 10.13.1 |
| Deploy | Vercel (`vercel.json`) |

---

## Yêu cầu

- Node.js **20+**
- **pnpm** 10 (`corepack enable` hoặc `npm i -g pnpm`)
- Backend CleverSchool đang chạy (local hoặc online)

---

## Cài đặt & chạy local

```bash
git clone https://github.com/nviethung04/CleverSchool-fe.git
cd CleverSchool-fe
git checkout develop
pnpm install
cp env.local.sample .env.local
```

Chỉnh `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

Chạy:

```bash
pnpm dev
```

Mở http://localhost:3000

---

## Scripts

| Lệnh | Mô tả |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` | Build production |
| `pnpm start` | Chạy bản đã build |
| `pnpm lint` | ESLint |

---

## Cấu trúc thư mục (rút gọn)

```text
app/
  [locale]/          # Routes đa ngôn ngữ
  login/             # Đăng nhập
  register/          # Đăng ký
  manage/            # Khu vực quản trị
  dashboard/         # Dashboard
  forgot-password/   # Quên mật khẩu
  reset-password/    # Đặt lại mật khẩu
components/          # UI (admin, form, shadcn)
lib/                 # API client & helpers
hooks/
messages/            # vi.json, en.json
proxy.ts             # Proxy liên quan API
public/
styles/
vercel.json
Dockerfile
docker-compose.yml
```

---

## Biến môi trường

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Có | Base URL API backend, kết thúc bằng `/api` |

Mẫu: [`env.local.sample`](./env.local.sample)

> Biến `NEXT_PUBLIC_*` lộ ra trình duyệt — không để secret vào đây.

---

## Deploy Vercel

1. Import repo trên [vercel.com](https://vercel.com)
2. Framework: **Next.js**
3. Install: `pnpm install` · Build: `pnpm build`
4. Env:

   ```text
   NEXT_PUBLIC_API_BASE_URL=https://your-api-host/api
   ```

5. Deploy

Hướng dẫn chi tiết: [`README_DEPLOY_VERCEL.md`](./README_DEPLOY_VERCEL.md)

**CORS:** thêm domain FE vào `ALLOW_ORIGINS` của backend rồi redeploy API.

---

## Docker (tuỳ chọn)

```bash
docker compose up --build
```

---

## Liên kết

- Deploy Vercel: [README_DEPLOY_VERCEL.md](./README_DEPLOY_VERCEL.md)
- Backend: [CleverSchool-be](https://github.com/nviethung04/CleverSchool-be)
