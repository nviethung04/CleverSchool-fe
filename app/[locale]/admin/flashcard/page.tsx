"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/app/loading";
import {
  AdminCreateButton,
  AdminListToolbar,
  AdminPageHeading,
} from "@/components/admin/admin-list-header";
import { FlashcardAPI } from "@/lib/api/flashcard-api";
import { useDebounce } from "@/hooks/use-debounce";
import { Search } from "lucide-react";

type VocabularyRow = {
  id: number;
  word: string;
  phonetic?: string;
  translation?: string;
  meaning?: string;
  definition?: string;
  part_of_speech?: string;
  level?: string;
};

export default function FlashcardVocabularyPage() {
  const tCommon = useTranslations("common");
  const t = useTranslations("flashcardAdmin");
  const { toast } = useToast();

  const [vocabularies, setVocabularies] = useState<VocabularyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    word: "",
    translation: "",
    phonetic: "",
    definition: "",
  });

  const debouncedSearch = useDebounce(search, 400);

  const fetchVocabularies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await FlashcardAPI.listVocabularies({
        page,
        limit: 20,
        search: debouncedSearch.trim() || undefined,
      });
      const payload = response?.data ?? {};
      setVocabularies(payload.vocabularies ?? []);
      const pagination = payload.pagination ?? {};
      setTotalPages(Number(pagination.total_pages) || 1);
    } catch (error) {
      console.error("Error fetching vocabularies:", error);
      toast({
        title: tCommon("error"),
        description: t("loadError"),
        variant: "destructive",
      });
      setVocabularies([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, toast, tCommon, t]);

  useEffect(() => {
    fetchVocabularies();
  }, [fetchVocabularies]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleCreate = async () => {
    if (!form.word.trim() || !form.translation.trim()) {
      toast({
        title: tCommon("error"),
        description: t("requiredFields"),
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      await FlashcardAPI.createVocabulary({
        word: form.word.trim(),
        translation: form.translation.trim(),
        phonetic: form.phonetic.trim(),
        definition: form.definition.trim(),
        level: "beginner",
        difficulty: 1,
        frequency: 50,
      });
      toast({
        title: tCommon("success"),
        description: t("createSuccess"),
      });
      setCreateOpen(false);
      setForm({ word: "", translation: "", phonetic: "", definition: "" });
      setPage(1);
      await fetchVocabularies();
    } catch (error: any) {
      console.error("Error creating vocabulary:", error);
      toast({
        title: tCommon("error"),
        description:
          error?.response?.data?.message || error?.message || t("createError"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading && vocabularies.length === 0 && !debouncedSearch) {
    return <Loading />;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeading title={t("title")} description={t("description")} />

      <Card>
        <CardHeader className="space-y-4">
          <AdminListToolbar
            summary={
              <>
                {t("title")}:{" "}
                <span className="font-semibold">{vocabularies.length}</span>
              </>
            }
            action={
              <AdminCreateButton onClick={() => setCreateOpen(true)}>
                {t("addVocabulary")}
              </AdminCreateButton>
            }
          />
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-9"
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">
              {t("loading")}
            </div>
          ) : vocabularies.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {t("empty")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("word")}</TableHead>
                  <TableHead>{t("phonetic")}</TableHead>
                  <TableHead>{t("translation")}</TableHead>
                  <TableHead>{t("definition")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vocabularies.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.word}</TableCell>
                    <TableCell>{item.phonetic || "—"}</TableCell>
                    <TableCell>
                      {item.translation || item.meaning || "—"}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {item.definition || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {tCommon("previous")}
              </Button>
              <span className="flex items-center text-sm text-muted-foreground px-2">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {tCommon("next")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("addVocabulary")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="word">
                {t("word")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="word"
                value={form.word}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, word: e.target.value }))
                }
                placeholder={t("wordPlaceholder")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="translation">
                {t("translation")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="translation"
                value={form.translation}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, translation: e.target.value }))
                }
                placeholder={t("translationPlaceholder")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phonetic">{t("phonetic")}</Label>
              <Input
                id="phonetic"
                value={form.phonetic}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, phonetic: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="definition">{t("definition")}</Label>
              <Input
                id="definition"
                value={form.definition}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, definition: e.target.value }))
                }
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="button" onClick={handleCreate} disabled={saving}>
                {saving ? t("saving") : tCommon("save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
