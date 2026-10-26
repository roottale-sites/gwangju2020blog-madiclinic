import nextPackage from "next/package.json";
import { version as reactVersion } from "react";
import { createFleetInfoRoute } from "@roottale/cms-renderer-next/routes";

const getCmsFleetInfo = createFleetInfoRoute({ site: "gwangju2020-blog-madiclinic" });

// Node 버전은 요청을 처리하는 런타임에서 읽는다. 빌드 시 정적 응답으로 고정하지 않는다.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const response = await getCmsFleetInfo();
  const info = await response.json();
  return Response.json({
    ...info,
    runtime: { next: nextPackage.version, react: reactVersion, node: process.versions.node },
  }, { headers: { "cache-control": "no-store" } });
}
