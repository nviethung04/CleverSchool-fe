import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Trash2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { sortAlphabetGeneric, sortByNumberAndAlphabetFromSecondGeneric } from "@/lib/utils";

function StudentModal({
  open,
  students,
  selected,
  filter,
  onFilter,
  onSelect,
  onClose,
  courseId,
}: {
  open: boolean;
  students: any[];
  selected: any[];
  filter: any;
  onFilter: (f: any) => void;
  onSelect: (s: any[]) => void;
  onClose: () => void;
  courseId: string | number;
}) {
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<any[]>(selected);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [schools, setSchools] = useState<any[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [perPage, setPerPage] = useState(50);

  const debouncedFilter = useDebounce(filter, 400);

  useEffect(() => {
    setSelectedStudents(selected);
  }, [open, selected]);

  // Fetch schools list
  const fetchSchools = async () => {
    setLoadingSchools(true);
    try {
      const response = await import("@/lib/api/schools").then((m) =>
        m.GetSchoolList({
          limit: 100, // Get all schools
          status: "1", // Only active schools
        })
      );
      const data = response?.data || response;
      setSchools(data?.schools || []);
    } catch (err) {
      console.error("Error fetching schools:", err);
      setSchools([]);
    } finally {
      setLoadingSchools(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSchools();
    }
  }, [open]);

  // Fetch classes list based on selected school
  const fetchClasses = async (schoolId?: string) => {
    setLoadingClasses(true);
    try {
      if (schoolId && schoolId !== "all") {
        const response = await import("@/lib/api/classes").then((m) =>
          m.GetClassList(schoolId, {
            per_page: 1000, // Get all classes for the school
          })
        );
        const data = response?.data || response;
        setClasses(data?.classes || []);
      } else {
        // If no school selected, clear classes
        setClasses([]);
      }
    } catch (err) {
      console.error("Error fetching classes:", err);
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  // Fetch classes when school selection changes
  useEffect(() => {
    if (open) {
      fetchClasses(filter.school);
      // Reset class filter when school changes
      if (filter.class) {
        onFilter({ ...filter, class: "" });
      }
    }
  }, [filter.school, open]);

  const fetchStudents = async (currentPage: number = 1) => {
    setLoading(true);
    try {
      const params: any = {
        role_id: 3,
        page: currentPage,
        per_page: perPage,
      };
      let searchTerms = [];
      if (filter.name && filter.name.trim())
        searchTerms.push(filter.name.trim());
      if (searchTerms.length > 0) params.keyword = searchTerms.join(" ");

      // Add school filter if selected
      if (filter.school && filter.school !== "all") {
        params.school_id = filter.school;
      }

      // Add class filter if selected
      if (filter.class && filter.class !== "all") {
        params.class_id = filter.class;
      }
      const res = await import("@/lib/api/users").then((m) =>
        m.GetUserListAdvanced(params)
      );
      const data = res?.data || res;
      const users = data?.users || [];
      setFilteredStudents(users);
      if (users.length < perPage) setTotalPages(currentPage);
      else if (users.length === perPage)
        setTotalPages(Math.max(totalPages, currentPage + 1));
    } catch (err) {
      console.error("Error fetching students:", err);
      setFilteredStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setPage(1);
      fetchStudents(1);
    }
  }, [open]);
  useEffect(() => {
    if (open) {
      setPage(1);
      fetchStudents(1);
    }
  }, [debouncedFilter.school, debouncedFilter.class, debouncedFilter.name]);
  useEffect(() => {
    if (open && page > 1) fetchStudents(page);
  }, [page]);

  // Reload when perPage changes
  useEffect(() => {
    if (open) {
      fetchStudents(1);
    }
  }, [perPage]);

  const handleAddStudent = (student: any) => {
    if (!selectedStudents.find((s) => s.id === student.id))
      setSelectedStudents((prev) => [...prev, student]);
  };
  const handleRemoveStudent = (studentId: string) => {
    setSelectedStudents((prev) => prev.filter((s) => s.id !== studentId));
  };
  const isStudentSelected = (studentId: string) =>
    selectedStudents.some((s) => s.id === studentId);

  // Function to select all students in current page
  const handleSelectAllCurrentPage = () => {
    const newStudents = filteredStudents.filter(
      (student) => !selectedStudents.find((s) => s.id === student.id)
    );
    setSelectedStudents((prev) => [...prev, ...newStudents]);
  };

  // Function to deselect all students in current page
  const handleDeselectAllCurrentPage = () => {
    const currentPageIds = filteredStudents.map((s) => s.id);
    setSelectedStudents((prev) =>
      prev.filter((s) => !currentPageIds.includes(s.id))
    );
  };

  // Check if all students in current page are selected
  const areAllCurrentPageSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((student) =>
      selectedStudents.some((s) => s.id === student.id)
    );

  // Handle perPage change
  const handlePerPageChange = (newPerPage: string) => {
    setPerPage(Number(newPerPage));
    setPage(1); // Reset to first page
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const users = selectedStudents.map((s) => ({
        id: Number(s.id),
        name: s.name,
        username: s.username || s.email || s.name || String(s.id),
      }));
      await import("@/lib/api/courses").then((m) =>
        m.SaveListUsersToCourse(String(courseId), users, 3)
      );
      onSelect(selectedStudents);
      onClose();
    } catch (err) {
      alert("Lưu danh sách học sinh thất bại!");
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
          Chọn học sinh cho khóa học
        </h3>
        <div className="flex gap-3 mb-3 sm:mb-6">
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
          <div className="flex-1">
            <Select
              value={filter.class || "all"}
              onValueChange={(value) =>
                onFilter({ ...filter, class: value === "all" ? "" : value })
              }
              disabled={!filter.school || filter.school === "all"}
            >
              <SelectTrigger className="border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500">
                <SelectValue
                  placeholder={
                    !filter.school || filter.school === "all"
                      ? "Chọn trường trước"
                      : "Chọn lớp"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả lớp</SelectItem>
                {loadingClasses ? (
                  <SelectItem value="loading" disabled>
                    Đang tải...
                  </SelectItem>
                ) : (
                  sortByNumberAndAlphabetFromSecondGeneric(classes, item => item.name, true).map((clazz: any) => (
                    <SelectItem key={clazz.id} value={clazz.id.toString()}>
                      {clazz.name}
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
            className="flex-1 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 overflow-hidden">
          <div className="flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h4 className="text-md sm:text-lg font-semibold text-gray-800">
                Đã chọn ({selectedStudents.length})
              </h4>
              {selectedStudents.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedStudents([])}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Xóa tất cả
                </Button>
              )}
            </div>
            <div className="flex-1 border border-gray-200 rounded-xl p-4 overflow-y-auto bg-blue-50/30">
              {selectedStudents.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Chưa chọn học sinh nào</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Chọn từ danh sách bên phải
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedStudents.map((student: any) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 p-3 bg-white border border-blue-200 rounded-lg shadow-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {student.name || "N/A"}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {(() => {
                            // Handle case where student is from form.students (already converted to strings)
                            if (
                              student.school &&
                              typeof student.school === "string" &&
                              student.class &&
                              typeof student.class === "string"
                            ) {
                              return `${student.school} - ${student.class}`;
                            }
                            // Handle case where student is from API (has user_info)
                            const school =
                              typeof student.user_info?.school === "string"
                                ? student.user_info.school
                                : (student.user_info?.school as any)?.name ||
                                  schools.find(
                                    (s) =>
                                      s.id.toString() ===
                                      student.user_info?.school_id?.toString()
                                  )?.name ||
                                  "N/A";
                            const clazz =
                              typeof student.user_info?.class === "string"
                                ? student.user_info.class
                                : (student.user_info?.class as any)?.name ||
                                  classes.find(
                                    (c) =>
                                      c.id.toString() ===
                                      student.user_info?.class_id?.toString()
                                  )?.name ||
                                  "N/A";
                            return `${school} - ${clazz}`;
                          })()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveStudent(student.id)}
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
            <div className="flex flex-wrap gap-2 items-center justify-between mb-2 sm:mb-4">
              <div className="flex items-center gap-3">
                <h4 className="text-md sm:text-lg font-semibold text-gray-800">
                  Danh sách học sinh
                </h4>
                <div className="flex items-center gap-2">
                  <Select
                    value={perPage.toString()}
                    onValueChange={handlePerPageChange}
                  >
                    <SelectTrigger className="w-20 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-600">/ trang</span>
                </div>
              </div>
              {filteredStudents.length > 0 && !loading && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={
                    areAllCurrentPageSelected
                      ? handleDeselectAllCurrentPage
                      : handleSelectAllCurrentPage
                  }
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  {areAllCurrentPageSelected
                    ? "Bỏ chọn trang"
                    : "Chọn tất cả trang"}
                </Button>
              )}
            </div>
            <div className="flex-1 border border-gray-200 rounded-xl p-4 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="ml-2">Đang tải học sinh...</span>
                </div>
              ) : (
                <>
                  {filteredStudents.map((student: any) => {
                    const isSelected = isStudentSelected(student.id);
                    return (
                      <div
                        key={student.id}
                        className={`flex items-center gap-3 p-3 border rounded-lg mb-3 transition-colors ${
                          isSelected
                            ? "border-blue-300 bg-blue-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {student.name || "N/A"}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {(() => {
                              // Handle case where student is from form.students (already converted to strings)
                              if (
                                student.school &&
                                typeof student.school === "string" &&
                                student.class &&
                                typeof student.class === "string"
                              ) {
                                return `${student.school} - ${student.class}`;
                              }
                              // Handle case where student is from API (has user_info)
                              const school =
                                typeof student.user_info?.school === "string"
                                  ? student.user_info.school
                                  : (student.user_info?.school as any)?.name ||
                                    schools.find(
                                      (s) =>
                                        s.id.toString() ===
                                        student.user_info?.school_id?.toString()
                                    )?.name ||
                                    "N/A";
                              const clazz =
                                typeof student.user_info?.class === "string"
                                  ? student.user_info.class
                                  : (student.user_info?.class as any)?.name ||
                                    classes.find(
                                      (c) =>
                                        c.id.toString() ===
                                        student.user_info?.class_id?.toString()
                                    )?.name ||
                                    "N/A";
                              return `${school} - ${clazz}`;
                            })()}
                          </div>
                        </div>
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            isSelected
                              ? handleRemoveStudent(student.id)
                              : handleAddStudent(student)
                          }
                          className={
                            isSelected
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "border-blue-200 text-blue-600 hover:bg-blue-50"
                          }
                        >
                          {isSelected ? "Đã chọn" : "Chọn"}
                        </Button>
                      </div>
                    );
                  })}
                  {filteredStudents.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-lg mb-2">
                        Không tìm thấy học sinh phù hợp
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
            Đã chọn {selectedStudents.length} học sinh
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
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 w-full sm:w-auto"
            >
              {saving ? "Đang lưu..." : "Xác nhận"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentModal;
