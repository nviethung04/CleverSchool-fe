"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getNoticeById, pushNotice } from "@/lib/api/notices";
import { GetSchoolList } from "@/lib/api/schools";
import { GetCourseList } from "@/lib/api/courses";
import { GetClassList } from "@/lib/api/classes";
import { GetUserListAdvanced } from "@/lib/api/users";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { ArrowLeft, Send } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type NoticeType = "system" | "school" | "course" | "class" | "user";

interface Notice {
    id: string;
    title: string;
    description: string;
    cover: string;
    content: string;
}

export default function SendNoticePage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const noticeId = params?.id as string;

    const [notice, setNotice] = useState<Notice | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Form state
    const [noticeType, setNoticeType] = useState<NoticeType>("system");
    const [schools, setSchools] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);

    const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
    const [selectedCourseId, setSelectedCourseId] = useState<string>("");
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [selectedStudentId, setSelectedStudentId] = useState<string>("");

    // Confirmation dialog
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        fetchNotice();
        fetchSchools();
    }, [noticeId]);

    const fetchNotice = async () => {
        try {
            setLoading(true);
            const response = await getNoticeById(noticeId);

            // Check different possible response structures
            if (response.code === 200) {
                // Try response.data.notice first
                if (response.data?.notice) {
                    setNotice(response.data.notice);
                }
                // Try response.data directly (might be the notice object itself)
                else if (response.data) {
                    setNotice(response.data);
                }
            }
        } catch (error) {
            console.error("Error fetching notice:", error);
            toast({
                title: "Lỗi",
                description: "Không thể tải thông tin thông báo",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchSchools = async () => {
        try {
            const response = await GetSchoolList({});
            if (response.code === 200 && response.data?.schools) {
                setSchools(response.data.schools);
            }
        } catch (error) {
            console.error("Error fetching schools:", error);
        }
    };

    const fetchCourses = async (schoolId: string) => {
        try {
            const response = await GetCourseList({ school_id: schoolId });
            if (response.code === 200 && response.data?.courses) {
                setCourses(response.data.courses);
            }
        } catch (error) {
            console.error("Error fetching courses:", error);
            setCourses([]);
        }
    };

    const fetchClasses = async (schoolId: string) => {
        try {
            const response = await GetClassList(schoolId);
            if (response.code === 200 && response.data?.classes) {
                setClasses(response.data.classes);
            }
        } catch (error) {
            console.error("Error fetching classes:", error);
            setClasses([]);
        }
    };

    const fetchStudents = async (classId: string) => {
        try {
            const response = await GetUserListAdvanced({
                role_id: 3, // 3 = student role
                class_id: classId,
                school_id: selectedSchoolId,
            });
            if (response.code === 200 && response.data?.users) {
                setStudents(response.data.users);
            }
        } catch (error) {
            console.error("Error fetching students:", error);
            setStudents([]);
        }
    };

    // Handle type change
    const handleTypeChange = (type: NoticeType) => {
        setNoticeType(type);
        // Reset selections
        setSelectedSchoolId("");
        setSelectedCourseId("");
        setSelectedClassId("");
        setSelectedStudentId("");
        setCourses([]);
        setClasses([]);
        setStudents([]);
    };

    // Handle school selection
    const handleSchoolChange = (schoolId: string) => {
        setSelectedSchoolId(schoolId);
        setSelectedCourseId("");
        setSelectedClassId("");
        setSelectedStudentId("");
        setCourses([]);
        setClasses([]);
        setStudents([]);

        if (noticeType === "course") {
            fetchCourses(schoolId);
        } else if (noticeType === "class" || noticeType === "user") {
            fetchClasses(schoolId);
        }
    };

    // Handle class selection
    const handleClassChange = (classId: string) => {
        setSelectedClassId(classId);
        setSelectedStudentId("");
        setStudents([]);

        if (noticeType === "user") {
            fetchStudents(classId);
        }
    };

    // Validate form
    const isFormValid = () => {
        switch (noticeType) {
            case "system":
                return true;
            case "school":
                return selectedSchoolId !== "";
            case "course":
                return selectedSchoolId !== "" && selectedCourseId !== "";
            case "class":
                return selectedSchoolId !== "" && selectedClassId !== "";
            case "user":
                return selectedSchoolId !== "" && selectedClassId !== "" && selectedStudentId !== "";
            default:
                return false;
        }
    };

    // Get confirmation message
    const getConfirmationMessage = () => {
        const noticeTitle = notice?.title || "";
        switch (noticeType) {
            case "system":
                return `Bạn có chắc chắn muốn gửi thông báo "${noticeTitle}" đến toàn hệ thống?`;
            case "school": {
                const school = schools.find((s) => s.id === selectedSchoolId);
                return `Bạn có chắc chắn muốn gửi thông báo "${noticeTitle}" đến trường "${school?.name}"?`;
            }
            case "course": {
                const course = courses.find((c) => c.id === selectedCourseId);
                return `Bạn có chắc chắn muốn gửi thông báo "${noticeTitle}" đến khóa học "${course?.name}"?`;
            }
            case "class": {
                const classItem = classes.find((c) => c.id === selectedClassId);
                return `Bạn có chắc chắn muốn gửi thông báo "${noticeTitle}" đến lớp học "${classItem?.name}"?`;
            }
            case "user": {
                const student = students.find((s) => s.id === selectedStudentId);
                return `Bạn có chắc chắn muốn gửi thông báo "${noticeTitle}" đến học sinh "${student?.fullname || student?.username}"?`;
            }
            default:
                return "";
        }
    };

    // Handle send
    const handleSend = async () => {
        if (!isFormValid()) {
            toast({
                title: "Lỗi",
                description: "Vui lòng điền đầy đủ thông tin",
                variant: "destructive",
            });
            return;
        }

        try {
            setSending(true);
            let value = 1; // Default for system

            switch (noticeType) {
                case "school":
                    value = parseInt(selectedSchoolId);
                    break;
                case "course":
                    value = parseInt(selectedCourseId);
                    break;
                case "class":
                    value = parseInt(selectedClassId);
                    break;
                case "user":
                    value = parseInt(selectedStudentId);
                    break;
            }

            await pushNotice(noticeId, noticeType, value);

            toast({
                title: "Thành công",
                description: "Đã gửi thông báo thành công",
            });

            // Redirect back to notices list
            router.push("../");
        } catch (error) {
            console.error("Error sending notice:", error);
            toast({
                title: "Lỗi",
                description: "Không thể gửi thông báo. Vui lòng thử lại.",
                variant: "destructive",
            });
        } finally {
            setSending(false);
            setShowConfirm(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Đang tải...</div>
            </div>
        );
    }

    if (!notice) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="text-lg mb-4">Không tìm thấy thông báo</div>
                <Button onClick={() => router.push("../")}>Quay lại</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-6 flex-wrap-reverse gap-3">
                <h1 className="text-3xl font-bold">Gửi thông báo</h1>
                <Button
                    variant="outline"
                    onClick={() => router.push("../")}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Quay lại
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">

                {/* Notice Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h2 className="text-xl font-semibold mb-2">{notice.title}</h2>
                    {notice.description && (
                        <p className="text-gray-600 mb-3">{notice.description}</p>
                    )}
                    {notice.cover && (
                        <div className="relative w-full h-48 rounded overflow-hidden border">
                            <Image
                                src={notice.cover}
                                alt={notice.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}
                </div>

                {/* Type Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold mb-3">
                        Chọn loại thông báo:
                    </label>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { value: "system", label: "Toàn hệ thống" },
                            { value: "school", label: "Trường học" },
                            { value: "course", label: "Khóa học" },
                            { value: "class", label: "Lớp học" },
                            { value: "user", label: "Cá nhân" },
                        ].map((type) => (
                            <Button
                                key={type.value}
                                variant={noticeType === type.value ? "default" : "outline"}
                                onClick={() => handleTypeChange(type.value as NoticeType)}
                            >
                                {type.label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Dynamic Selects based on type */}
                <div className="space-y-4">
                    {/* School Selection (for school, course, class, user) */}
                    {(noticeType === "school" ||
                        noticeType === "course" ||
                        noticeType === "class" ||
                        noticeType === "user") && (
                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    Chọn trường học:
                                </label>
                                <Select value={selectedSchoolId} onValueChange={handleSchoolChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn trường học" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {schools.map((school) => (
                                            <SelectItem key={school.id} value={school.id}>
                                                {school.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                    {/* Course Selection */}
                    {noticeType === "course" && selectedSchoolId && (
                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                Chọn khóa học:
                            </label>
                            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn khóa học" />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map((course) => (
                                        <SelectItem key={course.id} value={course.id}>
                                            {course.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Class Selection */}
                    {(noticeType === "class" || noticeType === "user") && selectedSchoolId && (
                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                Chọn lớp học:
                            </label>
                            <Select value={selectedClassId} onValueChange={handleClassChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn lớp học" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map((classItem) => (
                                        <SelectItem key={classItem.id} value={classItem.id}>
                                            {classItem.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Student Selection */}
                    {noticeType === "user" && selectedClassId && (
                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                Chọn học sinh:
                            </label>
                            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn học sinh" />
                                </SelectTrigger>
                                <SelectContent>
                                    {students.map((student) => (
                                        <SelectItem key={student.id} value={student.id}>
                                            {student.fullname || student.username}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {/* Send Button */}
                <div className="mt-8 flex justify-end">
                    <Button
                        onClick={() => setShowConfirm(true)}
                        disabled={!isFormValid() || sending}
                        className="flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        {sending ? "Đang gửi..." : "Gửi thông báo"}
                    </Button>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận gửi thông báo</AlertDialogTitle>
                        <AlertDialogDescription>
                            {getConfirmationMessage()}
                            <br />
                            <br />
                            Vui lòng kiểm tra lại thông tin trước khi gửi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSend}>
                            Đồng ý gửi
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
