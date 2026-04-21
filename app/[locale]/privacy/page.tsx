import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Shield,
  Users,
  FileText,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  Home,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });

  return {
    title: t("title") + " - Enspire LMS",
    description: t("agreement").substring(0, 160),
  };
}

export default function TermsPage() {
  const t = useTranslations("terms");

  const currentDate = new Date().toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden dark:from-blue-900 dark:to-indigo-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.1))]"></div>
        <div className="relative max-w-7xl mx-auto">
          {/* Header with Back Button and Title */}
          <div className="flex items-center justify-between mb-3">
            <Button
              asChild
              variant="ghost"
              className="text-blue-700 hover:bg-white/10 hover:text-blue-500"
            >
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                {t("backToHome")}
              </Link>
            </Button>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-700 tracking-tight">
              {t("title")}
            </h1>

            {/* Spacer for alignment */}
            <div className="w-[140px]"></div>
          </div>

          {/* Center Badge */}
          <div className="text-center">
            <Badge
              variant="secondary"
              className="text-xs px-3 py-1.5 bg-blue-200 backdrop-blur-sm text-black border-blue-300 hover:bg-blue-300"
            >
              {t("lastUpdated", { date: currentDate })}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-8">
        {/* Introduction Card */}
        <Card className="mb-8 shadow-xl backdrop-blur-sm bg-white/95 dark:bg-gray-800/95">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">Enspire LMS</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {t("agreement")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {t("serviceDescription")}
              </p>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <Users className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {t("userDefinition")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 1: Terms of Use */}
        <Card className="mb-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl">{t("section1.title")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="text-lg font-semibold px-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>{t("section1.subsection1.title")}</span>
                  </div>
                </div>
                <div className="px-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {t("section1.subsection1.content")}
                  </p>
                </div>
              </div>

              <div>
                <div className="text-lg font-semibold px-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <span>{t("section1.subsection2.title")}</span>
                  </div>
                </div>
                <div className="px-4">
                  <div className="space-y-4">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {t("section1.subsection2.content")}
                    </p>
                    <Separator className="my-4" />
                    <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                        <strong className="text-orange-600 dark:text-orange-400">
                          Trách nhiệm:
                        </strong>
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {t("section1.subsection2.responsibilities")}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                        <strong className="text-red-600 dark:text-red-400">
                          Chấm dứt dịch vụ:
                        </strong>
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {t("section1.subsection2.termination")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Privacy Agreement */}
        <Card className="mb-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-2xl">{t("section2.title")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="text-lg font-semibold px-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                  {t("section2.subsection1.title")}
                </div>
                <div className="px-4">
                  <div className="space-y-3">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {t("section2.subsection1.content")}
                    </p>
                    <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {t("section2.subsection1.tracking")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-lg font-semibold px-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                  {t("section2.subsection2.title")}
                </div>
                <div className="px-4">
                  <div className="space-y-4">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {t("section2.subsection2.content")}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {t("section2.subsection2.research")}
                    </p>
                    <Separator className="my-4" />
                    <div className="space-y-3">
                      <p className="font-semibold text-gray-800 dark:text-gray-200">
                        {t("section2.subsection2.sharing")}
                      </p>
                      <ul className="space-y-2 ml-4">
                        {["0", "1", "2", "3"].map((index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-purple-600 dark:text-purple-400 mt-1">
                              •
                            </span>
                            <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                              {t(`section2.subsection2.sharingCases.${index}`)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-lg font-semibold px-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                  {t("section2.subsection3.title")}
                </div>
                <div className="px-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {t("section2.subsection3.content")}
                  </p>
                </div>
              </div>

              <div>
                <div className="text-lg font-semibold px-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                  {t("section2.subsection4.title")}
                </div>
                <div className="px-4">
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {t("section2.subsection4.content")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card className="mb-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <Mail className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <CardTitle className="text-2xl">{t("contact.title")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("contact.content")}
            </p>
          </CardContent>
        </Card>

        {/* Acceptance Banner */}
        <Card className="mb-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-400">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("acceptance")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
