"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ProfessionalPagination from "@/components/ui/professional-pagination";
import {
  DeleteSetting,
  GetSettings,
  SettingItem,
  UpdateSetting,
} from "@/lib/api/settings";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";

export default function AdminSettingsPage() {
  const t = useTranslations('manageSetting')
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "vi";
  const [items, setItems] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [keyword, setKeyword] = useState<string>("");
  const [status, setStatus] = useState<string>("all"); // all | active | inactive
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(12);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const is_activeParam = useMemo(() => {
    if (status === "active") return true;
    if (status === "inactive") return false;
    return undefined;
  }, [status]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await GetSettings({
        keyword: keyword || undefined,
        is_active: is_activeParam,
        page,
        per_page: perPage,
      });
      setItems(res.settings || []);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, is_activeParam, page, perPage]);

  const handleToggleActive = async (item: SettingItem) => {
    try {
      await UpdateSetting(item.id, {
        key: item.key,
        name: item.name,
        values: item.values,
        is_active: !item.is_active,
      });
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    try {
      await DeleteSetting(id);
      // Nếu xóa xong mà trang hiện tại hết dữ liệu, lùi về trang trước nếu có
      if (items.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-semibold mb-4">{t("title")}</h1>

      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
        <div className="flex gap-3 items-center w-full md:w-auto">
          <Select
            value={status}
            onValueChange={(v) => {
              setPage(1);
              setStatus(v);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("filter.statusPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filter.all")}</SelectItem>
              <SelectItem value="active">{t("filter.active")}</SelectItem>
              <SelectItem value="inactive">{t("filter.inactive")}</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1 md:w-[320px]">
            <Input
              placeholder={t("filter.searchPlaceholder")}
              value={keyword}
              onChange={(e) => {
                setPage(1);
                setKeyword(e.target.value);
              }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => router.push(`/${locale}/admin/settings/create`)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4" />
            {t("createNew")}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">{t("table.name")}</TableHead>
              <TableHead className="w-[30%]">Key</TableHead>
              <TableHead className="w-[10%]">{t("table.status")}</TableHead>
              <TableHead className="w-[20%] text-right">{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4}>{t("loading")}</TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>{t("noData")}</TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {item.key}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.is_active}
                        onCheckedChange={() => handleToggleActive(item)}
                      />
                      <span className="text-sm text-gray-600">
                        {item.is_active ? t("status.on") : t("status.off")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/${locale}/admin/settings/${item.id}/edit`
                          )
                        }
                      >
                        {t("actions.edit")}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        {t("actions.delete")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ProfessionalPagination
        currentPage={page}
        totalPages={totalPages}
        totalCount={total}
        pageSize={perPage}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(s) => {
          setPage(1);
          setPerPage(s);
        }}
        itemName={t("itemName")}
      />
    </div>
  );
}
