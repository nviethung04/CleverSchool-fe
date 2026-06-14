# Thiết kế giao diện — CleverSchool Frontend

Tài liệu đồng bộ UI admin/teacher với brand Clever School. Tham chiếu: `be/AGENTS.md` (quy trình, MVP), `fe/config/hiddenModules.ts` (menu ẩn).

Cập nhật: **2026-06-14**

---

## 1. Mục tiêu

- Nút **Tạo mới** và CTA chính **luôn nhìn thấy** trong layout admin (sidebar hẹp).
- **Một màu chính** cho hành động tích cực (tạo, lưu, xác nhận).
- Class CSS **không chứa khoảng trắng** (tránh lỗi `bg-Clever School-green` → Tailwind tách thành 2 class vô nghĩa).

---

## 2. Bảng màu brand (`cs-*`)

| Token Tailwind | Hex | Dùng cho |
|----------------|-----|----------|
| `cs-green` | `#7ed957` | Nút primary: Tạo mới, Lưu, Xác nhận |
| `cs-blue` | `#4a90e2` | Link, tab active, accent |
| `cs-light-blue` | `#8fd3f4` | Nền nhẹ, highlight |
| `cs-yellow` | `#ffd900` | Cảnh báo nhẹ, huy chương |
| `cs-orange` | `#ff9f00` | CTA phụ (ít dùng trong admin) |

Ví dụ class: `bg-cs-green`, `text-cs-blue`, `hover:bg-cs-green/90`.

Định nghĩa: `fe/tailwind.config.ts` → `theme.extend.colors.cs` và `fe/app/globals.css`.

---

## 3. Hệ thống nút (Button)

| Loại | Variant / class | Khi nào dùng |
|------|-----------------|--------------|
| **Primary** | `adminPrimaryButtonClass` hoặc `bg-cs-green text-white hover:bg-cs-green/90` | Tạo môn học, Tạo học kỳ, Lưu form |
| **Secondary** | `variant="outline"` | Hủy, Quay lại |
| **Destructive** | `variant="destructive"` hoặc `text-red-500` (icon) | Xóa |
| **Ghost icon** | `variant="ghost" size="icon"` | Sửa, Xóa trong bảng |
| **Default shadcn** | `variant="default"` (xanh `--primary`) | Tránh dùng cho CTA admin — dễ lệch brand |

**Không dùng** mỗi trang một màu tạo mới (xanh dương `#2563eb`, cam `#EB8922`, …) trong admin list — thống nhất `cs-green`.

---

## 4. Layout trang danh sách admin

```
┌─────────────────────────────────────────────────┐
│ Tiêu đề trang + mô tả (AdminPageHeading)        │
├─────────────────────────────────────────────────┤
│ ┌─ Card ─────────────────────────────────────┐  │
│ │ AdminListToolbar: Tổng số … │ [+ Tạo mới]  │  │
│ │ ─────────────────────────────────────────  │  │
│ │ Bảng dữ liệu                               │  │
│ └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

Component dùng chung: `fe/components/admin/admin-list-header.tsx`

- `AdminPageHeading` — tiêu đề
- `AdminListToolbar` — hàng tổng số + action
- `AdminCreateButton` — nút tạo chuẩn

**Tránh** đặt nút Tạo mới **chỉ** ở góc phải header `flex justify-between` ngoài card — dễ bị khuất khi `container` + sidebar.

---

## 5. Typography & spacing

| Thành phần | Class gợi ý |
|------------|-------------|
| Tiêu đề trang | `text-2xl sm:text-3xl font-bold text-gray-900` |
| Mô tả | `text-gray-600 mt-2` |
| Padding trang | `container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8` |
| Bo góc nút primary | `rounded-md` (mặc định Button) hoặc `rounded-full` cho toolbar schools |

---

## 6. Menu admin & module ẩn

Menu sidebar: `fe/components/admin/admin-sidebar.tsx`, lọc bởi `filterSidebarItems` + `fe/config/hiddenModules.ts`.

Các module **ẩn khỏi menu** (vẫn vào được bằng URL): departments, contest, scorm, criteria-report, …

MVP core hiển thị: Tổng quan, Người dùng, Trường, **Môn học**, Chương trình, Khóa học, Học liệu, Học kỳ.

---

## 7. Checklist khi thêm trang admin mới

1. Import `AdminPageHeading`, `AdminListToolbar`, `AdminCreateButton` từ `@/components/admin/admin-list-header`.
2. Nút Tạo mới nằm trong `CardHeader` cùng dòng tổng số bản ghi.
3. Primary CTA dùng `bg-cs-green`, không class có khoảng trắng.
4. Form submit: cùng `adminPrimaryButtonClass`.
5. Cập nhật tài liệu này nếu thêm token màu hoặc pattern layout mới.

---

## 8. Lỗi đã xử lý (2026-06-14)

- Class `bg-Clever School-green` **không hoạt động** — thay bằng `bg-cs-green`.
- Nút Tạo môn học / học kỳ bị khuất — chuyển vào `AdminListToolbar` trong card.
- Màu nút tạo lệch giữa các trang — chuẩn hóa `cs-green`.

---

## 9. Liên quan

- Backend API admin: `/api/manage` — `be/AGENTS.md` §13–14
- Phân quyền nút (tương lai): có thể bọc `AdminCreateButton` với check `subjects.store`, …
- i18n: key `createNew` trong `fe/messages/vi.json` theo từng module (`manageSubject`, `manageSemester`, …)

## 10. Component dùng chung

| File | Export |
|------|--------|
| `fe/components/admin/admin-list-header.tsx` | `AdminPageHeading`, `AdminListToolbar`, `AdminCreateButton`, `adminPrimaryButtonClass` |
