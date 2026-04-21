import { Card, CardContent } from "@/components/ui/card";
import React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export default function MetricCard({
  title,
  value,
  change,
  icon,
  color,
  suffix = "",
  message,
  onClick,
  clickable = false,
  href,
}: any) {
  const router = useRouter();
  const colorClasses = {
    blue: "border-blue-500 text-blue-700 bg-blue-50",
    green: "border-green-500 text-green-700 bg-green-50",
    purple: "border-purple-500 text-purple-700 bg-purple-50",
    orange: "border-orange-500 text-orange-700 bg-orange-50",
    red: "border-red-500 text-red-700 bg-red-50",
    yellow: "border-yellow-500 text-yellow-700 bg-yellow-50",
    pink: "border-pink-500 text-pink-700 bg-pink-50",
    teal: "border-teal-500 text-teal-700 bg-teal-50",
    gray: "border-gray-500 text-gray-700 bg-gray-50",
    indigo: "border-indigo-500 text-indigo-700 bg-indigo-50",
    cyan: "border-cyan-500 text-cyan-700 bg-cyan-50",
    lime: "border-lime-500 text-lime-700 bg-lime-50",
    rose: "border-rose-500 text-rose-700 bg-rose-50",
  };

  const isPositive = change > 0;
  const changeColor = isPositive ? "text-green-600" : "text-red-600";
  const changeIcon = isPositive ? "↗" : "↘";

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <Card
      className={`border-2 shadow-lg hover:shadow-2xl transition-all ${colorClasses[color as keyof typeof colorClasses]
        } flex flex-col items-center justify-center p-6 min-h-[180px] ${clickable || href ? "cursor-pointer hover:scale-105 hover:shadow-xl" : ""
        }`}
      onClick={(clickable || href) ? handleClick : undefined}
    >
      <CardContent className="flex flex-col items-center justify-center p-0 w-full">
        <div className="flex items-center justify-center mb-2">{icon}</div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-4xl font-extrabold text-gray-900">
            {typeof value === "number" ? value.toLocaleString() : value}
            {suffix}
          </span>
          {change !== undefined && change !== null && change !== 0 && (
            <span
              className={`text-base font-semibold ${changeColor} flex items-center gap-1`}
            >
              {changeIcon} {Math.abs(change)}%
            </span>
          )}
        </div>
        <div className="text-sm text-gray-600 mt-1 font-medium text-center whitespace-pre-line">
          {title}
        </div>
        {message && (
          <div className="text-xs mt-2 px-2 py-1 rounded bg-white/80 text-center font-semibold text-blue-700 border border-blue-100 shadow-sm">
            {message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
