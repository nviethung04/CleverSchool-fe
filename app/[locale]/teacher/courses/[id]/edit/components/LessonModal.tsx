import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LessonForm } from "@/components/lesson-form";
import { GetLessons } from "@/lib/api/lessons";
import { useDebounce } from "@/hooks/use-debounce";
import { 
  Loader2, 
  Search,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import type { Lesson } from "@/lib/api/lessons";

interface LessonModalProps {
  open: boolean;
  onSelect: (lesson: Lesson) => void;
  onClose: () => void;
  chapterId: string;
}

export default function LessonModal({ open, onSelect, onClose, chapterId }: LessonModalProps) {
  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Pagination và filter states
  const [allLessons, setAllLessons] = useState<Lesson[]>([]); // Tất cả lessons từ API
  const [lessonBank, setLessonBank] = useState<Lesson[]>([]); // Lessons sau khi filter client-side
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<"all" | "has_chapter" | "no_chapter">("all");
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [totalItems, setTotalItems] = useState(0);
  const [perPage] = useState(20);
  const debouncedKeyword = useDebounce(keyword, 500);

  // Load lessons with pagination
  const fetchLessons = async (page: number = 1, resetData: boolean = false) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        per_page: perPage,
      };
      if (debouncedKeyword) params.keyword = debouncedKeyword;
      
      const res = await GetLessons(params);
      if (res.code === 200 && res.data) {
        let newLessons = res.data.lessons || [];
        
        // Apply sorting
        newLessons = newLessons.sort((a: any, b: any) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
        
        if (resetData || page === 1) {
          setAllLessons(newLessons);
        } else {
          // Load more - append to existing
          setAllLessons(prev => [...prev, ...newLessons]);
        }
        
        setTotalItems(res.data.total || newLessons.length);
        setCurrentPage(res.data.current_page || page);
        setHasNextPage(newLessons.length === perPage);
      }
    } catch (err) {
      console.error("Error fetching lessons:", err);
    } finally {
      setLoading(false);
    }
  };

  // Apply client-side filtering whenever allLessons or filter changes
  const applyClientSideFilter = () => {
    let filteredLessons = [...allLessons];
    
    if (filter === "has_chapter") {
      filteredLessons = filteredLessons.filter((l: any) => l.chapter && l.chapter.id !== "0" && l.chapter.id !== 0);
    } else if (filter === "no_chapter") {
      filteredLessons = filteredLessons.filter((l: any) => !l.chapter || l.chapter.id === "0" || l.chapter.id === 0);
    }
    
    setLessonBank(filteredLessons);
  };

  // Load lessons when modal opens or search/sort changes (not filter)
  useEffect(() => {
    if (open) {
      setCurrentPage(1);
      fetchLessons(1, true);
    } else {
      // Clear data and reset filters when modal closes
      setAllLessons([]);
      setLessonBank([]);
      setKeyword("");
      setFilter("all");
      setSortOrder("desc");
      setCurrentPage(1);
      setHasNextPage(false);
      setTotalItems(0);
    }
  }, [open, debouncedKeyword, sortOrder]);

  // Apply client-side filtering when allLessons or filter changes
  useEffect(() => {
    applyClientSideFilter();
  }, [allLessons, filter]);

  // Lọc chỉ hiển thị các bài học chưa được gắn vào chương nào hoặc đã có chapter
  const categorizedLessons = lessonBank.map(lesson => ({
    ...lesson,
    isAssigned: lesson.chapter && lesson.chapter.id !== 0 && lesson.chapter.id !== "" && lesson.chapter.title !== "",
    isDisabled: lesson.chapter && lesson.chapter.id !== 0 && lesson.chapter.id !== "" && lesson.chapter.title !== ""
  }));

  const handleLoadMore = () => {
    if (hasNextPage && !loading) {
      fetchLessons(currentPage + 1, false);
    }
  };

  return open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col relative">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900">Chọn bài học cho chương</h3>
          <Button
            variant="outline"
            onClick={() => setShowCreateLesson(true)}
            className="border-gray-200 rounded-xl px-6 hover:bg-gray-50"
          >
            Tạo bài học mới
          </Button>
        </div>

        {/* Search and Filter Controls */}
        <div className="p-4 border-b border-gray-100 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm bài học..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-10 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          {/* Filter and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Filter Dropdown */}
            <div className="relative flex-1">
              <select
                className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-blue-500 text-sm appearance-none pr-8"
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
              >
                <option value="all">Tất cả bài học</option>
                <option value="no_chapter">Chưa gắn khóa học</option>
                <option value="has_chapter">Đã gắn khóa học</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative flex-1">
              <select
                className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-blue-500 text-sm appearance-none pr-8"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
              >
                <option value="desc">Mới nhất</option>
                <option value="asc">Cũ nhất</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Lessons List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && currentPage === 1 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Đang tải bài học...</span>
            </div>
          ) : categorizedLessons.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">
                {debouncedKeyword ? "Không tìm thấy bài học nào" : "Không có bài học nào"}
              </div>
              <div className="text-gray-500 text-sm mb-4">
                {debouncedKeyword ? "Thử tìm kiếm với từ khóa khác" : "Hãy tạo bài học mới hoặc kiểm tra lại"}
              </div>
              <Button
                onClick={() => setShowCreateLesson(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
              >
                Tạo bài học mới
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {categorizedLessons.map(lesson => (
                <div 
                  key={lesson.id} 
                  className={`flex items-center justify-between p-4 border rounded-xl transition-colors ${
                    lesson.isDisabled 
                      ? 'border-gray-200 bg-gray-50 opacity-60' 
                      : 'border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`font-semibold ${lesson.isDisabled ? 'text-gray-500' : 'text-gray-900'}`}>
                        {lesson.title}
                      </div>
                      {lesson.isAssigned && (
                        <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                          Đã gắn vào chương khác
                        </span>
                      )}
                    </div>
                    {lesson.description && (
                      <div className={`text-sm line-clamp-2 ${lesson.isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>
                        {lesson.description}
                      </div>
                    )}
                    {lesson.chapter && lesson.chapter.title && (
                      <div className="text-xs text-gray-400 mt-1">
                        Chương: {lesson.chapter.title}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => onSelect(lesson)}
                    disabled={lesson.isDisabled}
                    className={`ml-4 rounded-xl px-6 ${
                      lesson.isDisabled 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {lesson.isDisabled ? 'Đã gắn' : 'Thêm'}
                  </Button>
                </div>
              ))}
              
              {/* Load More Button */}
              {hasNextPage && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleLoadMore}
                    disabled={loading}
                    variant="outline"
                    className="border-gray-200 rounded-xl px-6 hover:bg-gray-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Đang tải...
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-4 w-4 mr-2" />
                        Tải thêm bài học
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            {categorizedLessons.length > 0 && (
              <>Hiển thị {categorizedLessons.length} / {allLessons.length} bài học{filter !== "all" && " (đã lọc)"}</>
            )}
          </div>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-200 rounded-xl px-6 hover:bg-gray-50"
          >
            Đóng
          </Button>
        </div>

        {/* Create Lesson Modal */}
        {showCreateLesson && (
          <div className="fixed inset-0 z-10 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-[90vw] h-[90vh] max-w-[1600px] relative flex flex-col">
              <div className="absolute top-4 right-4 z-10">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowCreateLesson(false)}
                  className="rounded-full hover:bg-gray-100"
                >
                  ×
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <LessonForm
                  mode="create"
                  hideSidebar
                  onCancel={() => setShowCreateLesson(false)}
                  onSuccess={async (res) => {
                    // res là object trả về từ API, lấy res.data là lesson vừa tạo
                    if (res && res.data) {
                      onSelect(res.data);
                    }
                    setShowCreateLesson(false);
                    onClose();
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  ) : null;
}
