"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Search,
  Filter,
  Users,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GetUserListAdvanced, AddStudentsToClass } from "@/lib/api/users";
import { getListSchool } from "@/lib/api/dashboard";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";
import { sortAlphabetGeneric } from "@/lib/utils";

interface Student {
  id: string;
  name: string;
  username: string;
  email: string;
  phone_number?: string;
  status: boolean;
  avatar?: string;
  user_info?: {
    school?: {
      id: number;
      name: string;
    };
    class?: {
      id: number;
      name: string;
    };
  };
}

interface School {
  id: number;
  name: string;
}

interface ApiSchool {
  id: string;
  school_name: string;
  school_short_name: string;
  ward_name: string;
  province_name: string;
}

interface AddStudentModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: (selectedStudents: Student[]) => void;
  schoolId: string;
  classId: string;
  existingStudentIds?: string[];
}

export default function AddStudentModal({
  show,
  onClose,
  onConfirm,
  schoolId,
  classId,
  existingStudentIds = [],
}: AddStudentModalProps) {
  const t = useTranslations("schools");

  // States
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingStudents, setAddingStudents] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [schoolSearchTerm, setSchoolSearchTerm] = useState("");

  // Debounce for search input
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch schools for filter
  const fetchSchools = async () => {
    setLoadingSchools(true);
    try {
      const response = await getListSchool();
      if (response?.data?.schools) {
        // Transform the API response to match our School interface
        const transformedSchools = response.data.schools.map(
          (school: ApiSchool) => ({
            id: parseInt(school.id),
            name: school.school_name,
          })
        );
        setSchools(transformedSchools);
      }
    } catch (error) {
      console.error("Error fetching schools:", error);
    } finally {
      setLoadingSchools(false);
    }
  };

  // Fetch students with current filters and pagination
  const fetchStudents = async (page: number = 1) => {
    setLoading(true);
    try {
      const params: any = {
        role_id: 3, // Students
        page: page,
        per_page: perPage,
      };

      // Add search term
      if (searchTerm) {
        params.keyword = searchTerm;
      }

      // Add school filter
      if (schoolFilter !== "all") {
        params.school_id = schoolFilter;
      }

      const response = await GetUserListAdvanced(params);

      if (response?.data?.users) {

        // Filter out students that are already in this class
        // This might reduce the number of displayed students if some are already in the class
        const availableStudents = response.data.users.filter(
          (student: Student) => !existingStudentIds.includes(student.id)
        );

        setStudents(availableStudents);
        setFilteredStudents(availableStudents);

        // Set pagination info - use total_count instead of total
        if (response.data.total_count) {
          setTotalStudents(parseInt(response.data.total_count));
          setTotalPages(
            Math.ceil(parseInt(response.data.total_count) / perPage)
          );
        }
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) {
      setCurrentPage(1);
      setSearchTerm("");
      setSchoolFilter("all");
      fetchSchools();
    }
  }, [show, classId]);

  // Initial fetch when modal opens
  useEffect(() => {
    if (show) {
      fetchStudents(1);
    }
  }, [show]);

  // Filter and search logic - now we'll fetch from API with filters
  const applyFilters = useMemo(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);

    // Fetch students with current filters
    const fetchFilteredStudents = async () => {
      setLoading(true);
      try {
        const params: any = {
          role_id: 3, // Students
          page: 1,
          per_page: perPage,
        };

        // Add search term (use debounced value)
        if (debouncedSearchTerm) {
          params.keyword = debouncedSearchTerm;
        }

        // Add school filter
        if (schoolFilter !== "all") {
          params.school_id = schoolFilter;
        }

        const response = await GetUserListAdvanced(params);

        if (response?.data?.users) {

          // Filter out students that are already in this class
          const availableStudents = response.data.users.filter(
            (student: Student) => !existingStudentIds.includes(student.id)
          );

          setStudents(availableStudents);
          setFilteredStudents(availableStudents);

          // Set pagination info - use total_count instead of total
          if (response.data.total_count) {
            setTotalStudents(parseInt(response.data.total_count));
            setTotalPages(
              Math.ceil(parseInt(response.data.total_count) / perPage)
            );
          }
        }
      } catch (error) {
        console.error("Error fetching filtered students:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredStudents();
  }, [debouncedSearchTerm, schoolFilter, perPage, existingStudentIds]);

  // Selection handlers
  const handleSelectStudent = (student: Student, checked: boolean) => {
    if (checked) {
      setSelectedStudents((prev) => [...prev, student]);
    } else {
      setSelectedStudents((prev) => prev.filter((s) => s.id !== student.id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(filteredStudents);
    } else {
      setSelectedStudents([]);
    }
  };

  const handleConfirm = async () => {
    if (selectedStudents.length === 0) return;

    setAddingStudents(true);
    try {
      const studentIds = selectedStudents.map((student) =>
        parseInt(student.id)
      );

      const response = await AddStudentsToClass({
        class_id: parseInt(classId),
        student_ids: studentIds,
      });

      if (response?.data?.success) {
        // Show success message IMMEDIATELY after API success
        toast.success(t("addStudentsSuccess"));

        // Reset modal state and close modal first for immediate user feedback
        setSelectedStudents([]);
        setSearchTerm("");
        setSchoolFilter("all");
        setCurrentPage(1);
        onClose();

        // Then refresh data in background without blocking UI
        setTimeout(() => {
          onConfirm(selectedStudents);
        }, 100);
      } else {
        console.error("Failed to add students to class:", response);
        toast.error(t("addStudentsError"));
      }
    } catch (error) {
      console.error("Error adding students to class:", error);
      toast.error(t("addStudentsError"));
    } finally {
      setAddingStudents(false);
    }
  };

  const handleClose = () => {
    setSelectedStudents([]);
    setSearchTerm("");
    setSchoolFilter("all");
    setCurrentPage(1);
    onClose();
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Fetch students for the specific page
    const fetchPageStudents = async () => {
      setLoading(true);
      try {
        const params: any = {
          role_id: 3, // Students
          page: page,
          per_page: perPage,
        };

        // Add search term
        if (debouncedSearchTerm) {
          params.keyword = debouncedSearchTerm;
        }

        // Add school filter
        if (schoolFilter !== "all") {
          params.school_id = schoolFilter;
        }

        const response = await GetUserListAdvanced(params);

        if (response?.data?.users) {
          console.log(
            "Page Change API Response - Total users:",
            response.data.users.length
          );
          console.log(
            "Page Change API Response - Total count:",
            response.data.total_count
          );
          console.log(
            "Page Change - Existing student IDs:",
            existingStudentIds
          );

          // Filter out students that are already in this class
          const availableStudents = response.data.users.filter(
            (student: Student) => !existingStudentIds.includes(student.id)
          );

          setStudents(availableStudents);
          setFilteredStudents(availableStudents);
        }
      } catch (error) {
        console.error("Error fetching students for page:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPageStudents();
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setCurrentPage(1);
    // The applyFilters useMemo will handle the refetch with new per_page
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 7; // Show max 7 page numbers

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages with ellipsis
      if (currentPage <= 4) {
        // Show first 5 pages + ellipsis + last page
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Show first page + ellipsis + last 5 pages
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show first page + ellipsis + current page and neighbors + ellipsis + last page
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <Dialog open={show} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("selectStudentsFromList")}
          </DialogTitle>
        </DialogHeader>

        {/* Filters Section */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-start">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t("searchByName")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                disabled={loading || addingStudents}
              />
              {searchTerm !== debouncedSearchTerm && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            {/* School Filter */}
            <Select
              value={schoolFilter}
              onValueChange={(value) => {
                setSchoolFilter(value);
                setSchoolSearchTerm(""); // Reset search when school is selected
              }}
              disabled={loading || addingStudents}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectSchool")} />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder={t("searchSchool")}
                      className="pl-8 h-8 text-sm"
                      value={schoolSearchTerm}
                      onChange={(e) => setSchoolSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setSchoolSearchTerm("");
                        }
                      }}
                    />
                  </div>
                </div>
                <SelectItem value="all">{t("allSchools")}</SelectItem>
                {sortAlphabetGeneric(schools
                  .filter((school) =>
                    school.name
                      .toLowerCase()
                      .includes(schoolSearchTerm.toLowerCase())
                  ), item => item.name, true)
                  .map((school) => (
                    <SelectItem key={school.id} value={school.id.toString()}>
                      {school.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Students Table */}
        <div className="flex-1 overflow-y-auto border rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center p-8 min-h-[200px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">{t("loadingStudents")}</p>
              </div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex items-center justify-center p-8 min-h-[200px]">
              <div className="text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">{t("noStudentsFound")}</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectedStudents.length === filteredStudents.length &&
                          filteredStudents.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                        disabled={addingStudents}
                      />
                    </TableHead>
                    <TableHead>{t("student")}</TableHead>
                    <TableHead>{t("username")}</TableHead>
                    <TableHead>{t("email")}</TableHead>
                    <TableHead>{t("phone")}</TableHead>
                    <TableHead>{t("school")}</TableHead>
                    <TableHead>{t("class")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.some(
                            (s) => s.id === student.id
                          )}
                          onCheckedChange={(checked) =>
                            handleSelectStudent(student, checked as boolean)
                          }
                          disabled={addingStudents}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.avatar || ""} />
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                              {getInitials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{student.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{student.username}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.phone_number || "-"}</TableCell>
                      <TableCell>
                        {student.user_info?.school ? (
                          <Badge variant="outline" className="text-xs">
                            {student.user_info.school.name}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {student.user_info?.class ? (
                          <Badge variant="outline" className="text-xs">
                            {student.user_info.class.name}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={student.status ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {student.status ? t("active") : t("inactive")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Loading overlay for table */}
              {loading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">
                      {t("loadingStudents")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {!loading && filteredStudents.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{t("show")}</span>
                <Select
                  value={perPage.toString()}
                  onValueChange={(value) =>
                    handlePerPageChange(parseInt(value))
                  }
                  disabled={loading || addingStudents}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">{t("perPage")}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading || addingStudents}
              >
                <ChevronLeft className="h-4 w-4" />
                {t("previous")}
              </Button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((pageNum, index) => (
                  <div key={index}>
                    {pageNum === "..." ? (
                      <span className="px-2 text-gray-500">...</span>
                    ) : (
                      <Button
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => handlePageChange(pageNum as number)}
                        className="w-8 h-8 p-0"
                        disabled={loading || addingStudents}
                      >
                        {pageNum}
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={
                  currentPage === totalPages || loading || addingStudents
                }
              >
                {t("next")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedStudents.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setSelectedStudents([])}
                className="text-red-600 hover:text-red-800"
                disabled={addingStudents}
              >
                <X className="h-4 w-4 mr-1" />
                {t("clearSelection")}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">
              {selectedStudents.length > 0 && (
                <span>
                  {t("selectedCount")}: {selectedStudents.length}{" "}
                  {t("students")}
                </span>
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={addingStudents}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedStudents.length === 0 || addingStudents}
            >
              {addingStudents ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t("addingStudents")}...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {t("addSelectedStudents")} ({selectedStudents.length})
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
