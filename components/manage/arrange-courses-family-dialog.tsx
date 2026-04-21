"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { GetListCoursesFamily, AssignParentCourse } from "@/lib/api/courses";
import { useToast } from "@/hooks/use-toast";
import {
  LucideArrowRight,
  LucideSave,
  LucideMove,
  LucidePlus,
  LucideBookOpen,
  LucideX,
} from "lucide-react";

interface ArrangeCoursesFamilyDialogProps {
  programId: string;
}

export function ArrangeCoursesFamilyDialog({
  programId,
}: ArrangeCoursesFamilyDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [coursesFamily, setCoursesFamily] = useState<any>(null);
  const [originalData, setOriginalData] = useState<any>(null);
  const [courseMoves, setCourseMoves] = useState<Map<string, string>>(
    new Map()
  );
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(
    new Set()
  );
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [templateCourses, setTemplateCourses] = useState<Map<string, string>>(
    new Map()
  );
  const [originalTemplateCourses, setOriginalTemplateCourses] = useState<
    Map<string, string>
  >(new Map()); // Lưu template courses ban đầu để so sánh
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroups, setNewGroups] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && programId) {
      loadCoursesFamily();
    } else {
      setCourseMoves(new Map());
      setSelectedCourses(new Set());
      setSelectedParentId(null);
      setTemplateCourses(new Map());
      setOriginalTemplateCourses(new Map());
      setOriginalData(null);
      setShowCreateGroup(false);
      setNewGroups([]);
    }
  }, [isOpen, programId]);

  const loadCoursesFamily = async () => {
    setLoading(true);
    try {
      const response = await GetListCoursesFamily(programId);
      if (response?.data?.parent_courses) {
        const clonedData = JSON.parse(JSON.stringify(response.data));
        setCoursesFamily(clonedData);
        setOriginalData(JSON.parse(JSON.stringify(response.data)));
        // Reset tất cả các state liên quan đến thay đổi UI
        setCourseMoves(new Map());
        setSelectedCourses(new Set());
        setSelectedParentId(null);
        setNewGroups([]); // Reset nhóm mới để tránh duplicate
        const templateMap = new Map<string, string>();
        response.data.parent_courses.forEach((parent: any) => {
          if (parent.id) {
            templateMap.set(parent.id, parent.id);
          }
        });
        setTemplateCourses(templateMap);
        setOriginalTemplateCourses(new Map(templateMap)); // Lưu bản gốc
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách khóa học",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading courses family:", error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi tải dữ liệu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDisplayData = () => {
    if (!coursesFamily) return null;

    const displayData = JSON.parse(JSON.stringify(coursesFamily));

    if (newGroups.length > 0) {
      displayData.parent_courses = [
        ...displayData.parent_courses,
        ...newGroups,
      ];
    }

    courseMoves.forEach((newParentId, courseId) => {
      const targetParent = displayData.parent_courses.find(
        (p: any) => p.id === newParentId
      );

      if (!targetParent) return;

      if (!targetParent.children_courses) {
        targetParent.children_courses = [];
      }

      const alreadyInTarget = targetParent.children_courses.some(
        (c: any) => c.id === courseId
      );

      let courseToMove: any = null;
      displayData.parent_courses.forEach((parent: any) => {
        if (parent.id !== newParentId && parent.children_courses) {
          const index = parent.children_courses.findIndex(
            (c: any) => c.id === courseId
          );
          if (index !== -1) {
            if (!courseToMove) {
              courseToMove = parent.children_courses[index];
            }
            parent.children_courses.splice(index, 1);
          }
        }
      });

      if (courseToMove && !alreadyInTarget) {
        targetParent.children_courses.push(courseToMove);
      }
    });

    return displayData;
  };

  const handleCreateGroup = () => {
    const tempId = `temp-${Date.now()}`;
    const newGroup = {
      id: tempId,
      object_title: "",
      children_courses: [],
    };

    setNewGroups([...newGroups, newGroup]);
    setShowCreateGroup(false);

    const newTemplates = new Map(templateCourses);
    newTemplates.set(tempId, tempId);
    setTemplateCourses(newTemplates);

    toast({
      title: "Thành công",
      description: "Đã tạo nhóm mới (chưa lưu)",
    });
  };

  const getCurrentParentId = (
    courseId: string,
    displayData: any
  ): string | null => {
    for (const parent of displayData.parent_courses) {
      if (parent.children_courses?.some((c: any) => c.id === courseId)) {
        return parent.id;
      }
    }
    return null;
  };

  const handleCourseToggle = (courseId: string, parentId: string) => {
    const displayData = getDisplayData();
    if (!displayData) return;

    const currentParentId = getCurrentParentId(courseId, displayData);
    if (!currentParentId) return;

    const newSelected = new Set(selectedCourses);

    if (newSelected.has(courseId)) {
      newSelected.delete(courseId);
      if (newSelected.size === 0) {
        setSelectedParentId(null);
      }
    } else {
      if (selectedParentId && selectedParentId !== currentParentId) {
        newSelected.clear();
        toast({
          title: "Thông báo",
          description:
            "Chỉ được chọn khóa học trong cùng một cụm. Đã bỏ chọn các khóa học trước đó.",
        });
      }
      newSelected.add(courseId);
      setSelectedParentId(currentParentId);
    }
    setSelectedCourses(newSelected);
  };

  const handleMoveToParent = (targetParentId: string) => {
    if (selectedCourses.size === 0) {
      toast({
        title: "Thông báo",
        description: "Vui lòng chọn ít nhất một khóa học",
      });
      return;
    }

    const newMoves = new Map(courseMoves);
    selectedCourses.forEach((courseId) => {
      newMoves.set(courseId, targetParentId);
    });
    setCourseMoves(newMoves);
    setSelectedCourses(new Set());
  };

  const handleSetTemplate = (parentId: string, courseId: string) => {
    const newTemplates = new Map(templateCourses);
    const currentTemplate = newTemplates.get(parentId);

    if (currentTemplate === courseId) {
      newTemplates.set(parentId, parentId);
      setTemplateCourses(newTemplates);
      toast({
        title: "Đã bỏ chọn",
        description: "Đã bỏ đặt mẫu, trở về mặc định",
      });
    } else {
      newTemplates.set(parentId, courseId);
      setTemplateCourses(newTemplates);
      toast({
        title: "Thành công",
        description: "Đã đặt khóa học làm khóa mẫu",
      });
    }
  };

  const handleReset = () => {
    if (originalData) {
      setCoursesFamily(JSON.parse(JSON.stringify(originalData)));
      setCourseMoves(new Map());
      setSelectedCourses(new Set());
      setSelectedParentId(null);
      setNewGroups([]);
      const templateMap = new Map<string, string>();
      originalData.parent_courses.forEach((parent: any) => {
        if (parent.id) {
          templateMap.set(parent.id, parent.id);
        }
      });
      setTemplateCourses(templateMap);
      setOriginalTemplateCourses(new Map(templateMap));
      toast({
        title: "Đã hoàn tác",
        description: "Đã khôi phục về trạng thái ban đầu",
      });
    }
  };

  const handleSave = async () => {
    const displayData = getDisplayData();

    // Validation cho nhóm mới
    if (displayData) {
      for (const newGroup of newGroups) {
        const templateCourseId = templateCourses.get(newGroup.id);
        if (newGroup.id.startsWith("temp-")) {
          const hasCoursesInGroup = Array.from(courseMoves.values()).some(
            (parentId) => parentId === newGroup.id
          );

          if (hasCoursesInGroup) {
            if (!templateCourseId || templateCourseId === newGroup.id) {
              toast({
                title: "Lỗi",
                description: `Nhóm "${newGroup.name}" là nhóm mới và có khóa học, vui lòng chọn 1 khóa học làm khóa mẫu`,
                variant: "destructive",
              });
              return;
            }
          }
        }
      }
    }

    setSaving(true);
    try {
      // Lấy tất cả các nhóm (từ dữ liệu gốc và nhóm mới)
      const allGroups = new Map<string, any>();

      // Thêm các nhóm từ dữ liệu gốc
      if (coursesFamily?.parent_courses) {
        coursesFamily.parent_courses.forEach((parent: any) => {
          if (parent.id) {
            allGroups.set(parent.id, parent);
          }
        });
      }

      // Thêm các nhóm mới
      newGroups.forEach((group) => {
        allGroups.set(group.id, group);
      });

      // Nhóm các course được di chuyển theo parent
      const movesByParent = new Map<string, string[]>();
      courseMoves.forEach((parentId, courseId) => {
        if (!movesByParent.has(parentId)) {
          movesByParent.set(parentId, []);
        }
        movesByParent.get(parentId)!.push(courseId);
      });

      // Gọi API cho TẤT CẢ các nhóm (kể cả không có thay đổi)
      const promises = Array.from(allGroups.keys()).map(async (parentId) => {
        const templateCourseId = templateCourses.get(parentId);
        const originalTemplateId = originalTemplateCourses.get(parentId);
        const isNewGroup = parentId.startsWith("temp-");

        // Khóa mẫu mới
        const parentCourseId = templateCourseId
          ? parseInt(templateCourseId, 10)
          : parseInt(parentId, 10);

        // Lấy danh sách course được di chuyển vào nhóm này
        const courseIds = movesByParent.get(parentId) || [];
        let courseIdsArray = courseIds.map((id) => parseInt(id, 10));

        // Tìm các course đã được di chuyển ĐI khỏi nhóm này (có trong courseMoves nhưng parentId khác)
        const coursesMovedOut = new Set<number>();
        courseMoves.forEach((targetParentId, courseId) => {
          if (targetParentId !== parentId) {
            // Kiểm tra xem course này có thuộc nhóm này ban đầu không
            if (originalData) {
              const originalParent = originalData.parent_courses.find(
                (p: any) => p.id === parentId
              );
              if (
                originalParent &&
                originalParent.children_courses?.some(
                  (c: any) => c.id === courseId
                )
              ) {
                coursesMovedOut.add(parseInt(courseId, 10));
              }
              // Kiểm tra xem course này có phải là mẫu cũ của nhóm này không
              if (
                originalTemplateId &&
                originalTemplateId === courseId &&
                parseInt(courseId, 10) !== parseInt(parentId, 10)
              ) {
                coursesMovedOut.add(parseInt(courseId, 10));
              }
            }
          }
        });

        // Với nhóm cũ (không phải nhóm mới), cần lấy tất cả course con hiện tại
        if (!isNewGroup && originalData) {
          const originalParent = originalData.parent_courses.find(
            (p: any) => p.id === parentId
          );
          if (originalParent && originalParent.children_courses) {
            // Thêm tất cả course con từ dữ liệu gốc, nhưng loại bỏ các course đã được di chuyển đi
            originalParent.children_courses.forEach((child: any) => {
              const childId = parseInt(child.id, 10);
              // Chỉ thêm nếu:
              // - Chưa có trong courseIdsArray (chưa được di chuyển vào)
              // - Không bị di chuyển đi khỏi nhóm này
              if (
                !courseIdsArray.includes(childId) &&
                !coursesMovedOut.has(childId)
              ) {
                courseIdsArray.push(childId);
              }
            });
          }

          // Nếu có thay đổi khóa mẫu, thêm khóa mẫu cũ vào course_ids
          if (originalTemplateId && originalTemplateId !== templateCourseId) {
            const oldTemplateId = parseInt(originalTemplateId, 10);

            // Luôn thêm mẫu cũ vào course_ids khi đổi mẫu (để mẫu cũ trở thành course con của mẫu mới)
            // Trừ khi:
            // - Mẫu cũ đã có trong danh sách (từ children_courses)
            // - Mẫu cũ bị di chuyển đi
            // - Mẫu cũ chính là mẫu mới (không thể xảy ra vì đã check !== ở trên)
            if (
              oldTemplateId !== parentCourseId &&
              !courseIdsArray.includes(oldTemplateId) &&
              !coursesMovedOut.has(oldTemplateId)
            ) {
              courseIdsArray.push(oldTemplateId);
            }
          }
        }

        // Loại bỏ parent_course_id (khóa mẫu mới) khỏi danh sách course_ids
        courseIdsArray = courseIdsArray.filter((id) => id !== parentCourseId);

        // Vẫn gọi API ngay cả khi courseIdsArray rỗng
        const courseIdsString =
          courseIdsArray.length > 0 ? courseIdsArray.join(",") : "";

        return AssignParentCourse(courseIdsString, parentCourseId);
      });

      await Promise.all(promises);

      toast({
        title: "Thành công",
        description: "Đã cập nhật nhóm khóa học thành công",
      });
      await loadCoursesFamily();
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi lưu",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const displayData = getDisplayData();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <LucideMove className="h-4 w-4 mr-1" />
          Chia nhóm
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-center sm:justify-between flex-wrap gap-2">
            <DialogTitle className="text-xl font-bold text-gray-900">
              Chia nhóm khóa học trong chương trình
            </DialogTitle>
            <Button
              onClick={() => setShowCreateGroup(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <LucidePlus className="h-4 w-4 mr-2" />
              Tạo nhóm mới
            </Button>
          </div>
        </DialogHeader>

        {showCreateGroup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Tạo nhóm mới
              </h3>
              <div className="space-y-4">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateGroup(false);
                    }}
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleCreateGroup}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Tạo nhóm
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Đang tải dữ liệu...</div>
          </div>
        ) : coursesFamily?.parent_courses?.length === 0 ? (
          <div className="text-center py-12">
            <LucideBookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              Chưa có khóa học nào trong chương trình này
            </p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {displayData?.parent_courses?.map((parent: any) => {
              const hasSelected = selectedCourses.size > 0;
              const isSelectedParent = selectedParentId === parent.id;
              const templateCourseId = templateCourses.get(parent.id);
              const isNewGroup = parent.id.startsWith("temp-");
              const hasCoursesInGroup = Array.from(courseMoves.values()).some(
                (parentId) => parentId === parent.id
              );
              const needsTemplate =
                isNewGroup &&
                hasCoursesInGroup &&
                (!templateCourseId || templateCourseId === parent.id);

              return (
                <Card
                  key={parent.id}
                  className={`border-2 ${
                    needsTemplate
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                            Khóa mẫu
                          </Badge>
                          <CardTitle className="text-lg font-semibold text-gray-900">
                            {parent.name}
                          </CardTitle>
                        </div>
                        {parent.object_title && (
                          <Badge variant="outline" className="text-xs">
                            {parent.object_title}
                          </Badge>
                        )}
                        {isNewGroup && (
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                            Nhóm mới
                          </Badge>
                        )}
                        {needsTemplate && (
                          <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                            ⚠ Cần chọn khóa mẫu
                          </Badge>
                        )}
                      </div>
                      {hasSelected && !isSelectedParent && (
                        <Button
                          size="sm"
                          onClick={() => handleMoveToParent(parent.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <LucideArrowRight className="h-4 w-4 mr-1" />
                          Chuyển đến đây
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {parent.children_courses?.length > 0 ? (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-600 mb-3">
                          Khóa học con ({parent.children_courses.length})
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {parent.children_courses.map((child: any) => {
                            const isSelected = selectedCourses.has(child.id);
                            const isMoved = courseMoves.has(child.id);

                            let originalParentId = parent.id;
                            if (originalData) {
                              for (const origParent of originalData.parent_courses) {
                                if (
                                  origParent.children_courses?.some(
                                    (c: any) => c.id === child.id
                                  )
                                ) {
                                  originalParentId = origParent.id;
                                  break;
                                }
                              }
                            }
                            const isMovedFromOriginal =
                              isMoved && originalParentId !== parent.id;
                            const isTemplate = templateCourseId === child.id;

                            return (
                              <div
                                key={child.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border ${
                                  isSelected
                                    ? "border-blue-500 bg-blue-50"
                                    : isMovedFromOriginal
                                    ? "border-green-500 bg-green-50"
                                    : isTemplate
                                    ? "border-purple-500 bg-purple-50"
                                    : "border-gray-200 hover:border-gray-300"
                                } cursor-pointer transition-all`}
                                onClick={() =>
                                  handleCourseToggle(child.id, parent.id)
                                }
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() =>
                                    handleCourseToggle(child.id, parent.id)
                                  }
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <div className="font-medium text-gray-900 truncate">
                                      {child.name}
                                    </div>
                                    {isTemplate && (
                                      <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                                        Mẫu
                                      </Badge>
                                    )}
                                  </div>
                                  {child.object_title && (
                                    <div className="text-sm text-gray-500 truncate">
                                      {child.object_title}
                                    </div>
                                  )}
                                  {isMovedFromOriginal && (
                                    <div className="text-xs text-green-600 mt-1 font-medium">
                                      ✓ Đã chuyển đến đây
                                    </div>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetTemplate(parent.id, child.id);
                                  }}
                                  className={`${
                                    isTemplate
                                      ? "bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200"
                                      : "border-gray-300 hover:bg-gray-50"
                                  } text-xs`}
                                  title={
                                    isTemplate
                                      ? "Click để bỏ đặt mẫu"
                                      : "Click để đặt làm khóa mẫu"
                                  }
                                >
                                  {isTemplate ? "✓ Mẫu (Bỏ)" : "Đặt mẫu"}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 text-center py-4">
                        Chưa có khóa học con
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <DialogFooter className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            {selectedCourses.size > 0 && (
              <span>Đã chọn {selectedCourses.size} khóa học</span>
            )}
            {courseMoves.size > 0 && selectedCourses.size === 0 && (
              <span className="text-green-600 font-medium">
                Đã di chuyển {courseMoves.size} khóa học
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {courseMoves.size > 0 && (
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={saving}
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <LucideX className="h-4 w-4 mr-2" />
                Hoàn tác
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || courseMoves.size === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <LucideSave className="h-4 w-4 mr-2" />
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
