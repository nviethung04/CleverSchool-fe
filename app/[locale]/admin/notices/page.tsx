"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getNotices, deleteNotice, Notice } from "@/lib/api/notices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Edit, Trash2, Plus, Send, Search, Filter } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import Image from "next/image";
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

export default function NoticesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

    // Search and pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [typeFilter, setTypeFilter] = useState<string>("all");

    const debouncedSearch = useDebounce(searchTerm, 500);

    useEffect(() => {
        fetchNotices();
    }, [currentPage, debouncedSearch, itemsPerPage, typeFilter]);

    const fetchNotices = async () => {
        try {
            setLoading(true);
            const response = await getNotices({
                page: currentPage,
                page_size: itemsPerPage,
                search: debouncedSearch || undefined,
                type: typeFilter !== "all" ? typeFilter : undefined,
            });
            if (response.code === 200 && response.data.notices) {
                setNotices(response.data.notices);
                setTotalCount(parseInt(response.data.total_count || "0"));
                setSelectedIds([]); // Clear selections when data changes
            }
        } catch (error) {
            console.error("Error fetching notices:", error);
            toast({
                title: "Lỗi",
                description: "Không thể tải danh sách thông báo",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            const response = await deleteNotice(deleteId);
            if (response.code === 200) {
                toast({
                    title: "Thành công",
                    description: "Đã xóa thông báo thành công",
                });
                fetchNotices();
            } else {
                toast({
                    title: "Lỗi",
                    description: response.message || "Không thể xóa thông báo",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error deleting notice:", error);
            toast({
                title: "Lỗi",
                description: "Không thể xóa thông báo. Vui lòng thử lại.",
                variant: "destructive",
            });
        } finally {
            setDeleteId(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getTypeBadgeColor = (type: string) => {
        const colorMap: Record<string, { bg: string; text: string }> = {
            system: { bg: "bg-purple-100", text: "text-purple-800" },
            school: { bg: "bg-blue-100", text: "text-blue-800" },
            course: { bg: "bg-green-100", text: "text-green-800" },
            class: { bg: "bg-orange-100", text: "text-orange-800" },
            user: { bg: "bg-pink-100", text: "text-pink-800" },
        };
        return colorMap[type] || { bg: "bg-gray-100", text: "text-gray-800" };
    };

    const getTypeLabel = (type: string) => {
        const typeMap: Record<string, string> = {
            system: "Hệ thống",
            school: "Trường học",
            course: "Khóa học",
            class: "Lớp học",
            user: "Cá nhân",
        };
        return typeMap[type] || type;
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(notices.map(n => n.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(i => i !== id));
        }
    };

    const handleBulkDelete = async () => {
        try {
            const deletePromises = selectedIds.map(id => deleteNotice(id));
            await Promise.all(deletePromises);

            toast({
                title: "Thành công",
                description: `Đã xóa ${selectedIds.length} thông báo`,
            });

            setSelectedIds([]);
            fetchNotices();
        } catch (error) {
            console.error("Error deleting notices:", error);
            toast({
                title: "Lỗi",
                description: "Không thể xóa các thông báo. Vui lòng thử lại.",
                variant: "destructive",
            });
        } finally {
            setShowBulkDeleteDialog(false);
        }
    };

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    if (loading && currentPage === 1) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Đang tải...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                <h1 className="text-3xl font-bold">Trang thông báo</h1>
                <div className="flex items-center gap-2">
                    {selectedIds.length > 0 && (
                        <Button
                            variant="destructive"
                            onClick={() => setShowBulkDeleteDialog(true)}
                            className="flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Xóa {selectedIds.length} thông báo
                        </Button>
                    )}
                    <Button
                        onClick={() => router.push("./notices/create")}
                        className="flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm mới
                    </Button>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                        type="text"
                        placeholder="Tìm kiếm thông báo (tiêu đề, mô tả, nội dung)..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="pl-10"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <Select
                        value={typeFilter}
                        onValueChange={(value) => {
                            setTypeFilter(value);
                            setCurrentPage(1);
                        }}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Lọc theo loại" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả loại</SelectItem>
                            <SelectItem value="system">Hệ thống</SelectItem>
                            <SelectItem value="school">Trường học</SelectItem>
                            <SelectItem value="course">Khóa học</SelectItem>
                            <SelectItem value="class">Lớp học</SelectItem>
                            <SelectItem value="user">Cá nhân</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={selectedIds.length === notices.length && notices.length > 0}
                                    onCheckedChange={handleSelectAll}
                                />
                            </TableHead>
                            <TableHead className="w-[60px] font-semibold">STT</TableHead>
                            <TableHead className="font-semibold">Tiêu đề</TableHead>
                            <TableHead className="w-[120px] font-semibold">Ảnh bìa</TableHead>
                            <TableHead className="w-[150px] font-semibold">Loại</TableHead>
                            <TableHead className="w-[180px] font-semibold">Ngày tạo</TableHead>
                            <TableHead className="w-[100px] text-center font-semibold">Gửi</TableHead>
                            <TableHead className="w-[100px] text-center font-semibold">Sửa</TableHead>
                            <TableHead className="w-[100px] text-center font-semibold">Xóa</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {notices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                    Chưa có thông báo nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            notices.map((notice, index) => {
                                const badgeColor = getTypeBadgeColor(notice.type);
                                return (
                                    <TableRow key={notice.id} className="hover:bg-gray-50">
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedIds.includes(notice.id)}
                                                onCheckedChange={(checked) => handleSelectOne(notice.id, checked as boolean)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{index + 1}</TableCell>
                                        <TableCell>
                                            <div className="max-w-md">
                                                <div className="font-semibold text-gray-900">{notice.title}</div>
                                                {notice.description && (
                                                    <div className="text-sm text-gray-500 truncate mt-1">
                                                        {notice.description}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {notice.cover ? (
                                                <div className="relative w-20 h-12 rounded overflow-hidden border border-gray-200">
                                                    <Image
                                                        src={notice.cover}
                                                        alt={notice.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-20 h-12" />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor.bg} ${badgeColor.text}`}>
                                                {getTypeLabel(notice.type)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-gray-600">{formatDate(notice.created_at)}</TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.push(`./notices/send/${notice.id}`)}
                                                className="hover:bg-green-50"
                                            >
                                                <Send className="w-4 h-4 text-green-600" />
                                            </Button>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.push(`./notices/edit/${notice.id}`)}
                                                className="hover:bg-blue-50"
                                            >
                                                <Edit className="w-4 h-4 text-blue-600" />
                                            </Button>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDeleteId(notice.id)}
                                                className="hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                {/* Left side - Display info and items per page selector */}
                <div className="flex flex-col sm:flex-row items-center gap-4 order-2 sm:order-1">
                    <div className="text-sm text-gray-500">
                        {loading ? (
                            <span>Đang tải...</span>
                        ) : (
                            <span>
                                Hiển thị {totalCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, totalCount)} trong tổng số {totalCount} thông báo
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span>Hiển thị:</span>
                        <Select
                            value={itemsPerPage.toString()}
                            onValueChange={(value) => {
                                const newItemsPerPage = Number(value);
                                setItemsPerPage(newItemsPerPage);
                                setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger className="w-16 h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                        <span>/ trang</span>
                    </div>
                </div>

                {/* Right side - Page navigation buttons */}
                <div className="flex items-center gap-2 order-1 sm:order-2">
                    {/* Previous Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1 || loading}
                        onClick={() => handlePageChange(currentPage - 1)}
                    >
                        <span className="hidden sm:inline">Trang trước</span>
                        <span className="sm:hidden">‹</span>
                    </Button>

                    {/* Desktop: Page number buttons with ellipsis logic */}
                    <div className="hidden sm:flex items-center gap-2">
                        {(() => {
                            const maxPagesToShow = 7;
                            const halfRange = Math.floor(maxPagesToShow / 2);

                            if (totalPages <= 1) {
                                return (
                                    <Button variant="outline" size="sm" className="bg-blue-500/10" disabled={true}>
                                        1
                                    </Button>
                                );
                            }

                            if (totalPages <= maxPagesToShow) {
                                return [...Array(totalPages)].map((_, index) => (
                                    <Button
                                        key={index}
                                        variant="outline"
                                        size="sm"
                                        className={currentPage === index + 1 ? "bg-blue-500/10" : ""}
                                        onClick={() => handlePageChange(index + 1)}
                                        disabled={loading}
                                    >
                                        {index + 1}
                                    </Button>
                                ));
                            } else {
                                const pages = [];
                                let startPage = Math.max(1, currentPage - halfRange);
                                let endPage = Math.min(totalPages, currentPage + halfRange);

                                if (endPage - startPage + 1 < maxPagesToShow) {
                                    if (startPage === 1) {
                                        endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
                                    } else {
                                        startPage = Math.max(1, endPage - maxPagesToShow + 1);
                                    }
                                }

                                // First page
                                if (startPage > 1) {
                                    pages.push(
                                        <Button key={1} variant="outline" size="sm" onClick={() => handlePageChange(1)} disabled={loading}>
                                            1
                                        </Button>
                                    );
                                    if (startPage > 2) {
                                        pages.push(<span key="ellipsis1" className="px-2">...</span>);
                                    }
                                }

                                // Middle pages
                                for (let i = startPage; i <= endPage; i++) {
                                    pages.push(
                                        <Button
                                            key={i}
                                            variant="outline"
                                            size="sm"
                                            className={currentPage === i ? "bg-blue-500/10" : ""}
                                            onClick={() => handlePageChange(i)}
                                            disabled={loading}
                                        >
                                            {i}
                                        </Button>
                                    );
                                }

                                // Last page
                                if (endPage < totalPages) {
                                    if (endPage < totalPages - 1) {
                                        pages.push(<span key="ellipsis2" className="px-2">...</span>);
                                    }
                                    pages.push(
                                        <Button key={totalPages} variant="outline" size="sm" onClick={() => handlePageChange(totalPages)} disabled={loading}>
                                            {totalPages}
                                        </Button>
                                    );
                                }

                                return pages;
                            }
                        })()}
                    </div>

                    {/* Mobile: Simple page counter */}
                    <div className="sm:hidden flex items-center gap-2">
                        <span className="text-sm font-medium px-2">
                            {currentPage} / {totalPages}
                        </span>
                    </div>

                    {/* Next Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages || loading}
                        onClick={() => handlePageChange(currentPage + 1)}
                    >
                        <span className="hidden sm:inline">Trang sau</span>
                        <span className="sm:hidden">›</span>
                    </Button>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa thông báo</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa thông báo này không? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Delete Confirmation Dialog */}
            <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa nhiều thông báo</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa <span className="font-semibold text-red-600">{selectedIds.length} thông báo</span> đã chọn không?
                            Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
                            Xóa {selectedIds.length} thông báo
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}
