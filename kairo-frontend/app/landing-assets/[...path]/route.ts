import { readFileSync } from "node:fs"
import { join, normalize } from "node:path"

export const runtime = "nodejs"

const CONTENT_TYPES: Record<string, string> = {
  css: "text/css; charset=utf-8",
  html: "text/html; charset=utf-8",
  js: "application/javascript; charset=utf-8",
  svg: "image/svg+xml",
}

function landingAsset(pathParts: string[]) {
  const safePath = normalize(pathParts.join("/"))

  if (safePath.startsWith("..") || safePath.includes("/..")) {
    throw new Error("Invalid landing asset path")
  }

  return join(process.cwd(), "landing", "Animated Website  copy", "dist", safePath)
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const filePath = landingAsset(path)
  const extension = path.at(-1)?.split(".").at(-1) ?? ""
  const contentType = CONTENT_TYPES[extension] ?? "application/octet-stream"

  if (extension === "js") {
    const js = readFileSync(filePath, "utf8")
      .replaceAll("/file.svg", "/landing-assets/file.svg")
      .replaceAll("/favicon.svg", "/landing-assets/favicon.svg")
      .replaceAll("/icons.svg", "/landing-assets/icons.svg")
      .replace(
        "r(!0);let t=Array.from(new Set([...zd]));for(let e of t)if(await Vd(e)){window.location.assign(e);return}r(!1),alert(`Kairo product app is not reachable yet. Start the product dev server and try again.`)",
        'window.top.location.assign("/kairo");return'
      )
      .replace(
        'href:t,onClick:a,"aria-busy":n',
        'href:"/kairo",target:"_top","aria-busy":!1'
      )

    return new Response(js, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": contentType,
      },
    })
  }

  return new Response(new Uint8Array(readFileSync(filePath)), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": contentType,
    },
  })
}
