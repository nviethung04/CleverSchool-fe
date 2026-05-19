# Hướng Dẫn Deploy Frontend (Next.js) Lên Vercel - Cho Người Mới Bắt Đầu

Tài liệu này hướng dẫn từ đầu đến cuối cách đưa frontend (`fe`) lên Vercel.

## 1. Bạn cần chuẩn bị trước

1. Tài khoản GitHub có chứa repo `fe`.
2. Tài khoản Vercel (đăng nhập bằng GitHub là đơn giản nhất).
3. Đã có backend chạy online (ví dụ: `https://api.yourdomain.com`).
4. Domain riêng (không bắt buộc ở lần deploy đầu).

## 2. Kiểm tra dự án chạy local trước khi deploy

Trong thư mục `fe` chạy:

```bash
pnpm install
pnpm build
pnpm dev
```

Nếu `build` lỗi, Vercel cũng sẽ lỗi.

## 3. Tạo project trên Vercel

1. Mở https://vercel.com
2. Chọn **Add New...** -> **Project**
3. Chọn repo frontend của bạn (`fe` hoặc repo chứa `fe`)
4. Nếu repo chứa cả `be` và `fe`, ở mục **Root Directory** chọn `fe`

## 4. Cấu hình Build trên Vercel  

Thông thường Vercel tự nhận đúng Next.js. Kiểm tra lại:

- Framework Preset: `Next.js`
- Build Command: `pnpm build`
- Install Command: `pnpm install`
- Output Directory: để trống (mặc định Next.js)

Nếu repo chỉ dùng Vercel để deploy, không cần tạo GitHub Actions workflow riêng cho bước deploy. Vercel sẽ tự build và deploy khi có push vào branch đã kết nối.

## 5. Cấu hình Environment Variables (rất quan trọng)

Vào: **Project Settings** -> **Environment Variables**

Tạo ít nhất biến API của frontend trỏ backend thật. Ví dụ:

- `NEXT_PUBLIC_API_BASE_URL` = `https://api.yourdomain.com/api`

Nếu dự án có thêm biến `NEXT_PUBLIC_*`, thêm đầy đủ theo file mẫu của bạn (ví dụ `env.local.sample`).

Lưu ý:

1. Biến bắt đầu bằng `NEXT_PUBLIC_` sẽ lộ ở phía client (trình duyệt).
2. Không để secret nhạy cảm vào biến `NEXT_PUBLIC_*`.
3. Sau khi sửa env, cần **Redeploy** để biến có hiệu lực.

## 6. Deploy lần đầu

1. Bấm **Deploy**
2. Chờ build hoàn tất
3. Vercel sẽ trả về URL dạng: `https://your-project-name.vercel.app`

Nếu thành công, mở URL để test.

## 7. Trỏ domain riêng (tuỳ chọn)

1. Vào **Project Settings** -> **Domains**
2. Add domain: `app.yourdomain.com`
3. Vercel sẽ hướng dẫn bản ghi DNS (thường là `CNAME`)
4. Chờ DNS propagate rồi kiểm tra SSL tự động

## 8. Cách update phiên bản sau này

Mỗi lần bạn `git push` lên branch đã kết nối (thường `main`), Vercel sẽ tự build/deploy.

Gợi ý:

1. Dùng branch `main` cho production.
2. Dùng branch `develop` cho preview nếu cần.

## 9. Rollback khi có lỗi

1. Vào tab **Deployments**
2. Chọn bản deploy cũ đang ổn định
3. Bấm **Promote to Production**

## 10. Checklist kiểm tra sau deploy

1. Đăng nhập/đăng xuất hoạt động bình thường.
2. Gọi API không bị `CORS`/`401` bất thường.
3. Các trang quan trọng render đúng trên mobile + desktop.
4. Không lỗi `NEXT_PUBLIC_API_BASE_URL is undefined`.
5. Kiểm tra Console và Network trên trình duyệt.

## 11. Lỗi thường gặp và cách xử lý

### Lỗi 1: Build failed vì thiếu env

Triệu chứng: log báo thiếu biến môi trường.

Cách xử lý:

1. Vào **Settings** -> **Environment Variables**
2. Bổ sung biến còn thiếu
3. Redeploy

### Lỗi 2: Gọi API sai host

Triệu chứng: frontend gọi localhost hoặc domain cũ.

Cách xử lý:

1. Kiểm tra `NEXT_PUBLIC_API_BASE_URL`
2. Redeploy sau khi sửa env

### Lỗi 3: CORS error

Triệu chứng: browser báo blocked by CORS.

Cách xử lý ở backend:

1. Thêm domain frontend Vercel vào `ALLOW_ORIGINS`
2. Deploy lại backend

### Lỗi 4: 404 vì cấu trúc monorepo

Triệu chứng: Vercel build sai thư mục.

Cách xử lý:

1. Set đúng **Root Directory = fe**
2. Redeploy

## 12. Khuyến nghị cho production

1. Không commit file `.env` thật lên git.
2. Tách môi trường `Preview` và `Production` bằng env riêng.
3. Bật Vercel Analytics/Speed Insights nếu cần theo dõi hiệu năng.
4. Bật bảo vệ branch `main` trước khi auto deploy production.

## 13. Lệnh local hữu ích

```bash
# Cài dependency
pnpm install

# Chạy local
pnpm dev

# Build giống Vercel
pnpm build

# Chạy bản build local
pnpm start
```

---

Nếu bạn muốn, bước tiếp theo mình có thể tạo thêm:

1. File `.env.production.example` cho `fe`.
2. Checklist deploy backend tương ứng để FE gọi API ổn định ngay lần đầu.
