import { useQuery } from "@tanstack/react-query";
import { GetHomeworkList, HomeworkFilters } from "@/lib/api/homeworks";

// Update the HomeworkFilters type if needed in the API file
export function useHomeworksQuery(filters: HomeworkFilters & { page?: number, limit?: number }) {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  
  return useQuery({
    queryKey: ["homeworks", { ...filters, page, limit }],
    queryFn: () => GetHomeworkList({ ...filters, page, limit }),
    staleTime: 1000 * 60 * 2, // 2 minutes
    placeholderData: (previousData) => previousData,
  });
}
