"use client";

import { CustomSelect } from "@/components/question-editor/custom-select";
import type { QuestionAttributeNode } from "@/lib/api/questions";

type Option = { value: string; label: string };

interface QuestionMetadataFieldsProps {
  subjectLabel: string;
  selectSubjectPlaceholder: string;
  selectSkillPlaceholder: string;
  selectLevelPlaceholder: string;
  selectCognitionPlaceholder: string;
  loadingAttributesText: string;
  attributesNotLoadedText: string;
  subjectOptions: Option[];
  selectedSubjectId: string;
  onSubjectChange: (value: string) => void;
  attributesLoading: boolean;
  attributesCount: number;
  skillAttr?: QuestionAttributeNode;
  levelAttr?: QuestionAttributeNode;
  cognitionAttr?: QuestionAttributeNode;
  selectedSkillId: string;
  onSkillChange: (value: string) => void;
  selectedLevelId: string;
  onLevelChange: (value: string) => void;
  selectedCognitionId: string;
  onCognitionChange: (value: string) => void;
  toNodeOptions: (nodes?: QuestionAttributeNode[]) => Option[];
}

function FieldLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label}
      {required ? <span className="text-red-500 ml-0.5">*</span> : null}
    </label>
  );
}

export function QuestionMetadataFields({
  subjectLabel,
  selectSubjectPlaceholder,
  selectSkillPlaceholder,
  selectLevelPlaceholder,
  selectCognitionPlaceholder,
  loadingAttributesText,
  attributesNotLoadedText,
  subjectOptions,
  selectedSubjectId,
  onSubjectChange,
  attributesLoading,
  attributesCount,
  skillAttr,
  levelAttr,
  cognitionAttr,
  selectedSkillId,
  onSkillChange,
  selectedLevelId,
  onLevelChange,
  selectedCognitionId,
  onCognitionChange,
  toNodeOptions,
}: QuestionMetadataFieldsProps) {
  const showAttributesHint =
    selectedSubjectId && !attributesLoading && attributesCount === 0;

  return (
    <div className="mb-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <FieldLabel label={subjectLabel} required />
          <CustomSelect
            options={subjectOptions}
            value={selectedSubjectId}
            onValueChange={onSubjectChange}
            placeholder={selectSubjectPlaceholder}
            className="w-full"
          />
        </div>

        {skillAttr && skillAttr.nodes?.length > 0 && (
          <div>
            <FieldLabel label={skillAttr.name} required />
            <CustomSelect
              options={toNodeOptions(skillAttr.nodes)}
              value={selectedSkillId}
              onValueChange={onSkillChange}
              placeholder={selectSkillPlaceholder}
              className="w-full"
            />
          </div>
        )}

        {levelAttr && levelAttr.nodes?.length > 0 && (
          <div>
            <FieldLabel label={levelAttr.name} required />
            <CustomSelect
              options={toNodeOptions(levelAttr.nodes)}
              value={selectedLevelId}
              onValueChange={onLevelChange}
              placeholder={selectLevelPlaceholder}
              className="w-full"
            />
          </div>
        )}

        {cognitionAttr && cognitionAttr.nodes?.length > 0 && (
          <div>
            <FieldLabel label={cognitionAttr.name} required />
            <CustomSelect
              options={toNodeOptions(cognitionAttr.nodes)}
              value={selectedCognitionId}
              onValueChange={onCognitionChange}
              placeholder={selectCognitionPlaceholder}
              className="w-full"
            />
          </div>
        )}
      </div>

      {attributesLoading && (
        <p className="text-sm text-gray-500">{loadingAttributesText}</p>
      )}
      {showAttributesHint && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {attributesNotLoadedText}
        </p>
      )}
    </div>
  );
}
