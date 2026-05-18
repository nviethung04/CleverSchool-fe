"use client"

import type React from "react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Link } from "@/lib/i18n/routing"
import { LucidePlus, Edit, Trash2, Search, Info, ChevronLeft, ChevronRight } from "lucide-react"
import ExportData from "@/components/ui/export-data"
import ImportData from "@/components/ui/import-data"
import { exportSchool, importSchool } from "@/lib/api/export-import"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useState, useMemo, memo, useCallback } from "react"
import { useParams } from "next/navigation"

// Simple Toast Component for testing
const SimpleToaster = () => {
    const [toasts, setToasts] = useState<any[]>([])

    useEffect(() => {
        // Listen for toast events
        const handleToast = (event: any) => {
            const newToast = {
                id: Date.now(),
                title: event.detail?.title || 'Notification',
                description: event.detail?.description || '',
                variant: event.detail?.variant || 'default'
            }
            setToasts(prev => [...prev, newToast])

            // Auto remove after 5 seconds
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== newToast.id))
            }, 5000)
        }

        window.addEventListener('show-toast', handleToast)
        return () => window.removeEventListener('show-toast', handleToast)
    }, [])

    return (
        <div className="fixed top-4 right-4 z-[9999] space-y-2">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`p-4 rounded-lg shadow-lg border min-w-[300px] ${toast.variant === 'destructive'
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : 'bg-green-50 border-green-200 text-green-800'
                        }`}
                >
                    <div className="font-semibold">{toast.title}</div>
                    <div className="text-sm">{toast.description}</div>
                </div>
            ))}
        </div>
    )
}

import { GetSchoolList, DeleteSchool, CreateSchool, UpdateSchool, GetSchoolDetail } from "@/lib/api/schools"
import SchoolDialogModal from "@/app/[locale]/admin/schools/modal"
import { GetProvinceList } from "@/lib/api/provinces"
import { GetWardList } from "@/lib/api/wards"
import { debounce } from "lodash"
import { useToast } from "@/hooks/use-toast"
import Loading from "@/app/loading"
import { useQueryString } from "@/hooks/use-query-string"
import { sortAlphabetGeneric } from "@/lib/utils"

// School data interface
interface SchoolFormData {
    id: string
    name: string
    short_name: string
    parent_school: string
    type: string
    ward_code: string // Changed from district_code
    ward_name: string // Changed from district_name
    province_name: string
    province_code: string
    address_vn: string
    address_en: string
    contact_name: string
    contact_phone: string
    contact_mail: string
    programs_of_course: boolean
    close_status: boolean
    is_seamless_school: boolean
    created_at: string
    updated_at: string
    status: boolean
    logo?: string
    student_count?: number
    class_count?: number
}

// Helper function to check status
function isActiveStatus(status: string | boolean | undefined): boolean {
    if (typeof status === "boolean") {
        return status
    }
    if (typeof status === "string") {
        return status === "true" || status === "1"
    }
    return false
}

// Cache layer
const apiCache = new Map()

const getCachedData = async (key: string, fetcher: () => Promise<any>) => {
    if (apiCache.has(key)) {
        const cached = apiCache.get(key)
        if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
            // 5 minutes
            return cached.data
        }
    }

    const data = await fetcher()
    apiCache.set(key, { data, timestamp: Date.now() })
    return data
}

// Helper function to handle errors safely
function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message
    }
    if (typeof error === "object" && error !== null && "response" in error) {
        const apiError = error as any
        if (apiError.response?.data?.message) {
            return apiError.response.data.message
        }
    }
    return String(error)
}

