import { useQuery } from "@tanstack/react-query";
import { GetExamList, ExamFilters } from "@/lib/api/exams";

// Update the ExamFilters type if needed in the API file
export function useExamsQuery(filters: ExamFilters & { page?: number, limit?: number }) {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  
  return useQuery({
    queryKey: ["exams", { ...filters, page, limit }],
    queryFn: () => GetExamList({ ...filters, page, limit }),
    staleTime: 1000 * 60 * 2, // 2 minutes
    placeholderData: (previousData) => previousData,
  });
}
