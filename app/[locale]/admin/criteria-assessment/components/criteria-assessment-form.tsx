"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  CreateGroupWithCriteriaRequest,
  AssessmentCriteriaGroup,
} from "@/lib/api/group-criteria";

export interface CriteriaAssessmentFormData
  extends Omit<CreateGroupWithCriteriaRequest, "group" | "criteria"> {
  group: {
    name: string;
    subject_id: number | string;
    has_file: boolean;
  };
  criteria: Array<{
    id?: string | number;
    name: string;
    description: string;
    max_score: number;
    subcriteria?: Array<{
      id?: string | number;
      name: string;
      description: string;
      max_score: number;
    }>;
  }>;
}

interface CriteriaAssessmentFormProps {
  initialData?: AssessmentCriteriaGroup;
  onSubmit: (data: CreateGroupWithCriteriaRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitButtonText?: string;
  subjects: Array<{ id: string; name: string }>;
}

export default function CriteriaAssessmentForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitButtonText,
  subjects,
}: CriteriaAssessmentFormProps) {
  // Initialize formData with initialData if available, otherwise use defaults
  const [formData, setFormData] = useState<CriteriaAssessmentFormData>(() => {
    if (initialData) {
      return {
        group: {
          name: initialData.name || "",
          subject_id: String(initialData.subject_id) || "",
          has_file: initialData.has_file || false,
        },
        criteria:
          initialData.criteria?.map((c) => ({
            id: c.id || "0",
            name: c.name || "",
            description: c.description || "",
            max_score: c.max_score || 0,
            subcriteria:
              c.subcriteria?.map((s) => ({
                id: s.id || "0",
                name: s.name || "",
                description: s.description || "",
                max_score: s.max_score || 0,
              })) || [],
          })) || [],
      };
    }
    return {
      group: {
        name: "",
        subject_id: "",
        has_file: false,
      },
      criteria: [],
    };
  });

  useEffect(() => {
    if (initialData) {
      // Create a deep copy to ensure React detects the change in production
      const newFormData: CriteriaAssessmentFormData = {
        group: {
          name: initialData.name || "",
          subject_id: String(initialData.subject_id) || "",
          has_file: initialData.has_file || false,
        },
        criteria:
          initialData.criteria?.map((c) => ({
            id: c.id || "0",
            name: c.name || "",
            description: c.description || "",
            max_score: c.max_score || 0,
            subcriteria:
              c.subcriteria?.map((s) => ({
                id: s.id || "0",
                name: s.name || "",
                description: s.description || "",
                max_score: s.max_score || 0,
              })) || [],
          })) || [],
      };
      setFormData(newFormData);
    } else {
    }
  }, [initialData?.id]);

  // Criteria handlers
  const addCriteria = useCallback(() => {
    setFormData({
      ...formData,
      criteria: [
        ...formData.criteria,
        {
          id: "0",
          name: "",
          description: "",
          max_score: 0,
          subcriteria: [],
        },
      ],
    });
  }, [formData]);

  const removeCriteria = useCallback(
    (index: number) => {
      setFormData({
        ...formData,
        criteria: formData.criteria.filter((_, i) => i !== index),
      });
    },
    [formData]
  );

  const updateCriteria = useCallback(
    (
      index: number,
      field: "name" | "description" | "max_score",
      value: string | number
    ) => {
      setFormData({
        ...formData,
        criteria: formData.criteria.map((c, i) =>
          i === index ? { ...c, [field]: value } : c
        ),
      });
    },
    [formData]
  );

  // Subcriteria handlers
  const addSubcriteria = useCallback(
    (criteriaIndex: number) => {
      setFormData({
        ...formData,
        criteria: formData.criteria.map((c, i) =>
          i === criteriaIndex
            ? {
                ...c,
                subcriteria: [
                  ...(c.subcriteria || []),
                  {
                    id: "0",
                    name: "",
                    description: "",
                    max_score: 0,
                  },
                ],
              }
            : c
        ),
      });
    },
    [formData]
  );

  const removeSubcriteria = useCallback(
    (criteriaIndex: number, subcriteriaIndex: number) => {
      setFormData({
        ...formData,
        criteria: formData.criteria.map((c, i) =>
          i === criteriaIndex
            ? {
                ...c,
                subcriteria: (c.subcriteria || []).filter(
                  (_, si) => si !== subcriteriaIndex
                ),
              }
            : c
        ),
      });
    },
    [formData]
  );

  const updateSubcriteria = useCallback(
    (
      criteriaIndex: number,
      subcriteriaIndex: number,
      field: "name" | "description" | "max_score",
      value: string | number
    ) => {
      setFormData({
        ...formData,
        criteria: formData.criteria.map((c, i) =>
          i === criteriaIndex
            ? {
                ...c,
                subcriteria: (c.subcriteria || []).map((s, si) =>
                  si === subcriteriaIndex ? { ...s, [field]: value } : s
                ),
              }
            : c
        ),
      });
    },
    [formData]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.group.name.trim()) {
      return;
    }

    if (!formData.group.subject_id) {
      return;
    }

    // Validate and clean data
    const cleanedData: CreateGroupWithCriteriaRequest = {
      group: {
        name: formData.group.name.trim(),
        subject_id: Number(formData.group.subject_id),
        has_file: formData.group.has_file,
      },
      criteria: formData.criteria
        .filter((c) => c.name.trim() !== "")
        .map((c) => ({
          id: c.id ? (typeof c.id === "string" ? Number(c.id) || 0 : c.id) : 0,
          name: c.name.trim(),
          description: c.description.trim(),
          max_score: Number(c.max_score) || 0,
          subcriteria:
            c.subcriteria
              ?.filter((s) => s.name.trim() !== "")
              .map((s) => ({
                id: s.id
                  ? typeof s.id === "string"
                    ? Number(s.id) || 0
                    : s.id
                  : 0,
                name: s.name.trim(),
                description: s.description.trim(),
                max_score: Number(s.max_score) || 0,
              })) || [],
        })),
    };

    await onSubmit(cleanedData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject_id">
                Môn học <span className="text-red-500">*</span>
              </Label>
              <Select
                value={String(formData.group.subject_id)}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    group: { ...formData.group, subject_id: value },
                  })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn môn học" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group_name">
                Tên bảng <span className="text-red-500">*</span>
              </Label>
              <Input
                id="group_name"
                placeholder="Nhập tên bảng tiêu chí"
                value={formData.group.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    group: { ...formData.group, name: e.target.value },
                  })
                }
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="has_file"
              checked={formData.group.has_file}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  group: { ...formData.group, has_file: checked === true },
                })
              }
              disabled={isSubmitting}
            />
            <Label
              htmlFor="has_file"
              className="text-sm font-normal cursor-pointer"
            >
              Upload bài làm
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Criteria Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg">Tiêu chí đánh giá</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCriteria}
              disabled={isSubmitting}
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm tiêu chí
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.criteria.map((criterion, criteriaIndex) => (
              <Card
                key={criteriaIndex}
                className="border-l-4 border-l-blue-500"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label>
                            Tên tiêu chí <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            placeholder="Nhập tên tiêu chí"
                            value={criterion.name}
                            onChange={(e) =>
                              updateCriteria(
                                criteriaIndex,
                                "name",
                                e.target.value
                              )
                            }
                            disabled={isSubmitting}
                          />
                        </div>
                        <div>
                          <Label>
                            Điểm tối đa <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            placeholder="0"
                            value={criterion.max_score || ""}
                            onChange={(e) =>
                              updateCriteria(
                                criteriaIndex,
                                "max_score",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCriteria(criteriaIndex)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addSubcriteria(criteriaIndex)}
                        disabled={isSubmitting}
                        className="max-w-full"
                      >
                        <Plus className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="truncate">Thêm tiêu chí con</span>
                      </Button>
                    </div>
                    <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                      {criterion.subcriteria?.map(
                        (subcriteria, subcriteriaIndex) => (
                          <div key={subcriteriaIndex} className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
                              Tiêu chí con {subcriteriaIndex + 1}
                            </Label>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                              <div className="md:col-span-4">
                                <Input
                                  placeholder="Tên tiêu chí con"
                                  value={subcriteria.name}
                                  onChange={(e) =>
                                    updateSubcriteria(
                                      criteriaIndex,
                                      subcriteriaIndex,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  disabled={isSubmitting}
                                />
                              </div>
                              <div className="md:col-span-3">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  placeholder="Điểm tối đa"
                                  value={subcriteria.max_score || ""}
                                  onChange={(e) =>
                                    updateSubcriteria(
                                      criteriaIndex,
                                      subcriteriaIndex,
                                      "max_score",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  disabled={isSubmitting}
                                />
                              </div>
                              <div className="md:col-span-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    removeSubcriteria(
                                      criteriaIndex,
                                      subcriteriaIndex
                                    )
                                  }
                                  disabled={isSubmitting}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {formData.criteria.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                Chưa có tiêu chí nào. Nhấn "Thêm tiêu chí" để bắt đầu.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Hủy
        </Button>
        <Button
          type="submit"
          className="bg-[#EB8922] hover:bg-[#d97a1a] text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Đang lưu..." : submitButtonText || "Lưu"}
        </Button>
      </div>
    </form>
  );
}
