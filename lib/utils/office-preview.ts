/** Office Online embed cannot fetch localhost or private-network URLs. */
export function canUseOfficeOnlineEmbed(fileUrl: string): boolean {
  if (!fileUrl) return false;

  try {
    const url = new URL(fileUrl);
    const host = url.hostname.toLowerCase();

    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "[::1]" ||
      host.endsWith(".local")
    ) {
      return false;
    }

    if (
      /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(host)
    ) {
      return false;
    }

    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function getOfficeOnlineEmbedUrl(fileUrl: string): string {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
}
