import { useQuery } from "@tanstack/react-query";
import { GetExamList, ExamFilters } from "@/lib/api/exams";

type ExamQueryFilters = ExamFilters & {
  page?: number;
  limit?: number;
  enabled?: boolean;
};

export function useExamsQuery(filters: ExamQueryFilters) {
  const { enabled = true, ...listFilters } = filters;
  const page = listFilters.page || 1;
  const limit = listFilters.limit || 10;

  return useQuery({
    queryKey: ["exams", { ...listFilters, page, limit }],
    queryFn: () => GetExamList({ ...listFilters, page, limit }),
    enabled,
    staleTime: 1000 * 60 * 2,
    placeholderData: (previousData) => previousData,
  });
}
