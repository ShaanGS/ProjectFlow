import { readFileSync } from "node:fs"
import { join } from "node:path"

import { NextResponse } from "next/server"

function landingDist(path: string) {
  return join(process.cwd(), "landing", "Animated Website  copy", "dist", path)
}

export function GET() {
  const routeBridge = `
    <script>
      document.addEventListener("click", function (event) {
        var link = event.target && event.target.closest && event.target.closest("a");
        if (!link || !/Try Kairo/i.test(link.textContent || "")) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        window.parent.postMessage({ type: "kairo:open-product" }, "*");
      }, true);
    </script>
  `

  const html = readFileSync(landingDist("index.html"), "utf8")
    .replaceAll('href="/favicon.svg"', 'href="/landing-assets/favicon.svg"')
    .replaceAll('src="/assets/', 'src="/landing-assets/assets/')
    .replaceAll('href="/assets/', 'href="/landing-assets/assets/')
    .replace("</head>", `${routeBridge}</head>`)

  return new NextResponse(html, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/html; charset=utf-8",
    },
  })
}
