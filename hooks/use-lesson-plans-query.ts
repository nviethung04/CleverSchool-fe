import { useQuery } from '@tanstack/react-query';
import { getLessonPlans } from '@/lib/api/lectures';

export function useLessonPlansQuery(params: { search?: string, page?: number, limit?: number }) {
  const page = params.page || 1;
  const limit = params.limit || 10;
  
  return useQuery({
    queryKey: ['lessonPlans', params],
    queryFn: async () => {
      const data = await getLessonPlans({ 
        search: params.search || '', 
        page, 
        limit 
      });
      return data;
    },
    placeholderData: (previousData) => previousData,
  });
}
