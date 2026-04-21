import { redirect } from "@/lib/i18n/routing";

export default function UsersPage({ params }: { params: { locale: string } }) {
  redirect({ href: "/admin/users/list", locale: params.locale });
}