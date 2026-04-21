"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { LucidePlus, Eye, Info, Edit, Trash2, Check, Copy } from "lucide-react";
import { GetGroupList, DeleteGroup, CreateGroupWithCriteria } from "@/lib/api/group-criteria";
import { GetSubjectsList } from "@/lib/api/subjects";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/app/loading";
import type { AssessmentCriteriaGroup } from "@/lib/api/group-criteria";
import { useQueryString } from "@/hooks/use-query-string";
import { sortAlphabetGeneric } from "@/lib/utils";
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

export default function CriteriaAssessmentPage() {
  const { searchParamsUrl, getValueFromQueryString, setQueryParams } = useQueryString()
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;
  const { toast } = useToast();
  const [groups, setGroups] = useState<AssessmentCriteriaGroup[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [groupToCopy, setGroupToCopy] = useState<{ id: string | number; name: string } | null>(null);

  // Fetch subjects
  const fetchSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const response = await GetSubjectsList();
      // Response structure: { code, message, data: { subjects: [...] }, error }
      if (response?.data?.subjects && Array.isArray(response.data.subjects)) {
        setSubjects(response.data.subjects);
      } else {
        setSubjects([]);
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách môn học",
        variant: "destructive",
      });
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  // Fetch groups
  const fetchGroups = async (subjectId?: number) => {
    try {
      setLoading(true);
      const result = await GetGroupList(subjectId);
      setGroups(result.groups);
      setTotal(result.total);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách nhóm tiêu chí đánh giá",
        variant: "destructive",
      });
      setGroups([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    const subjectId =
      selectedSubjectId === "all" ? undefined : Number(selectedSubjectId);
    fetchGroups(subjectId);
  }, [selectedSubjectId]);

  const handleSubjectFilterChange = (value: string) => {
    setSelectedSubjectId(value);
    setQueryParams({subjectId: value})
  };

  const handleViewDetail = (id: string | number) => {
    router.push(`/${locale}/admin/criteria-assessment/${id}`);
  };

  const handleEdit = (id: string | number) => {
    router.push(`/${locale}/admin/criteria-assessment/${id}/edit`);
  };

  const handleDelete = async (id: string | number, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa nhóm "${name}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      await DeleteGroup(id);
      toast({
        title: "Thành công",
        description: `Đã xóa nhóm "${name}"`,
      });
      const subjectId =
        selectedSubjectId === "all" ? undefined : Number(selectedSubjectId);
      fetchGroups(subjectId);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa nhóm",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreate = () => {
    router.push(`/${locale}/admin/criteria-assessment/create`);
  };

  const handleCopyClick = (id: string | number, name: string) => {
    setGroupToCopy({ id, name });
    setCopyDialogOpen(true);
  };

  const handleConfirmCopy = async () => {
    if (!groupToCopy) return;
    try {
      await CreateGroupWithCriteria({
        group: {
          copy_from_assessment_criteria_group_id: Number(groupToCopy.id),
        } as any,
        criteria: [],
      } as any);
      toast({
        title: "Thành công",
        description: "Sao chép thành công",
      });
      setCopyDialogOpen(false);
      setGroupToCopy(null);
      const subjectId =
        selectedSubjectId === "all" ? undefined : Number(selectedSubjectId);
      fetchGroups(subjectId);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể sao chép",
        variant: "destructive",
      });
    }
  };

  const getSubjectName = (subjectId: string | number) => {
    const subject = subjects.find((s) => String(s.id) === String(subjectId));
    return subject?.name || `Môn học ID: ${subjectId}`;
  };

  useEffect(() => {
    if (getValueFromQueryString("subjectId")) {
      setSelectedSubjectId(getValueFromQueryString("subjectId") as string);
    }
  }, [searchParamsUrl])

  if (loading && groups.length === 0) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Quản lý tiêu chí đánh giá
            </h1>
            <p className="text-gray-600 mt-2">
              Quản lý các tiêu chí đánh giá theo môn học
            </p>
          </div>
          <Button
            className="mt-4 md:mt-0 bg-[#EB8922] hover:bg-[#d97a1a] text-white"
            onClick={handleCreate}
          >
            <LucidePlus className="mr-2 h-4 w-4" />
            Tạo mới
          </Button>
        </div>

        {/* Filter Section */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full sm:w-auto">
                <Select
                  value={selectedSubjectId}
                  onValueChange={handleSubjectFilterChange}
                  disabled={loadingSubjects}
                >
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue placeholder="Chọn môn học" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả môn học</SelectItem>
                    {sortAlphabetGeneric(subjects, item => item.name, true).map((subject) => (
                      <SelectItem key={subject.id} value={String(subject.id)}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                <Info className="h-4 w-4" />
                <span className="font-medium">Tổng số: {total}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-center">
                    Tên
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    Tải bài làm
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    Ngày tạo
                  </TableHead>
                  <TableHead className="text-center font-semibold">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && groups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loading />
                    </TableCell>
                  </TableRow>
                ) : groups.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-12 text-gray-500"
                    >
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  groups.map((group, index) => (
                    <TableRow key={group.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-center">
                        {group.name}
                      </TableCell>
                      <TableCell className="text-center">
                        {group.has_file && <Check className="mx-auto text-green-600" size={18} />}
                      </TableCell>
                      <TableCell className="text-center">
                        {group.created_at
                          ? new Date(
                              Number(group.created_at) * 1000
                            ).toLocaleString("vi-VN", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(group.id)}
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(group.id)}
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyClick(group.id, group.name)}
                            title="Sao chép"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(group.id, group.name)}
                            disabled={deletingId === group.id}
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Copy Confirmation Dialog */}
        <AlertDialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận sao chép</AlertDialogTitle>
              <AlertDialogDescription>
                {groupToCopy &&
                  `Bạn muốn sao chép ${groupToCopy.name} đúng không?`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmCopy}>
                Xác nhận
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
