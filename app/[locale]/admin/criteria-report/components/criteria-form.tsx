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
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Star, CheckSquare, GripVertical } from "lucide-react";
import {
  CreateStudyReportCriteriaRequest,
  Note,
  StarSkill,
  CheckSkill,
  SkillType,
  NodeSkillType,
  StudyReportCriteria,
} from "@/lib/api/report-criteria";
import { useTranslations } from "next-intl";

export interface CriteriaFormData
  extends Omit<CreateStudyReportCriteriaRequest, "subject_id"> {
  subject_id: number | string;
}

interface CriteriaFormProps {
  initialData?: StudyReportCriteria;
  onSubmit: (data: CreateStudyReportCriteriaRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitButtonText?: string;
  subjects: Array<{ id: string; name: string }>;
  readOnly?: boolean;
}

export default function CriteriaForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitButtonText,
  subjects,
  readOnly = false,
}: CriteriaFormProps) {
  const t = useTranslations("criteriaReport.form");
  const tCommon = useTranslations("common");
  const isDisabled = isSubmitting;

  // Initialize formData with initialData if available, otherwise use defaults
  const [formData, setFormData] = useState<CriteriaFormData>(() => {
    if (initialData) {
      return {
        subject_id: String(initialData.subject_id) || "",
        name: initialData.name || "",
        description: initialData.description || "",
        max_star: initialData.max_star || 5,
        notes: initialData.notes ? [...initialData.notes] : [],
        star_skills:
          initialData.star_skills?.map((s) => ({
            id: s.id,
            name_vn: s.name_vn || "",
            name_en: s.name_en || "",
            description: s.description || "",
            types: s.types
              ? s.types.map((t) => ({
                  ...t,
                  node_types: t.node_types
                    ? t.node_types.map((n) => ({
                        ...n,
                        node_types: n.node_types ? [...n.node_types] : [],
                      }))
                    : [],
                }))
              : [],
          })) || [],
        check_skills:
          initialData.check_skills?.map((s) => ({
            id: s.id,
            name_vn: s.name_vn || "",
            name_en: s.name_en || "",
            description: s.description || "",
            types: s.types
              ? s.types.map((t) => ({
                  ...t,
                  node_types: t.node_types
                    ? t.node_types.map((n) => ({
                        ...n,
                        node_types: n.node_types ? [...n.node_types] : [],
                      }))
                    : [],
                }))
              : [],
          })) || [],
      };
    }
    return {
      subject_id: "",
      name: "",
      description: "",
      max_star: 5,
      notes: [],
      star_skills: [],
      check_skills: [],
    };
  });

  useEffect(() => {
    if (initialData) {
      console.log("CriteriaForm: initialData received", initialData);
      // Create a deep copy to ensure React detects the change in production
      const newFormData: CriteriaFormData = {
        subject_id: String(initialData.subject_id) || "",
        name: initialData.name || "",
        description: initialData.description || "",
        max_star: initialData.max_star || 5,
        notes: initialData.notes ? [...initialData.notes] : [],
        star_skills:
          initialData.star_skills?.map((s) => ({
            id: s.id,
            name_vn: s.name_vn || "",
            name_en: s.name_en || "",
            description: s.description || "",
            types: s.types
              ? s.types.map((t) => ({
                  ...t,
                  node_types: t.node_types
                    ? t.node_types.map((n) => ({
                        ...n,
                        node_types: n.node_types ? [...n.node_types] : [],
                      }))
                    : [],
                }))
              : [],
          })) || [],
        check_skills:
          initialData.check_skills?.map((s) => ({
            id: s.id,
            name_vn: s.name_vn || "",
            name_en: s.name_en || "",
            description: s.description || "",
            types: s.types
              ? s.types.map((t) => ({
                  ...t,
                  node_types: t.node_types
                    ? t.node_types.map((n) => ({
                        ...n,
                        node_types: n.node_types ? [...n.node_types] : [],
                      }))
                    : [],
                }))
              : [],
          })) || [],
      };
      setFormData(newFormData);
      console.log("CriteriaForm: formData set", newFormData);
    } else {
      console.log("CriteriaForm: initialData is null/undefined");
    }
  }, [initialData?.id]);

  // Notes handlers
  const addNote = useCallback(() => {
    if (readOnly) return;
    const nextValue = formData.notes.length + 1;
    if (nextValue > formData.max_star) {
      return;
    }
    setFormData({
      ...formData,
      notes: [
        ...formData.notes,
        { value: nextValue, text: "", description: "" },
      ],
    });
  }, [formData]);

  const removeNote = useCallback(
    (index: number) => {
      if (readOnly) return;
      setFormData({
        ...formData,
        notes: formData.notes.filter((_, i) => i !== index),
      });
    },
    [formData]
  );

  const updateNote = useCallback(
    (
      index: number,
      field: "value" | "text" | "description",
      value: number | string
    ) => {
      if (readOnly) return;
      setFormData({
        ...formData,
        notes: formData.notes.map((note, i) =>
          i === index ? { ...note, [field]: value } : note
        ),
      });
    },
    [formData]
  );

  // Star Skills handlers
  const addStarSkill = useCallback(() => {
    if (readOnly) return;
    setFormData({
      ...formData,
      star_skills: [
        ...formData.star_skills,
        {
          name_vn: "",
          name_en: "",
          description: "",
          types: [],
        },
      ],
    });
  }, [formData]);

  const removeStarSkill = useCallback(
    (index: number) => {
      if (readOnly) return;
      setFormData({
        ...formData,
        star_skills: formData.star_skills.filter((_, i) => i !== index),
      });
    },
    [formData]
  );

  const updateStarSkill = useCallback(
    (
      index: number,
      field: "name_vn" | "name_en" | "description",
      value: string
    ) => {
      if (readOnly) return;
      setFormData({
        ...formData,
        star_skills: formData.star_skills.map((skill, i) =>
          i === index ? { ...skill, [field]: value } : skill
        ),
      });
    },
    [formData]
  );

  // Check Skills handlers
  const addCheckSkill = useCallback(() => {
    if (readOnly) return;
    setFormData({
      ...formData,
      check_skills: [
        ...formData.check_skills,
        {
          name_vn: "",
          name_en: "",
          description: "",
          types: [],
        },
      ],
    });
  }, [formData]);

  const removeCheckSkill = useCallback(
    (index: number) => {
      if (readOnly) return;
      setFormData({
        ...formData,
        check_skills: formData.check_skills.filter((_, i) => i !== index),
      });
    },
    [formData]
  );

  const updateCheckSkill = useCallback(
    (
      index: number,
      field: "name_vn" | "name_en" | "description",
      value: string
    ) => {
      if (readOnly) return;
      setFormData({
        ...formData,
        check_skills: formData.check_skills.map((skill, i) =>
          i === index ? { ...skill, [field]: value } : skill
        ),
      });
    },
    [formData]
  );

  // Skill Types handlers
  const addSkillType = useCallback(
    (skillType: "star" | "check", skillIndex: number) => {
      if (readOnly) return;
      if (skillType === "star") {
        setFormData({
          ...formData,
          star_skills: formData.star_skills.map((skill, i) =>
            i === skillIndex
              ? {
                  ...skill,
                  types: [
                    ...skill.types,
                    {
                      name_vn: "",
                      name_en: "",
                      sort_order: skill.types.length + 1,
                      node_types: [],
                    },
                  ],
                }
              : skill
          ),
        });
      } else {
        setFormData({
          ...formData,
          check_skills: formData.check_skills.map((skill, i) =>
            i === skillIndex
              ? {
                  ...skill,
                  types: [
                    ...skill.types,
                    {
                      name_vn: "",
                      name_en: "",
                      sort_order: skill.types.length + 1,
                      node_types: [],
                    },
                  ],
                }
              : skill
          ),
        });
      }
    },
    [formData]
  );

  const removeSkillType = useCallback(
    (skillType: "star" | "check", skillIndex: number, typeIndex: number) => {
      if (readOnly) return;
      if (skillType === "star") {
        setFormData({
          ...formData,
          star_skills: formData.star_skills.map((skill, i) =>
            i === skillIndex
              ? {
                  ...skill,
                  types: skill.types.filter((_, ti) => ti !== typeIndex),
                }
              : skill
          ),
        });
      } else {
        setFormData({
          ...formData,
          check_skills: formData.check_skills.map((skill, i) =>
            i === skillIndex
              ? {
                  ...skill,
                  types: skill.types.filter((_, ti) => ti !== typeIndex),
                }
              : skill
          ),
        });
      }
    },
    [formData]
  );

  const updateSkillType = useCallback(
    (
      skillType: "star" | "check",
      skillIndex: number,
      typeIndex: number,
      field: "name_vn" | "name_en",
      value: string
    ) => {
      if (readOnly) return;
      if (skillType === "star") {
        setFormData({
          ...formData,
          star_skills: formData.star_skills.map((skill, i) =>
            i === skillIndex
              ? {
                  ...skill,
                  types: skill.types.map((type, ti) =>
                    ti === typeIndex ? { ...type, [field]: value } : type
                  ),
                }
              : skill
          ),
        });
      } else {
        setFormData({
          ...formData,
          check_skills: formData.check_skills.map((skill, i) =>
            i === skillIndex
              ? {
                  ...skill,
                  types: skill.types.map((type, ti) =>
                    ti === typeIndex ? { ...type, [field]: value } : type
                  ),
                }
              : skill
          ),
        });
      }
    },
    [formData]
  );

  // Node Types handlers
  const addNodeType = useCallback(
    (skillType: "star" | "check", skillIndex: number, typeIndex: number) => {
      if (readOnly) return;
      if (skillType === "star") {
        setFormData({
          ...formData,
          star_skills: formData.star_skills.map((skill, i) =>
            i === skillIndex
              ? {
                  ...skill,
                  types: skill.types.map((type, ti) =>
                    ti === typeIndex
                      ? {
                          ...type,
                          node_types: [
                            ...(type.node_types || []),
                            {
                              id: `temp-${Date.now()}-${Math.random()}`,
                              name_vn: "",
                              name_en: "",
                              sort_order: (type.node_types?.length || 0) + 1,
                            },
                          ],
                        }
                      : type
                  ),
                }
              : skill
          ),
        });
      } else {
        setFormData({
          ...formData,
          check_skills: formData.check_skills.map((skill, i) =>
            i === skillIndex
              ? {
                  ...skill,
                  types: skill.types.map((type, ti) =>
                    ti === typeIndex
                      ? {
                          ...type,
                          node_types: [
                            ...(type.node_types || []),
                            {
                              id: `temp-${Date.now()}-${Math.random()}`,
                              name_vn: "",
                              name_en: "",
                              sort_order: (type.node_types?.length || 0) + 1,
                            },
                          ],
                        }
                      : type
                  ),
                }
              : skill
          ),
        });
      }
    },
    [formData]
  );

  const removeNodeType = useCallback(
    (
      skillType: "star" | "check",
      skillIndex: number,
      typeIndex: number,
      nodeIndex: number
    ) => {
      if (readOnly) return;
      if (skillType === "star") {
        setFormData({
          ...formData,
          star_skills: formData.star_skills.map((skill, i) =>
            i === skillIndex
              ? {
                  ...skill,
                  types: skill.types.map((type, ti) =>
                    ti === typeIndex
                      ? {
                          ...type,
                          node_types: (type.node_types || []).filter(
                            (_, ni) => ni !== nodeIndex
                          ),
                        }
                      : type
                  ),
                }
              : skill
          ),
        });
      } else {
        setFormData({
          ...formData,
          check_skills: formData.check_skills.map((skill, i) =>
            i === skillIndex
              ? {
                  ...skill,
                  types: skill.types.map((type, ti) =>
                    ti === typeIndex
                      ? {
                          ...type,
                          node_types: (type.node_types || []).filter(
                            (_, ni) => ni !== nodeIndex
                          ),
                        }
                      : type
                  ),
                }
              : skill
          ),
        });
      }
    },
    [formData]
  );

  const updateNodeType = useCallback(
    (
      skillType: "star" | "check",
      skillIndex: number,
      typeIndex: number,
      nodeIndex: number,
      field: "name_vn" | "name_en",
      value: string
    ) => {
      if (readOnly) return;
      if (skillType === "star") {
        setFormData({
          ...formData,
          star_skills: formData.star_skills.map((skill, i) =>
            i === skillIndex
              ? {
                  ...skill,
                  types: skill.types.map((type, ti) =>
                    ti === typeIndex
                      ? {
                          ...type,
                          node_types: (type.node_types || []).map((node, ni) =>
                            ni === nodeIndex
                              ? { ...node, [field]: value }
                              : node
                          ),
                        }
                      : type
                  ),
                }
              : skill
          ),
        });
      } else {
        setFormData({
          ...formData,
          check_skills: formData.check_skills.map((skill, i) =>
            i === skillIndex
              ? {
                  ...skill,
                  types: skill.types.map((type, ti) =>
                    ti === typeIndex
                      ? {
                          ...type,
                          node_types: (type.node_types || []).map((node, ni) =>
                            ni === nodeIndex
                              ? { ...node, [field]: value }
                              : node
                          ),
                        }
                      : type
                  ),
                }
              : skill
          ),
        });
      }
    },
    [formData]
  );

  // Hàm xử lý cấp 4 (node_types của node_types)
  const addLevel4NodeType = useCallback(
    (
      skillType: "star" | "check",
      skillIndex: number,
      typeIndex: number,
      nodeIndex: number
    ) => {
      if (readOnly) return;
      if (skillType === "star") {
        setFormData({
          ...formData,
          star_skills: formData.star_skills.map((skill, i) =>
            i === skillIndex
              ? {
                  ...skill,
                  types: skill.types.map((type, ti) =>
                    ti === typeIndex
                      ? {
                          ...type,
                          node_types: (type.node_types || []).map((node, ni) =>
                            ni === nodeIndex
                              ? {
                                  ...node,
                                  node_types: [
                                    ...(node.node_types || []),
                                    {
                                      id: `temp-${Date.now()}-${Math.random()}`,
                                      name_vn: "",
                                      name_en: "",
                                      sort_order:
                                        (node.node_types?.length || 0) + 1,
                                    },
                                  ],
                                }
                              : node
                          ),
                        }
                      : type
                  ),
                }
              : skill
          ),
        });
      } else {
        setFormData({
          ...formData,
          check_skills: formData.check_skills.map((skill, i) =>
            i === skillIndex
              ? {
                  ...skill,
                  types: skill.types.map((type, ti) =>
                    ti === typeIndex
                      ? {
                          ...type,
                          node_types: (type.node_types || []).map((node, ni) =>
                            ni === nodeIndex
                              ? {
                                  ...node,
                                  node_types: [
                                    ...(node.node_types || []),
                                    {
                                      id: `temp-${Date.now()}-${Math.random()}`,
                                      name_vn: "",
                                      name_en: "",
                                      sort_order:
                                        (node.node_types?.length || 0) + 1,
                                    },
                                  ],
                                }
                              : node
                          ),
                        }
                      : type
                  ),
                }
              : skill
          ),
        });
      }
    },
    [formData, readOnly]
  );

  const removeLevel4NodeType = useCallback(
    (
      skillType: "star" | "check",
      skillIndex: number,
      typeIndex: number,
      nodeIndex: number,
      level4Index: number
    ) => {
      if (readOnly) return;
      if (skillType === "star") {
        setFormData({
          ...formData,
          star_skills: formData.star_skills.map((skill, i) =>
            i === skillIndex
              ? {
                  ...skill,
                  types: skill.types.map((type, ti) =>
                    ti === typeIndex
                      ? {
                          ...type,
                          node_types: (type.node_types || []).map((node, ni) =>
                            ni === nodeIndex
                              ? {
                                  ...node,
                                  node_types: (node.node_types || []).filter(
                                    (_, l4i) => l4i !== level4Index
                                  ),
                                }
                              : node
                          ),
                        }
                      : type
                  ),
                }
              : skill
          ),
        });
      } else {
        setFormData({
          ...formData,
          check_skills: formData.check_skills.map((skill, i) =>
            i === skillIndex
              ? {
                  ...skill,
                  types: skill.types.map((type, ti) =>
                    ti === typeIndex
                      ? {
                          ...type,
                          node_types: (type.node_types || []).map((node, ni) =>
                            ni === nodeIndex
                              ? {
                                  ...node,
                                  node_types: (node.node_types || []).filter(
                                    (_, l4i) => l4i !== level4Index
                                  ),
                                }
                              : node
                          ),
                        }
                      : type
                  ),
                }
              : skill
          ),
        });
      }
    },
    [formData, readOnly]
  );

  const updateLevel4NodeType = useCallback(
    (
      skillType: "star" | "check",
      skillIndex: number,
      typeIndex: number,
      nodeIndex: number,
      level4Index: number,
      field: "name_vn" | "name_en",
      value: string
    ) => {
      if (readOnly) return;
      if (skillType === "star") {
        setFormData({
          ...formData,
          star_skills: formData.star_skills.map((skill, i) =>
            i === skillIndex
              ? {
                  ...skill,
                  types: skill.types.map((type, ti) =>
                    ti === typeIndex
                      ? {
                          ...type,
                          node_types: (type.node_types || []).map((node, ni) =>
                            ni === nodeIndex
                              ? {
                                  ...node,
                                  node_types: (node.node_types || []).map(
                                    (l4node, l4i) =>
                                      l4i === level4Index
                                        ? { ...l4node, [field]: value }
                                        : l4node
                                  ),
                                }
                              : node
                          ),
                        }
                      : type
                  ),
                }
              : skill
          ),
        });
      } else {
        setFormData({
          ...formData,
          check_skills: formData.check_skills.map((skill, i) =>
            i === skillIndex
              ? {
                  ...skill,
                  types: skill.types.map((type, ti) =>
                    ti === typeIndex
                      ? {
                          ...type,
                          node_types: (type.node_types || []).map((node, ni) =>
                            ni === nodeIndex
                              ? {
                                  ...node,
                                  node_types: (node.node_types || []).map(
                                    (l4node, l4i) =>
                                      l4i === level4Index
                                        ? { ...l4node, [field]: value }
                                        : l4node
                                  ),
                                }
                              : node
                          ),
                        }
                      : type
                  ),
                }
              : skill
          ),
        });
      }
    },
    [formData, readOnly]
  );

  // Helper functions to check if a node has value or has children with values
  const hasLevel4Value = (level4Node: { name_vn: string }) => {
    return level4Node.name_vn.trim() !== "";
  };

  const hasLevel3Value = (level3Node: {
    name_vn: string;
    node_types?: Array<{ name_vn: string }>;
  }) => {
    // Level 3 has value if itself has value OR has level 4 children with values
    if (level3Node.name_vn.trim() !== "") {
      return true;
    }
    return level3Node.node_types?.some((l4) => hasLevel4Value(l4)) ?? false;
  };

  const hasLevel2Value = (level2Type: {
    name_vn: string;
    node_types?: Array<{
      name_vn: string;
      node_types?: Array<{ name_vn: string }>;
    }>;
  }) => {
    // Level 2 has value if itself has value OR has level 3 children with values
    if (level2Type.name_vn.trim() !== "") {
      return true;
    }
    return level2Type.node_types?.some((l3) => hasLevel3Value(l3)) ?? false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (readOnly) {
      return;
    }

    if (!formData.name.trim()) {
      return;
    }

    if (!formData.subject_id) {
      return;
    }

    // Validate and clean data
    const cleanedData = {
      subject_id: parseInt(String(formData.subject_id)) || 0,
      name: formData.name.trim(),
      description: formData.description.trim(),
      max_star: formData.max_star,
      notes: formData.notes
        .filter((n) => n.text.trim() !== "")
        .map((n) => ({
          value: n.value,
          text: n.text.trim(),
          description: n.description?.trim() || "",
        })),
      star_skills: formData.star_skills
        .filter((s) => s.name_vn.trim() !== "")
        .map((s, skillIndex) => ({
          ...(s.id && { id: s.id }),
          name_vn: s.name_vn.trim(),
          name_en: s.name_en.trim(),
          description: s.description?.trim() || "",
          type: "star" as const,
          types: s.types
            .filter((t) => hasLevel2Value(t))
            .map((t, typeIndex) => ({
              ...(t.id && { id: t.id }),
              ...(t.skill_id && { skill_id: t.skill_id }),
              name_vn: t.name_vn.trim(),
              name_en: t.name_en.trim(),
              sort_order:
                t.sort_order !== undefined ? t.sort_order : typeIndex + 1,
              node_types: (t.node_types || [])
                .filter((n) => hasLevel3Value(n))
                .map((n, nodeIndex) => ({
                  ...(n.id && !n.id.startsWith("temp-") && { id: n.id }),
                  name_vn: n.name_vn.trim(),
                  name_en: n.name_en.trim(),
                  sort_order:
                    n.sort_order !== undefined ? n.sort_order : nodeIndex + 1,
                  node_types: (n.node_types || [])
                    .filter((l4n) => hasLevel4Value(l4n))
                    .map((l4n, l4Index) => ({
                      ...(l4n.id &&
                        !l4n.id.startsWith("temp-") && { id: l4n.id }),
                      name_vn: l4n.name_vn.trim(),
                      name_en: l4n.name_en.trim(),
                      sort_order:
                        l4n.sort_order !== undefined
                          ? l4n.sort_order
                          : l4Index + 1,
                    })),
                })),
            })),
        })),
      check_skills: formData.check_skills
        .filter((s) => s.name_vn.trim() !== "")
        .map((s, skillIndex) => ({
          ...(s.id && { id: s.id }),
          name_vn: s.name_vn.trim(),
          name_en: s.name_en.trim(),
          description: s.description?.trim() || "",
          type: "check" as const,
          types: s.types
            .filter((t) => hasLevel2Value(t))
            .map((t, typeIndex) => ({
              ...(t.id && { id: t.id }),
              ...(t.skill_id && { skill_id: t.skill_id }),
              name_vn: t.name_vn.trim(),
              name_en: t.name_en.trim(),
              sort_order:
                t.sort_order !== undefined ? t.sort_order : typeIndex + 1,
              node_types: (t.node_types || [])
                .filter((n) => hasLevel3Value(n))
                .map((n, nodeIndex) => ({
                  ...(n.id && !n.id.startsWith("temp-") && { id: n.id }),
                  name_vn: n.name_vn.trim(),
                  name_en: n.name_en.trim(),
                  sort_order:
                    n.sort_order !== undefined ? n.sort_order : nodeIndex + 1,
                  node_types: (n.node_types || [])
                    .filter((l4n) => hasLevel4Value(l4n))
                    .map((l4n, l4Index) => ({
                      ...(l4n.id &&
                        !l4n.id.startsWith("temp-") && { id: l4n.id }),
                      name_vn: l4n.name_vn.trim(),
                      name_en: l4n.name_en.trim(),
                      sort_order:
                        l4n.sort_order !== undefined
                          ? l4n.sort_order
                          : l4Index + 1,
                    })),
                })),
            })),
        })),
    };

    await onSubmit(cleanedData as CreateStudyReportCriteriaRequest);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("basicInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject_id">
                {t("subject")} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={String(formData.subject_id)}
                onValueChange={(value) => {
                  if (readOnly) return;
                  setFormData({ ...formData, subject_id: value });
                }}
                disabled={isDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectSubject")} />
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
              <Label htmlFor="max_star">
                {t("maxStar")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="max_star"
                type="number"
                min="1"
                max="10"
                value={formData.max_star}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_star: parseInt(e.target.value) || 5,
                  })
                }
                readOnly={readOnly}
                required
                disabled={isDisabled}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              {t("name")} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder={t("namePlaceholder")}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              readOnly={readOnly}
              required
              disabled={isDisabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("description")}</Label>
            <Textarea
              id="description"
              placeholder={t("descriptionPlaceholder")}
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              readOnly={readOnly}
              disabled={isDisabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg">{t("notes")}</CardTitle>
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addNote}
                disabled={
                  isDisabled || formData.notes.length >= formData.max_star
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("addNote")}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.notes.map((note, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                  <div className="md:col-span-1">
                    <Label>{t("value")}</Label>
                    <Input
                      type="number"
                      min="1"
                      max={formData.max_star}
                      value={note.value}
                      onChange={(e) =>
                        updateNote(
                          index,
                          "value",
                          parseInt(e.target.value) || 1
                        )
                      }
                      readOnly={readOnly}
                      disabled={isDisabled}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>{t("level")}</Label>
                    <Input
                      placeholder={t("noteTextPlaceholder")}
                      value={note.text}
                      onChange={(e) =>
                        updateNote(index, "text", e.target.value)
                      }
                      readOnly={readOnly}
                      disabled={isDisabled}
                    />
                  </div>
                  <div className="md:col-span-8">
                    <Label>{t("description")}</Label>
                    <Input
                      placeholder={t("noteDescriptionPlaceholder")}
                      value={note.description || ""}
                      onChange={(e) =>
                        updateNote(index, "description", e.target.value)
                      }
                      readOnly={readOnly}
                      disabled={isDisabled}
                    />
                  </div>
                  {!readOnly && (
                    <div className="md:col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeNote(index)}
                        disabled={isDisabled}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {formData.notes.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                {t("noNotes")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Star Skills Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-500" />
              {t("starSkills")}
            </CardTitle>
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addStarSkill}
                disabled={isDisabled}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("addSkill")}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.star_skills.map((skill, skillIndex) => (
              <Card key={skillIndex} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label>
                            {t("nameVn")}{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            placeholder={t("nameVnPlaceholder")}
                            value={skill.name_vn}
                            onChange={(e) =>
                              updateStarSkill(
                                skillIndex,
                                "name_vn",
                                e.target.value
                              )
                            }
                            readOnly={readOnly}
                            disabled={isDisabled}
                          />
                        </div>
                        <div>
                          <Label>{t("nameEn")}</Label>
                          <Input
                            placeholder={t("nameEnPlaceholder")}
                            value={skill.name_en}
                            onChange={(e) =>
                              updateStarSkill(
                                skillIndex,
                                "name_en",
                                e.target.value
                              )
                            }
                            readOnly={readOnly}
                            disabled={isDisabled}
                          />
                        </div>
                      </div>
                    </div>
                    {!readOnly && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStarSkill(skillIndex)}
                        disabled={isDisabled}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {!readOnly && (
                      <div className="flex items-center justify-between">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addSkillType("star", skillIndex)}
                          disabled={isDisabled}
                          className="w-full sm:w-auto justify-start"
                        >
                          <Plus className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{t("addSubCriteria")}</span>
                        </Button>
                      </div>
                    )}
                    <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                      {skill.types.map((type, typeIndex) => (
                        <div key={typeIndex} className="space-y-3">
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                              <div className="md:col-span-5">
                                <Input
                                  placeholder={t("nameVnPlaceholder")}
                                  value={type.name_vn}
                                  onChange={(e) =>
                                    updateSkillType(
                                      "star",
                                      skillIndex,
                                      typeIndex,
                                      "name_vn",
                                      e.target.value
                                    )
                                  }
                                  readOnly={readOnly}
                                  disabled={isDisabled}
                                />
                              </div>
                              <div className="md:col-span-6">
                                <Input
                                  placeholder={t("nameEnPlaceholder")}
                                  value={type.name_en}
                                  onChange={(e) =>
                                    updateSkillType(
                                      "star",
                                      skillIndex,
                                      typeIndex,
                                      "name_en",
                                      e.target.value
                                    )
                                  }
                                  readOnly={readOnly}
                                  disabled={isDisabled}
                                />
                              </div>
                              {!readOnly && (
                                <div className="md:col-span-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      removeSkillType(
                                        "star",
                                        skillIndex,
                                        typeIndex
                                      )
                                    }
                                    disabled={isDisabled}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Node Types (Level 3) */}
                          <div className="space-y-2 pl-4 border-l-2 border-gray-300">
                            {!readOnly && (
                              <div className="flex items-center justify-between">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    addNodeType("star", skillIndex, typeIndex)
                                  }
                                  disabled={isDisabled}
                                  className="text-xs w-full sm:w-auto justify-start"
                                >
                                  <Plus className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">{t("addNodeType")}</span>
                                </Button>
                              </div>
                            )}
                            <div className="space-y-2">
                              {(type.node_types || []).map(
                                (node, nodeIndex) => (
                                  <div key={nodeIndex} className="space-y-2">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
                                      <div className="md:col-span-5">
                                        <Input
                                          placeholder={t("nameVnPlaceholder")}
                                          value={node.name_vn}
                                          onChange={(e) =>
                                            updateNodeType(
                                              "star",
                                              skillIndex,
                                              typeIndex,
                                              nodeIndex,
                                              "name_vn",
                                              e.target.value
                                            )
                                          }
                                          readOnly={readOnly}
                                          disabled={isDisabled}
                                          className="text-sm"
                                        />
                                      </div>
                                      <div className="md:col-span-6">
                                        <Input
                                          placeholder={t("nameEnPlaceholder")}
                                          value={node.name_en}
                                          onChange={(e) =>
                                            updateNodeType(
                                              "star",
                                              skillIndex,
                                              typeIndex,
                                              nodeIndex,
                                              "name_en",
                                              e.target.value
                                            )
                                          }
                                          readOnly={readOnly}
                                          disabled={isDisabled}
                                          className="text-sm"
                                        />
                                      </div>
                                      {!readOnly && (
                                        <div className="md:col-span-1">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                              removeNodeType(
                                                "star",
                                                skillIndex,
                                                typeIndex,
                                                nodeIndex
                                              )
                                            }
                                            disabled={isDisabled}
                                            className="h-8 w-8"
                                          >
                                            <Trash2 className="h-3 w-3 text-red-500" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                    {/* Level 4 Node Types */}
                                    <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                                      {!readOnly && (
                                        <div className="flex items-center justify-between">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              addLevel4NodeType(
                                                "star",
                                                skillIndex,
                                                typeIndex,
                                                nodeIndex
                                              )
                                            }
                                            disabled={isDisabled}
                                            className="text-xs w-full sm:w-auto justify-start"
                                          >
                                            <Plus className="h-3 w-3 mr-1 flex-shrink-0" />
                                            <span className="truncate">
                                              {t("addLevel4NodeType")}
                                            </span>
                                          </Button>
                                        </div>
                                      )}
                                      <div className="space-y-2">
                                        {(node.node_types || []).map(
                                          (level4Node, level4Index) => (
                                            <div
                                              key={level4Index}
                                              className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start"
                                            >
                                              <div className="md:col-span-5">
                                                <Input
                                                  placeholder={t(
                                                    "nameVnPlaceholder"
                                                  )}
                                                  value={level4Node.name_vn}
                                                  onChange={(e) =>
                                                    updateLevel4NodeType(
                                                      "star",
                                                      skillIndex,
                                                      typeIndex,
                                                      nodeIndex,
                                                      level4Index,
                                                      "name_vn",
                                                      e.target.value
                                                    )
                                                  }
                                                  readOnly={readOnly}
                                                  disabled={isDisabled}
                                                  className="text-sm"
                                                />
                                              </div>
                                              <div className="md:col-span-6">
                                                <Input
                                                  placeholder={t(
                                                    "nameEnPlaceholder"
                                                  )}
                                                  value={level4Node.name_en}
                                                  onChange={(e) =>
                                                    updateLevel4NodeType(
                                                      "star",
                                                      skillIndex,
                                                      typeIndex,
                                                      nodeIndex,
                                                      level4Index,
                                                      "name_en",
                                                      e.target.value
                                                    )
                                                  }
                                                  readOnly={readOnly}
                                                  disabled={isDisabled}
                                                  className="text-sm"
                                                />
                                              </div>
                                              {!readOnly && (
                                                <div className="md:col-span-1">
                                                  <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                      removeLevel4NodeType(
                                                        "star",
                                                        skillIndex,
                                                        typeIndex,
                                                        nodeIndex,
                                                        level4Index
                                                      )
                                                    }
                                                    disabled={isDisabled}
                                                    className="h-8 w-8"
                                                  >
                                                    <Trash2 className="h-3 w-3 text-red-500" />
                                                  </Button>
                                                </div>
                                              )}
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {formData.star_skills.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                {t("noSkills")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Check Skills Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-green-500" />
              {t("checkSkills")}
            </CardTitle>
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCheckSkill}
                disabled={isDisabled}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("addSkill")}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.check_skills.map((skill, skillIndex) => (
              <Card key={skillIndex} className="border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label>
                            {t("nameVn")}{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            placeholder={t("nameVnPlaceholder")}
                            value={skill.name_vn}
                            onChange={(e) =>
                              updateCheckSkill(
                                skillIndex,
                                "name_vn",
                                e.target.value
                              )
                            }
                            readOnly={readOnly}
                            disabled={isDisabled}
                          />
                        </div>
                        <div>
                          <Label>{t("nameEn")}</Label>
                          <Input
                            placeholder={t("nameEnPlaceholder")}
                            value={skill.name_en}
                            onChange={(e) =>
                              updateCheckSkill(
                                skillIndex,
                                "name_en",
                                e.target.value
                              )
                            }
                            readOnly={readOnly}
                            disabled={isDisabled}
                          />
                        </div>
                      </div>
                    </div>
                    {!readOnly && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCheckSkill(skillIndex)}
                        disabled={isDisabled}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {!readOnly && (
                      <div className="flex items-center justify-between">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addSkillType("check", skillIndex)}
                          disabled={isDisabled}
                          className="w-full sm:w-auto justify-start"
                        >
                          <Plus className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{t("addSubCriteria")}</span>
                        </Button>
                      </div>
                    )}
                    <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                      {skill.types.map((type, typeIndex) => (
                        <div key={typeIndex} className="space-y-3">
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                              <div className="md:col-span-5">
                                <Input
                                  placeholder={t("nameVnPlaceholder")}
                                  value={type.name_vn}
                                  onChange={(e) =>
                                    updateSkillType(
                                      "check",
                                      skillIndex,
                                      typeIndex,
                                      "name_vn",
                                      e.target.value
                                    )
                                  }
                                  readOnly={readOnly}
                                  disabled={isDisabled}
                                />
                              </div>
                              <div className="md:col-span-6">
                                <Input
                                  placeholder={t("nameEnPlaceholder")}
                                  value={type.name_en}
                                  onChange={(e) =>
                                    updateSkillType(
                                      "check",
                                      skillIndex,
                                      typeIndex,
                                      "name_en",
                                      e.target.value
                                    )
                                  }
                                  readOnly={readOnly}
                                  disabled={isDisabled}
                                />
                              </div>
                              {!readOnly && (
                                <div className="md:col-span-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      removeSkillType(
                                        "check",
                                        skillIndex,
                                        typeIndex
                                      )
                                    }
                                    disabled={isDisabled}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Node Types (Level 3) */}
                          <div className="space-y-2 pl-4 border-l-2 border-gray-300">
                            {!readOnly && (
                              <div className="flex items-center justify-between">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    addNodeType("check", skillIndex, typeIndex)
                                  }
                                  disabled={isDisabled}
                                  className="text-xs w-full sm:w-auto justify-start"
                                >
                                  <Plus className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">{t("addNodeType")}</span>
                                </Button>
                              </div>
                            )}
                            <div className="space-y-2">
                              {(type.node_types || []).map(
                                (node, nodeIndex) => (
                                  <div key={nodeIndex} className="space-y-2">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
                                      <div className="md:col-span-5">
                                        <Input
                                          placeholder={t("nameVnPlaceholder")}
                                          value={node.name_vn}
                                          onChange={(e) =>
                                            updateNodeType(
                                              "check",
                                              skillIndex,
                                              typeIndex,
                                              nodeIndex,
                                              "name_vn",
                                              e.target.value
                                            )
                                          }
                                          readOnly={readOnly}
                                          disabled={isDisabled}
                                          className="text-sm"
                                        />
                                      </div>
                                      <div className="md:col-span-6">
                                        <Input
                                          placeholder={t("nameEnPlaceholder")}
                                          value={node.name_en}
                                          onChange={(e) =>
                                            updateNodeType(
                                              "check",
                                              skillIndex,
                                              typeIndex,
                                              nodeIndex,
                                              "name_en",
                                              e.target.value
                                            )
                                          }
                                          readOnly={readOnly}
                                          disabled={isDisabled}
                                          className="text-sm"
                                        />
                                      </div>
                                      {!readOnly && (
                                        <div className="md:col-span-1">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                              removeNodeType(
                                                "check",
                                                skillIndex,
                                                typeIndex,
                                                nodeIndex
                                              )
                                            }
                                            disabled={isDisabled}
                                            className="h-8 w-8"
                                          >
                                            <Trash2 className="h-3 w-3 text-red-500" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                    {/* Level 4 Node Types */}
                                    <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                                      {!readOnly && (
                                        <div className="flex items-center justify-between">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              addLevel4NodeType(
                                                "check",
                                                skillIndex,
                                                typeIndex,
                                                nodeIndex
                                              )
                                            }
                                            disabled={isDisabled}
                                            className="text-xs w-full sm:w-auto justify-start"
                                          >
                                            <Plus className="h-3 w-3 mr-1 flex-shrink-0" />
                                            <span className="truncate">
                                              {t("addLevel4NodeType")}
                                            </span>
                                          </Button>
                                        </div>
                                      )}
                                      <div className="space-y-2">
                                        {(node.node_types || []).map(
                                          (level4Node, level4Index) => (
                                            <div
                                              key={level4Index}
                                              className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start"
                                            >
                                              <div className="md:col-span-5">
                                                <Input
                                                  placeholder={t(
                                                    "nameVnPlaceholder"
                                                  )}
                                                  value={level4Node.name_vn}
                                                  onChange={(e) =>
                                                    updateLevel4NodeType(
                                                      "check",
                                                      skillIndex,
                                                      typeIndex,
                                                      nodeIndex,
                                                      level4Index,
                                                      "name_vn",
                                                      e.target.value
                                                    )
                                                  }
                                                  readOnly={readOnly}
                                                  disabled={isDisabled}
                                                  className="text-sm"
                                                />
                                              </div>
                                              <div className="md:col-span-6">
                                                <Input
                                                  placeholder={t(
                                                    "nameEnPlaceholder"
                                                  )}
                                                  value={level4Node.name_en}
                                                  onChange={(e) =>
                                                    updateLevel4NodeType(
                                                      "check",
                                                      skillIndex,
                                                      typeIndex,
                                                      nodeIndex,
                                                      level4Index,
                                                      "name_en",
                                                      e.target.value
                                                    )
                                                  }
                                                  readOnly={readOnly}
                                                  disabled={isDisabled}
                                                  className="text-sm"
                                                />
                                              </div>
                                              {!readOnly && (
                                                <div className="md:col-span-1">
                                                  <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                      removeLevel4NodeType(
                                                        "check",
                                                        skillIndex,
                                                        typeIndex,
                                                        nodeIndex,
                                                        level4Index
                                                      )
                                                    }
                                                    disabled={isDisabled}
                                                    className="h-8 w-8"
                                                  >
                                                    <Trash2 className="h-3 w-3 text-red-500" />
                                                  </Button>
                                                </div>
                                              )}
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {formData.check_skills.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                {t("noSkills")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      {!readOnly && (
        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="submit"
            className="bg-enspire-green text-white hover:bg-opacity-90"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? tCommon("loading")
              : submitButtonText || tCommon("save")}
          </Button>
        </div>
      )}
    </form>
  );
}
