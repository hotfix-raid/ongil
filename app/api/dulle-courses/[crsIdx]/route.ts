import { NextRequest, NextResponse } from "next/server";
import pool from "../../../../src/lib/db/pool";

export const runtime = "nodejs";

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

/** "강원 고성군" -> ["강원", "고성"] for addr1/addr2 matching. */
function sigunKeywords(sigun: string): string[] {
  const keywords: string[] = [];
  for (const token of sigun.trim().split(/\s+/)) {
    let keyword = token;
    if (keyword.length <= 4 && keyword.length > 2 && /[도도시군구]$/.test(keyword)) {
      keyword = keyword.slice(0, -1);
    }
    if (keyword.length >= 2 && !keywords.includes(keyword)) {
      keywords.push(keyword);
    }
  }
  return keywords;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ crsIdx: string }> }
) {
  const { crsIdx } = await params;

  if (typeof crsIdx !== "string" || crsIdx.length < 1 || crsIdx.length > 30) {
    return badRequest("crsIdx must be 1-30 characters");
  }

  try {
    const { rows } = await pool.query(
      `SELECT c.crs_idx, c.route_idx, c.crs_kor_nm, c.crs_dstnc,
              c.crs_totl_rqrm_hour, c.crs_level, c.crs_cycle,
              c.crs_contents, c.crs_summary, c.crs_tour_info, c.traveler_info,
              c.sigun, c.brd_div, c.gpxpath,
              c.createdtime, c.modifiedtime,
              t.theme_nm, t.line_msg, t.theme_descs
       FROM dulle_course AS c
       LEFT JOIN walking_trail_theme AS t ON t.route_idx = c.route_idx
       WHERE c.crs_idx = $1`,
      [crsIdx]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const { theme_nm, line_msg, theme_descs, ...course } = rows[0];
    const theme =
      theme_nm == null
        ? null
        : {
            route_idx: course.route_idx as string,
            theme_nm: theme_nm as string,
            line_msg: line_msg as string | null,
            theme_descs: theme_descs as string | null,
          };

    let relatedAttractions: Array<Record<string, unknown>> = [];
    if (typeof course.sigun === "string" && course.sigun.trim()) {
      const keywords = sigunKeywords(course.sigun);
      if (keywords.length) {
        const likeParams: string[] = [];
        const addParam = (value: string) => {
          likeParams.push(value);
          return `$${likeParams.length}`;
        };
        const ors = keywords.map((keyword) => {
          const likeParam = addParam(`%${escapeLike(keyword)}%`);
          return `(a.addr1 ILIKE ${likeParam} ESCAPE '\\' OR a.addr2 ILIKE ${likeParam} ESCAPE '\\')`;
        });
        const { rows: attractionRows } = await pool.query(
          `SELECT a.content_id, a.title, a.addr1, a.addr2,
                  a.firstimage, a.firstimage2, a.mapx, a.mapy
           FROM tour_attraction AS a
           WHERE ${ors.join(" OR ")}
           ORDER BY a.title ASC, a.content_id ASC
           LIMIT 5`,
          likeParams
        );
        relatedAttractions = attractionRows;
      }
    }

    return NextResponse.json({ course, theme, relatedAttractions });
  } catch (e) {
    console.error("Failed to fetch dulle course detail", e);
    return NextResponse.json({ error: "Failed to fetch dulle course detail" }, { status: 500 });
  }
}
