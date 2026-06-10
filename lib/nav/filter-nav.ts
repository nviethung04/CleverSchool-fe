import { HIDDEN_MODULES } from "@/config/hiddenModules";

/** True when href contains a hidden route fragment (see config/hiddenModules.ts). */
export function isNavHrefHidden(href: string): boolean {
  const path = href.toLowerCase();
  return HIDDEN_MODULES.some((slug) => {
    const fragment = slug.toLowerCase();
    return path.includes(`/${fragment}`) || path.endsWith(`/${fragment}`);
  });
}

export function filterNavByHref<T extends { href: string }>(items: T[]): T[] {
  return items.filter((item) => !isNavHrefHidden(item.href));
}

export type NavWithSubmenu = {
  href: string;
  submenu?: { href: string }[];
};

export function filterSidebarItems<T extends NavWithSubmenu>(items: T[]): T[] {
  return items
    .map((item) => {
      const clone = { ...item } as T;
      if (clone.submenu) {
        clone.submenu = clone.submenu.filter((s) => !isNavHrefHidden(s.href)) as T["submenu"];
      }
      return clone;
    })
    .filter((item) => {
      if (item.submenu && item.submenu.length > 0) {
        return true;
      }
      return !isNavHrefHidden(item.href);
    });
}
