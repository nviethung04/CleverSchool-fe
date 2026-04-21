"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getNoticeById, createNotice, updateNotice } from "@/lib/api/notices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";

type NoticeType = "system" | "school" | "course" | "class";

export default function NoticeFormPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();

    const noticeId = params?.id as string | undefined;
    const isEditMode = !!noticeId;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [content, setContent] = useState("");
    const [type, setType] = useState<NoticeType>("system");
    const [status, setStatus] = useState(true);

    // Error state
    const [titleError, setTitleError] = useState(false);
    const [descriptionError, setDescriptionError] = useState(false);
    const [contentError, setContentError] = useState(false);

    useEffect(() => {
        if (isEditMode) {
            fetchNotice();
        }
    }, [noticeId]);

    const fetchNotice = async () => {
        try {
            setLoading(true);
            const response = await getNoticeById(noticeId!);

            if (response.code === 200) {
                const notice = response.data?.notice || response.data;
                setTitle(notice.title || "");
                setDescription(notice.description || "");
                setContent(notice.content || "");
                setType(notice.type || "system");
                setStatus(notice.status !== false);
            }
        } catch (error) {
            console.error("Error fetching notice:", error);
            toast({
                title: "Lỗi",
                description: "Không thể tải thông tin thông báo",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        // Reset errors
        setTitleError(false);
        setDescriptionError(false);
        setContentError(false);

        let isValid = true;
        const errors: string[] = [];

        if (!title.trim()) {
            setTitleError(true);
            errors.push("tiêu đề");
            isValid = false;
        }
        if (!description.trim()) {
            setDescriptionError(true);
            errors.push("mô tả");
            isValid = false;
        }
        if (!content.trim()) {
            setContentError(true);
            errors.push("nội dung");
            isValid = false;
        }

        if (!isValid) {
            toast({
                title: "Lỗi",
                description: `Vui lòng nhập: ${errors.join(", ")}`,
                variant: "destructive",
            });
        }

        return isValid;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setSaving(true);
            const data = {
                title: title.trim(),
                description: description.trim(),
                content: content.trim(),
                type,
                status,
            };

            let response;
            if (isEditMode) {
                response = await updateNotice(noticeId!, data);
            } else {
                response = await createNotice(data);
            }

            if (response.code === 200) {
                toast({
                    title: "Thành công",
                    description: isEditMode
                        ? "Đã cập nhật thông báo thành công"
                        : "Đã tạo thông báo mới thành công",
                });
                router.push("/vi/admin/notices");
            } else {
                toast({
                    title: "Lỗi",
                    description: response.message || "Có lỗi xảy ra. Vui lòng thử lại.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error saving notice:", error);
            toast({
                title: "Lỗi",
                description: "Không thể lưu thông báo. Vui lòng thử lại.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
            setShowConfirm(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Đang tải...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-6 flex-wrap-reverse gap-3">
                <h1 className="text-3xl font-bold">
                    {isEditMode ? "Sửa thông báo" : "Tạo thông báo mới"}
                </h1>
                <Button variant="outline" onClick={() => router.push("/vi/admin/notices")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Quay lại
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6 max-w-4xl">
                <div className="space-y-6">
                    {/* Title */}
                    <div>
                        <Label htmlFor="title" className="text-sm font-semibold">
                            Tiêu đề <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                if (titleError && e.target.value.trim()) {
                                    setTitleError(false);
                                }
                            }}
                            placeholder="Nhập tiêu đề thông báo"
                            className={`mt-2 ${titleError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                        />
                        {titleError && (
                            <p className="text-red-500 text-sm mt-1">Vui lòng nhập tiêu đề</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <Label htmlFor="description" className="text-sm font-semibold">
                            Mô tả <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => {
                                setDescription(e.target.value);
                                if (descriptionError && e.target.value.trim()) {
                                    setDescriptionError(false);
                                }
                            }}
                            placeholder="Nhập mô tả ngắn gọn"
                            className={`mt-2 ${descriptionError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                            rows={3}
                        />
                        {descriptionError && (
                            <p className="text-red-500 text-sm mt-1">Vui lòng nhập mô tả</p>
                        )}
                    </div>

                    {/* Content */}
                    <div>
                        <Label htmlFor="content" className="text-sm font-semibold">
                            Nội dung <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="content"
                            value={content}
                            onChange={(e) => {
                                setContent(e.target.value);
                                if (contentError && e.target.value.trim()) {
                                    setContentError(false);
                                }
                            }}
                            placeholder="Nhập nội dung chi tiết"
                            className={`mt-2 ${contentError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                            rows={8}
                        />
                        {contentError && (
                            <p className="text-red-500 text-sm mt-1">Vui lòng nhập nội dung</p>
                        )}
                    </div>

                    {/* Type */}
                    <div>
                        <Label htmlFor="type" className="text-sm font-semibold">
                            Loại thông báo
                        </Label>
                        <Select value={type} onValueChange={(value) => setType(value as NoticeType)}>
                            <SelectTrigger className="mt-2">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="system">Hệ thống</SelectItem>
                                <SelectItem value="school">Trường học</SelectItem>
                                <SelectItem value="course">Khóa học</SelectItem>
                                <SelectItem value="class">Lớp học</SelectItem>
                                <SelectItem value="user">Cá nhân</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status */}
                    <div>
                        <Label htmlFor="status" className="text-sm font-semibold">
                            Trạng thái
                        </Label>
                        <Select
                            value={status ? "true" : "false"}
                            onValueChange={(value) => setStatus(value === "true")}
                        >
                            <SelectTrigger className="mt-2">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="true">Hiển thị</SelectItem>
                                <SelectItem value="false">Ẩn</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => router.push("/vi/admin/notices")}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={() => setShowConfirm(true)}
                            disabled={saving}
                            className="flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? "Đang lưu..." : isEditMode ? "Cập nhật" : "Tạo mới"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {isEditMode ? "Xác nhận cập nhật" : "Xác nhận tạo mới"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {isEditMode
                                ? "Bạn có chắc chắn muốn cập nhật thông báo này không?"
                                : "Bạn có chắc chắn muốn tạo thông báo mới này không?"}
                            <br /><br />
                            <strong>Tiêu đề:</strong> {title}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSubmit}>
                            Đồng ý
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
