import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { GraduationCap, Trash2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getListSchool } from "@/lib/api/dashboard";
import { sortAlphabetGeneric } from "@/lib/utils";

function TeacherModal({
  open,
  teachers,
  selected,
  filter,
  onFilter,
  onSelect,
  onClose,
  courseId,
}: {
  open: boolean;
  teachers: any[];
  selected: any[];
  filter: any;
  onFilter: (f: any) => void;
  onSelect: (s: any[]) => void;
  onClose: () => void;
  courseId: string | number;
}) {
  const [filteredTeachers, setFilteredTeachers] = useState<any[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<any[]>(selected);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const perPage = 20;
  const debouncedFilter = useDebounce(filter, 400);

  const [schools, setSchools] = useState<any[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  useEffect(() => {
    const fetchSchools = async () => {
      setLoadingSchools(true);
      try {
        const res = await getListSchool();
        const schoolList =
          res?.data?.schools || res?.data || res?.schools || res || [];
        const normalizedSchools = Array.isArray(schoolList)
          ? schoolList.map((school: any) => ({
              id: String(school.id ?? school.value ?? ""),
              name:
                school.school_name ||
                school.name ||
                school.label ||
                "Không xác định",
            }))
          : [];
        setSchools(normalizedSchools);
      } catch (error) {
        console.error("Failed to fetch schools:", error);
        setSchools([]);
      } finally {
        setLoadingSchools(false);
      }
    };
    fetchSchools();
  }, []);

  useEffect(() => {
    setSelectedTeachers(selected);
  }, [open, selected]);

  const fetchTeachers = async (currentPage: number = 1) => {
    setLoading(true);
    try {
      const params: any = {
        role_id: 2,
        page: currentPage,
        per_page: perPage,
      };
      let searchTerms = [];
      if (filter.name && filter.name.trim())
        searchTerms.push(filter.name.trim());
      if (filter.school && filter.school.trim()) {
        params.school_id = filter.school.trim();
      }
      if (searchTerms.length > 0) params.keyword = searchTerms.join(" ");
      const res = await import("@/lib/api/users").then((m) =>
        m.GetUserListAdvanced(params)
      );
      const data = res?.data || res;
      const users = data?.users || [];
      setFilteredTeachers(users);
      if (users.length < perPage) setTotalPages(currentPage);
      else if (users.length === perPage)
        setTotalPages(Math.max(totalPages, currentPage + 1));
    } catch (err) {
      console.error("Error fetching teachers:", err);
      setFilteredTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setPage(1);
      fetchTeachers(1);
    }
  }, [open]);
  useEffect(() => {
    if (open) {
      setPage(1);
      fetchTeachers(1);
    }
  }, [debouncedFilter.school, debouncedFilter.name]);
  useEffect(() => {
    if (open && page > 1) fetchTeachers(page);
  }, [page]);

  const handleAddTeacher = (teacher: any) => {
    if (!selectedTeachers.find((t) => t.id === teacher.id))
      setSelectedTeachers((prev) => [...prev, teacher]);
  };
  const handleRemoveTeacher = (teacherId: string) => {
    setSelectedTeachers((prev) => prev.filter((t) => t.id !== teacherId));
  };
  const isTeacherSelected = (teacherId: string) =>
    selectedTeachers.some((t) => t.id === teacherId);

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const users = selectedTeachers.map((t) => ({
        id: Number(t.id),
        name: t.name,
        username: t.username || t.email || t.name || String(t.id),
      }));
      await import("@/lib/api/courses").then((m) =>
        m.SaveListUsersToCourse(String(courseId), users, 2)
      );
      onSelect(selectedTeachers);
      onClose();
    } catch (err) {
      alert("Lưu danh sách giáo viên thất bại!");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-7xl max-h-[95vh] sm:max-h-[85vh] flex flex-col">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-6">
          Chọn giáo viên cho khóa học
        </h3>
        <div className="flex gap-3 mb-6">
          <div className="flex-1">
            <Select
              value={filter.school || "all"}
              onValueChange={(value) =>
                onFilter({ ...filter, school: value === "all" ? "" : value })
              }
            >
              <SelectTrigger className="border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Chọn trường" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trường</SelectItem>
                {loadingSchools ? (
                  <SelectItem value="loading" disabled>
                    Đang tải...
                  </SelectItem>
                ) : (
                  sortAlphabetGeneric(schools, item => item.name, true).map((school: any) => (
                    <SelectItem key={school.id} value={school.id.toString()}>
                      {school.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <Input
            placeholder="Tìm theo tên"
            value={filter.name || ""}
            onChange={(e) =>
              onFilter({ ...filter, name: e.target.value || "" })
            }
            className="flex-1 border-gray-200 rounded-xl focus:border-green-500 focus:ring-green-500"
          />
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 overflow-hidden">
          <div className="flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h4 className="text-lg font-semibold text-gray-800">
                Đã chọn ({selectedTeachers.length})
              </h4>
              {selectedTeachers.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTeachers([])}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Xóa tất cả
                </Button>
              )}
            </div>
            <div className="flex-1 border border-gray-200 rounded-xl p-4 overflow-y-auto bg-green-50/30">
              {selectedTeachers.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Chưa chọn giáo viên nào</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Chọn từ danh sách bên phải
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedTeachers.map((teacher: any) => (
                    <div
                      key={teacher.id}
                      className="flex items-center gap-3 p-3 bg-white border border-green-200 rounded-lg shadow-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {teacher.name || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {teacher.email || "N/A"}
                        </div>
                        {teacher.user_info?.school && (
                          <div className="text-xs text-gray-400 mt-1">
                            {typeof teacher.user_info.school === "string"
                              ? teacher.user_info.school
                              : (teacher.user_info.school as any)?.name ||
                                "N/A"}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTeacher(teacher.id)}
                        className="text-red-600 hover:bg-red-50 px-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col min-h-0">
            <h4 className="text-lg font-semibold text-gray-800 mb-2 sm:mb-4">
              Danh sách giáo viên
            </h4>
            <div className="flex-1 border border-gray-200 rounded-xl p-4 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full"></div>
                  <span className="ml-2">Đang tải giáo viên...</span>
                </div>
              ) : (
                <>
                  {filteredTeachers.map((teacher: any) => {
                    const isSelected = isTeacherSelected(teacher.id);
                    return (
                      <div
                        key={teacher.id}
                        className={`flex items-center gap-3 p-3 border rounded-lg mb-3 transition-colors ${
                          isSelected
                            ? "border-green-300 bg-green-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {teacher.name || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {teacher.email || "N/A"}
                          </div>
                          {teacher.user_info?.school && (
                            <div className="text-xs text-gray-400 mt-1">
                              {typeof teacher.user_info.school === "string"
                                ? teacher.user_info.school
                                : (teacher.user_info.school as any)?.name ||
                                  "N/A"}
                            </div>
                          )}
                        </div>
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            isSelected
                              ? handleRemoveTeacher(teacher.id)
                              : handleAddTeacher(teacher)
                          }
                          className={
                            isSelected
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "border-green-200 text-green-600 hover:bg-green-50"
                          }
                        >
                          {isSelected ? "Đã chọn" : "Chọn"}
                        </Button>
                      </div>
                    );
                  })}
                  {filteredTeachers.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-lg mb-2">
                        Không tìm thấy giáo viên phù hợp
                      </div>
                      <div className="text-gray-500 text-sm">
                        Thử thay đổi bộ lọc tìm kiếm
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            {(totalPages > 1 || page > 1) && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  Trước
                </Button>
                <span className="text-sm text-gray-600">
                  Trang {page}
                  {totalPages > page ? ` / ${totalPages}+` : ""}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages || loading}
                >
                  Sau
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 sm:mt-6 pt-4 border-t border-gray-100 gap-2">
          <div className="text-sm text-gray-600">
            Đã chọn {selectedTeachers.length} giáo viên
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="border-gray-200 rounded-xl px-6 hover:bg-gray-50 w-full sm:w-auto"
            >
              Đóng
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-6 w-full sm:w-auto"
            >
              {saving ? "Đang lưu..." : "Xác nhận"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherModal;
