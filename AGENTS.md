# AGENTS.md — Frontend CleverSchool

Chỉ dẫn cho agent khi sửa code trong thư mục `fe/`. Đọc kèm `be/AGENTS.md` và `be/docs/features.md`.

---

## 1. Quy tắc bắt buộc

1. **Mọi thay đổi code phải cập nhật tài liệu** trong cùng PR/commit (xem checklist bên dưới). Rule Cursor: `.cursor/rules/document-changes.mdc` (**alwaysApply**).
2. **Đầu mỗi task:** quét `.cursor/rules/*.mdc` → `fe/AGENTS.md` / `be/AGENTS.md` → docs liên quan (`features.md`, `user-guide.md`, `ui-design.md`, …) trước khi code hoặc trả lời kỹ thuật.
   - UX / form / component: `fe/docs/ui-design.md`
   - API client hoặc route mới: `be/docs/features.md` (mục FE tương ứng)
   - Menu ẩn/hiện: `fe/config/hiddenModules.ts` + ghi chú trong `features.md` §6
2. Trước khi sửa, chỉ ra file và dòng lỗi (nếu có).
3. Ưu tiên pattern có sẵn trong trang cùng module (ví dụ program create → program edit).
4. Không commit `.env`, token, secret.
5. Input controlled: `value` luôn là string/number xác định — dùng `?? ""` khi load API có thể trả `null`/`undefined`.

---

## 2. Stack & cấu trúc

- Next.js App Router, `app/[locale]/...`
- UI: shadcn (`components/ui`), Tailwind, token `cs-*` (xem `fe/docs/ui-design.md`)
- API: `fe/lib/api/*`, proxy `fe/proxy.ts`
- i18n: `fe/messages/*.json`

---

## 3. Admin layout

- Danh sách: `AdminPageHeading`, `AdminListToolbar`, `AdminCreateButton`
- Nút primary: `bg-cs-green` / `adminPrimaryButtonClass`
- Menu: `fe/components/admin/admin-sidebar.tsx` + `hiddenModules.ts`

---

## 4. Form ảnh bìa (program / course admin)

- **Chỉ upload file** (`type="file"`), không toggle Upload/Link, không `<Input value={url}>`.
- Upload qua helper `uploadFile` / `UploadFile` với path `programs/covers` (program) hoặc path course tương ứng.
- State: `selectedImageFile` + `form.cover` (URL server hoặc `blob:` preview).
- Khi load detail: `cover: image ?? ""`.
- Khi lưu: upload nếu có `selectedImageFile`; không đổi ảnh thì giữ URL hiện có.

Trang chuẩn: `manage/programs/create`, `manage/programs/[id]/edit`.

---

## 5. FK và giá trị “trống”

Không gửi `0` cho FK nullable (grade, subject, program, week, …). Gửi `null` hoặc bỏ field — xem `be/docs/features.md` §4.

Ví dụ lớp học: `normalizeGradeIdValue` trước khi POST.

---

## 7. Form bài học

- Component: `fe/components/lesson-form.tsx`.
- Sau khi chọn exam/homework/exercise/từ vựng phải bấm **Lưu** form chính.
- `UpdateLesson` không truyền `course_id` — xem `fe/docs/ui-design.md` §13, `be/docs/features.md` §3.4.
- Từ vựng: `syncLessonVocabularies` trong `fe/lib/api/lessons.ts`.

---

## 8. Tài liệu tham chiếu

| File | Nội dung |
|------|----------|
| `fe/docs/ui-design.md` | Màu, nút, layout admin, form ảnh |
| `be/docs/features.md` | API, migration, module MVP |
| `be/docs/vps-release-checklist.md` | **Đồng bộ local ↔ VPS ↔ Vercel** sau release |
| `fe/docs/user-guide.md` | Luồng sử dụng Admin / GV / HS |
| `be/AGENTS.md` | Backend, migration, permission |
| `fe/config/hiddenModules.ts` | Module ẩn menu |
| `.cursor/rules/document-changes.mdc` | **Quy trình bắt buộc:** quét rules/docs đầu task + ghi docs khi đổi code |

---

## 9. Checklist trước khi kết thúc

- [ ] Đã cập nhật docs tương ứng (không bỏ qua bước này).
- [ ] Input controlled không nhận `undefined`.
- [ ] Không thêm pattern UI mới nếu trang anh em đã có pattern.
- [ ] `read_lints` cho file đã sửa.
- [ ] Nếu có migration: tăng `be/deploy/EXPECTED_MIGRATION_VERSION` + `be/docs/vps-release-checklist.md`.