export default function SchoolPage() {
    const t = useTranslations("schools")
    const params = useParams()
    const locale = params?.locale as string
    const [schools, setSchools] = useState<any[]>([])
    const [page, setPage] = useState<number>(1)
    const [showSchoolDialog, setShowSchoolDialog] = useState(false)
    const [selectedSchool, setSelectedSchool] = useState<any | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedType, setSelectedType] = useState("all") // Default to "all"
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoadingSchoolDetail, setIsLoadingSchoolDetail] = useState(false)
    const [totalSchoolsCount, setTotalSchoolsCount] = useState(0) // New state for total count

    const [formData, setFormData] = useState<SchoolFormData>({
        id: "",
        name: "",
        short_name: "",
        parent_school: "",
        type: "",
        ward_code: "", // Changed from district_code
        ward_name: "", // Changed from district_name
        province_name: "",
        province_code: "",
        address_vn: "",
        address_en: "",
        contact_name: "",
        contact_phone: "",
        contact_mail: "",
        programs_of_course: false,
        close_status: false,
        is_seamless_school: false,
        created_at: "",
        updated_at: "",
        status: true,
        student_count: 0,
        class_count: 0,
    })

    const pageSize = 10

    // Filter states for province and ward
    const [filterProvince, setFilterProvince] = useState("all")
    const [filterWard, setFilterWard] = useState("all")
    const [filterProvinces, setFilterProvinces] = useState<any[]>([])
    const [filterWards, setFilterWards] = useState<any[]>([])
    const [filterStatus, setFilterStatus] = useState("all") // New filter for status
    const [sortId, setSortId] = useState<"asc" | "desc" | "none">("none") // New sort for id
    const [sortCreatedAt, setSortCreatedAt] = useState<"newest" | "oldest" | "">("newest") // New sort for created_at

    const { toast } = useToast()

    // Custom toast function for testing
    const showToast = (options: { title: string; description: string; variant?: string }) => {
        // Try original toast first
        const result = toast(options as { title: string; description: string; variant?: "default" | "destructive" | null | undefined  })

        // Also dispatch custom event as fallback
        window.dispatchEvent(new CustomEvent('show-toast', { detail: options }))

        return result
    }

    // Load schools based on filters and pagination
    const getSchoolList = useCallback(async () => {
        try {
            const params: {
                province_code?: string
                ward_code?: string
                name?: string
                type?: string
                status?: string
                sort_id?: "asc" | "desc"
                sort_created_at?: "newest" | "oldest"
                limit?: number
                page?: number
            } = {
                limit: pageSize,
                page: page,
            }

            if (searchTerm) params.name = searchTerm
            if (selectedType !== "all") params.type = selectedType
            if (filterProvince !== "all") params.province_code = filterProvince
            if (filterWard !== "all") params.ward_code = filterWard // Changed from district_code
            if (filterStatus !== "all") params.status = filterStatus === "true" ? "1" : "0" // Convert boolean string to "1" or "0"

            if (sortId && sortId !== "none") params.sort_id = sortId
            if (sortCreatedAt) params.sort_created_at = sortCreatedAt

            const listResponse = await GetSchoolList(params)
            const schoolsData = listResponse.data.schools || []
            const totalCount = listResponse.data.total_count || 0 // Assuming API returns total_count

            setSchools(schoolsData)
            setTotalSchoolsCount(totalCount)
        } catch (err) {
            console.error("Failed to get school list", err)
            setSchools([])
            setTotalSchoolsCount(0)
        }
    }, [searchTerm, selectedType, filterProvince, filterWard, filterStatus, sortId, sortCreatedAt, page, pageSize])

    // Trigger school list fetch when filters or pagination change
    useEffect(() => {
        getSchoolList()
    }, [getSchoolList])

    // Load provinces and wards for filters
    useEffect(() => {
        const fetchData = async () => {
            try {
                const provincesRes = await getCachedData("provinces", () => GetProvinceList())
                if (provincesRes?.data?.provinces) {
                    setFilterProvinces(provincesRes.data.provinces)
                }
            } catch (err) {
                console.error("Error loading provinces:", err)
                setFilterProvinces([])
            }
        }
        fetchData()
    }, [])

    // Load wards when province filter changes
    useEffect(() => {
        if (filterProvince === "all") {
            setFilterWards([])
            return
        }

        const fetchWardsForProvince = async () => {
            try {
                const wardsRes = await getCachedData(`wards_${filterProvince}`, () => GetWardList(filterProvince))
                if (wardsRes?.data) {
                    const wards = wardsRes.data.wards || []
                    setFilterWards(wards)
                }
            } catch (err) {
                console.error("Error loading wards:", err)
                setFilterWards([])
            }
        }
        fetchWardsForProvince()
    }, [filterProvince])

    // Delete school function
    const handleDeleteSchool = useCallback(
        async (schoolId: string) => {
            if (!confirm(t("confirmDelete"))) return

            try {
                await DeleteSchool(schoolId)

                // Show toast notification
                const toastResult = showToast({
                    title: "Thành công",
                    description: "Xóa trường học thành công!",
                })

                // Refresh list after deletion
                getSchoolList()
            } catch (err) {
                console.error("Failed to delete school", err)
                toast({
                    title: t("error"),
                    description: getErrorMessage(err) || t("deleteError"),
                    variant: "destructive",
                })
            }
        },
        [getSchoolList, t, toast],
    )

    const openCreateSchool = () => {
        setSelectedSchool(null)
        setFormData({
            id: "",
            name: "",
            short_name: "",
            parent_school: "",
            type: "",
            ward_code: "", // Changed from district_code
            ward_name: "", // Changed from district_name
            province_name: "",
            province_code: "",
            address_vn: "",
            address_en: "",
            contact_name: "",
            contact_phone: "",
            contact_mail: "",
            programs_of_course: false,
            close_status: false,
            is_seamless_school: false,
            created_at: "",
            updated_at: "",
            status: true,
            student_count: 0,
            class_count: 0,
        })
        setShowSchoolDialog(true)
    }

    const openEditSchool = useCallback(
        async (school: any) => {
            try {
                setIsLoadingSchoolDetail(true)

                // Call API to get latest school details
                const schoolDetail = await GetSchoolDetail(school.id)

                setSelectedSchool(schoolDetail)

                // Simplified status conversion
                const statusValue = schoolDetail.status === true || schoolDetail.status === "true"

                setFormData({
                    id: schoolDetail.id || "",
                    name: schoolDetail.name || "",
                    short_name: schoolDetail.short_name || "",
                    parent_school: schoolDetail.parent_school || "",
                    type: schoolDetail.type || "",
                    ward_code: schoolDetail.ward_code || "", // Changed from district_code
                    ward_name: schoolDetail.ward_name || "", // Changed from district_name
                    province_name: schoolDetail.province_name || "",
                    province_code: schoolDetail.province_code || "",
                    address_vn: schoolDetail.address_vn || "",
                    address_en: schoolDetail.address_en || "",
                    contact_name: schoolDetail.contact_name || "",
                    contact_phone: schoolDetail.contact_phone || "",
                    contact_mail: schoolDetail.contact_mail || "",
                    programs_of_course: schoolDetail.programs_of_course || false,
                    close_status: schoolDetail.close_status || false,
                    is_seamless_school: schoolDetail.is_seamless_school || false,
                    created_at: schoolDetail.created_at || "",
                    updated_at: schoolDetail.updated_at || "",
                    status: statusValue,
                    logo: schoolDetail.logo || "",
                    student_count: schoolDetail.student_count || 0,
                    class_count: schoolDetail.class_count || 0,
                })
                setShowSchoolDialog(true)
            } catch (error) {
                console.error("Error loading school details:", error)
                toast({
                    title: t("error"),
                    description: t("detailLoadError"),
                    variant: "destructive",
                })
            } finally {
                setIsLoadingSchoolDetail(false)
            }
        },
        [toast, t],
    )

    // Submit school function
    const handleSubmitSchool = useCallback(async () => {
        try {
            setIsSubmitting(true)

            const cleanedData = {
                name: formData.name?.trim() || "",
                short_name: formData.short_name?.trim() || "",
                type: formData.type || "",
                ward_code: formData.ward_code || "", // Changed from district_code
                address_vn: formData.address_vn?.trim() || "",
                address_en: formData.address_en?.trim() || "",
                parent_school_id: formData.parent_school ? Number.parseInt(formData.parent_school) || 0 : 0,
                contact_name: formData.contact_name?.trim() || "",
                contact_phone: formData.contact_phone?.trim() || "",
                contact_mail: formData.contact_mail?.trim() || "",
                status: formData.status,
                logo: formData.logo || "",
            }

            // Call API and wait for response
            const apiCall = selectedSchool ? UpdateSchool(selectedSchool.id, cleanedData) : CreateSchool(cleanedData)

            try {
                const result = await apiCall

                // Simplified success check - if no error, consider it success
                const isSuccess = result && !result.error && !result.errors

                if (isSuccess) {

                    // Close dialog first
                    setShowSchoolDialog(false)

                    // Show toast notification with delay to avoid modal conflict
                    setTimeout(() => {
                        const toastResult = showToast({
                            title: "Thành công",
                            description: selectedSchool ? "Cập nhật trường học thành công!" : "Thêm trường học thành công!",
                        })
                    }, 200)

                    // Refresh list after successful operation
                    await getSchoolList()

                    // Clear cache
                    apiCache.delete("schools_with_counts")
                } else {
                    throw new Error("API response unsuccessful")
                }
            } catch (err: any) {
                // If error, show error message
                const errorMessage = `${t("error")}: ${getErrorMessage(err)}`
                toast({
                    title: t("error"),
                    description: errorMessage,
                    variant: "destructive",
                })
            }
        } catch (err: any) {
            toast({
                title: t("error"),
                description: t("saveError"),
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }, [formData, selectedSchool, getSchoolList, t, toast])

    // Search handler
    const [searchInput, setSearchInput] = useState("")

    const debouncedSearch = useMemo(
        () =>
            debounce((term: string) => {
                setSearchTerm(term)
                setPage(1) // Reset to first page when searching
            }, 500),
        [],
    )

    const handleSearchChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value
            setSearchInput(value)
            debouncedSearch(value)
        },
        [debouncedSearch],
    )

    // Pagination logic
    const totalPages = Math.ceil(totalSchoolsCount / pageSize)

    // Reset page when filters change
    useEffect(() => {
        setPage(1)
    }, [searchTerm, filterProvince, filterWard, selectedType, filterStatus, sortId, sortCreatedAt])

    const handleProvinceChange = useCallback((value: string) => {
        setFilterProvince(value)
        setFilterWard("all") // Reset ward when province changes
    }, [])

    const handleWardChange = useCallback((value: string) => {
        setFilterWard(value)
    }, [])

    const handleTypeChange = useCallback((value: string) => {
        setSelectedType(value)
    }, [])

    const handleStatusChange = useCallback((value: string) => {
        setFilterStatus(value)
    }, [])

    const handleSortIdChange = useCallback((value: "asc" | "desc" | "none") => {
        setSortId(value)
        setSortCreatedAt("") // Clear other sort
    }, [])

    const handleSortCreatedAtChange = useCallback((value: "newest" | "oldest" | "") => {
        setSortCreatedAt(value)
        setSortId("none") // Clear other sort
    }, [])

    const handleClearFilters = useCallback(() => {
        setSearchInput("")
        setSearchTerm("")
        setFilterProvince("all")
        setFilterWard("all")
        setSelectedType("all")
        setFilterStatus("all")
        setSortId("none")
        setSortCreatedAt("newest") // Default sort
        setPage(1)
    }, [])

    // Pagination handlers
    const handlePreviousPage = useCallback(() => {
        setPage((prev) => Math.max(prev - 1, 1))
    }, [])

    const handleNextPage = useCallback(() => {
        setPage((prev) => Math.min(prev + 1, totalPages))
    }, [totalPages])

    const handlePageClick = useCallback((pageNumber: number) => {
        setPage(pageNumber)
    }, [])

    // Generate page numbers for pagination
    const getPageNumbers = useMemo(() => {
        const pages = []
        const maxVisiblePages = 5
        let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2))
        const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1)
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i)
        }

        return pages
    }, [page, totalPages])

    //Show loading when submitting or loading detail
    if (isSubmitting || isLoadingSchoolDetail) {
        return <Loading />
    }

    return (
        <div className="min-h-screen">
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{t("title")} </h1>
                        <p className="text-gray-600">{t("description")}</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-3 flex-wrap">
                        <ExportData
                            onExport={async () => {
                                try {
                                    const response = await exportSchool()

                                    // Get URL from response and download file
                                    if (response.data && response.data.url) {
                                        const link = document.createElement("a")
                                        link.href = response.data.url
                                        link.download = `schools_${new Date().toISOString().split("T")[0]}.xlsx`
                                        document.body.appendChild(link)
                                        link.click()
                                        document.body.removeChild(link)
                                    }
                                } catch (error) {
                                    console.error("Export failed:", error)
                                    showToast({
                                        title: "Lỗi",
                                        description: "Xuất dữ liệu thất bại. Vui lòng thử lại.",
                                        variant: "destructive",
                                    })
                                }
                            }}
                            label="Xuất dữ liệu"
                        />
                        <ImportData
                            onImport={async (file) => {
                                try {
                                    const response = await importSchool(file)
                                    if (response.code === 200) {
                                        toast({
                                            title: "Thành công",
                                            description: response.data.message || "Nhập dữ liệu thành công!",
                                        })
                                        // Refresh school list after successful import
                                        await getSchoolList()
                                    } else {
                                        toast({
                                            title: "Lỗi",
                                            description: response.message || "Nhập dữ liệu thất bại",
                                            variant: "destructive",
                                        })
                                    }
                                } catch (error) {
                                    console.error("Import failed:", error)
                                    toast({
                                        title: "Lỗi",
                                        description: "Nhập dữ liệu thất bại. Vui lòng thử lại.",
                                        variant: "destructive",
                                    })
                                }
                            }}
                            accept={".csv,.xlsx"}
                            label="Nhập dữ liệu"
                        />
                        <Button className="rounded-full bg-Clever School-green text-white hover:bg-opacity-90" onClick={openCreateSchool}>
                            <LucidePlus className="mr-2 h-4 w-4" />
                            {t("createNew")}
                        </Button>
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        {/* Total school count info */}
                        <div className="mb-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                                <Info className="h-4 w-4" />
                                <span className="font-medium">{t("totalSchools")}: {totalSchoolsCount}</span>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center gap-4 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    type="search"
                                    placeholder={t("search")}
                                    className="pl-8"
                                    value={searchInput}
                                    onChange={handleSearchChange}
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-4 mb-6">
                            <Select value={filterProvince} onValueChange={handleProvinceChange}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder={t("selectProvince")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("allProvinces")}</SelectItem>
                                    {sortAlphabetGeneric(filterProvinces, (item: any) => item.name, true).map((province: any) => (
                                        <SelectItem key={province.code} value={province.code}>
                                            {province.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filterWard} onValueChange={handleWardChange} disabled={filterProvince === "all"}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder={t("selectWard")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("allWards")}</SelectItem>
                                    {sortAlphabetGeneric(filterWards, (item: any) => item.name, true).map((ward: any) => (
                                        <SelectItem key={ward.code} value={ward.code}>
                                            {ward.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={selectedType} onValueChange={handleTypeChange}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder={t("selectType")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("allTypes")}</SelectItem>
                                    <SelectItem value="Mầm non">{t("kindergarten")}</SelectItem>
                                    <SelectItem value="Tiểu học">{t("primary")}</SelectItem>
                                    <SelectItem value="THCS">{t("secondary")}</SelectItem>
                                    <SelectItem value="THPT">{t("highSchool")}</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* <Select value={filterStatus} onValueChange={handleStatusChange}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder={t("selectStatus")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("allStatuses")}</SelectItem>
                                    <SelectItem value="true">{t("active")}</SelectItem>
                                    <SelectItem value="false">{t("inactive")}</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={sortCreatedAt} onValueChange={handleSortCreatedAtChange}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder={t("sortByCreatedAt")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">{t("newest")}</SelectItem>
                                    <SelectItem value="oldest">{t("oldest")}</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={sortId} onValueChange={handleSortIdChange}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder={t("sortById")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">{t("noSort")}</SelectItem>
                                    <SelectItem value="asc">{t("idAsc")}</SelectItem>
                                    <SelectItem value="desc">{t("idDesc")}</SelectItem>
                                </SelectContent>
                            </Select> */}

                            <Button variant="outline" onClick={handleClearFilters}>
                                {t("clearFilters")}
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <MemoizedSchoolTable
                            schools={schools} // Now `schools` directly holds the paginated and filtered data
                            onDelete={handleDeleteSchool}
                            onEdit={openEditSchool}
                            page={page}
                            pageSize={pageSize}
                            t={t}
                            locale={locale}
                        />
                    </CardContent>

                    <CardFooter className="flex flex-col-reverse sm:flex-row gap-4 items-center justify-between">
                        <div className="text-sm text-gray-500">
                            {t("displaying")} {schools.length === 0 ? 0 : (page - 1) * pageSize + 1}-
                            {Math.min(page * pageSize, totalSchoolsCount)} {t("of")} {totalSchoolsCount} {t("schools")}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePreviousPage}
                                    disabled={page === 1}
                                    className="flex items-center gap-1 bg-transparent"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    <span className="hidden sm:inline">{t("previous")}</span>
                                </Button>

                                <div className="flex items-center space-x-1">
                                    {getPageNumbers.map((pageNumber) => (
                                        <Button
                                            key={pageNumber}
                                            variant={page === pageNumber ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handlePageClick(pageNumber)}
                                            className="min-w-[40px]"
                                        >
                                            {pageNumber}
                                        </Button>
                                    ))}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleNextPage}
                                    disabled={page === totalPages}
                                    className="flex items-center gap-1 bg-transparent"
                                >
                                    <span className="hidden sm:inline">{t("next")}</span>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </CardFooter>
                </Card>
                <SchoolDialogModal
                    show={showSchoolDialog}
                    onClose={() => setShowSchoolDialog(false)}
                    onSubmit={handleSubmitSchool}
                    formData={formData}
                    setFormData={setFormData}
                    selectedSchool={selectedSchool}
                />
            </main>
            <SimpleToaster />
        </div>
    )
}

// Optimized SchoolTable component
const SchoolTable = memo(
    ({
        schools,
        onDelete,
        onEdit,
        page,
        pageSize,
        t,
        locale,
    }: {
        schools: any[]
        onDelete: (id: string) => void
        onEdit: (school: any) => void
        page: number
        pageSize: number
        t: any
        locale: string
    }) => {
        const SchoolRow = memo(
            ({
                school,
                index,
                onEdit,
                onDelete,
                page,
                pageSize,
            }: {
                school: any
                index: number
                onEdit: (school: any) => void
                onDelete: (id: string) => void
                page: number
                pageSize: number
            }) => {
                const handleEdit = useCallback(() => onEdit(school), [onEdit, school])
                const handleDelete = useCallback(() => onDelete(school.id), [onDelete, school.id])

                return (
                    <TableRow key={school.id}>
                        <TableCell className="font-medium">{(page - 1) * pageSize + index + 1}</TableCell>
                        <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-2">
                                <Avatar className="h-12 w-12 border-2 border-gray-200 shadow-sm">
                                    <AvatarImage
                                        src={school.logo || "/placeholder.svg?height=48&width=48"}
                                        alt={school.name}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold">
                                        {school.name ? school.name.charAt(0).toUpperCase() : "S"}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium text-center max-w-[150px] truncate">{school.name}</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-center">{school.short_name}</TableCell>
                        <TableCell className="text-center">{school.type}</TableCell>
                        <TableCell className="text-center">{school.province_name}</TableCell>
                        <TableCell className="text-center">{school.ward_name}</TableCell>
                        <TableCell className="text-center">{school.address_vn}</TableCell>
                        <TableCell className="text-center">{school.student_count || 0}</TableCell>
                        <TableCell className="text-center">{school.class_count || 0}</TableCell>
                        <TableCell className="text-center">
                            <Badge variant={isActiveStatus(school.status) ? "default" : "destructive"}>
                                {isActiveStatus(school.status) ? t("active") : t("inactive")}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                            <div className="flex justify-end gap-2">
                                <Button size="icon" variant="ghost" onClick={handleEdit}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="text-red-500" onClick={handleDelete}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                <Link href={`/admin/schools/detail/${school.id}`}>
                                    <Button size="icon" variant="ghost">
                                        <Info className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </TableCell>
                    </TableRow>
                )
            },
            (prevProps, nextProps) => {
                return (
                    prevProps.school.id === nextProps.school.id && prevProps.school.updated_at === nextProps.school.updated_at
                )
            },
        )

        return (
            <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-max w-full">
                    <TableHeader>
                        <TableRow className="whitespace-nowrap text-center">
                            <TableHead className="whitespace-nowrap text-center">{t("stt")}</TableHead>
                            <TableHead className="whitespace-nowrap text-center">{t("name")}</TableHead>
                            <TableHead className="whitespace-nowrap text-center">{t("shortName")}</TableHead>
                            <TableHead className="whitespace-nowrap text-center">{t("type")}</TableHead>
                            <TableHead className="whitespace-nowrap text-center">{t("province")}</TableHead>
                            <TableHead className="whitespace-nowrap text-center">{t("ward")}</TableHead>
                            <TableHead className="whitespace-nowrap text-center">{t("address")}</TableHead>
                            <TableHead className="whitespace-nowrap text-center">{t("studentCount")}</TableHead>
                            <TableHead className="whitespace-nowrap text-center">{t("classCount")}</TableHead>
                            <TableHead className="whitespace-nowrap text-center">{t("status")}</TableHead>
                            <TableHead className="whitespace-nowrap text-center">{t("actions")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {schools && schools.length > 0 ? (
                            schools.map((school, idx) => (
                                <SchoolRow
                                    key={school.id}
                                    school={school}
                                    index={idx}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    page={page}
                                    pageSize={pageSize}
                                />
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={12} className="text-center">
                                    {t("noSchools")}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        )
    },
)

const MemoizedSchoolTable = memo(SchoolTable)
