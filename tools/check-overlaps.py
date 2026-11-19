#!/usr/bin/env python3
"""Load the office scene and run window.__checkOverlaps().

Exit 0 only when the report has zero overlaps. Optional --plan writes a
clean city-plan PNG via window.__renderCityPlan(true).
"""
import argparse, json, sys, time
from pathlib import Path

from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8770/index.html?quality=auto"
ARGS = [
    "--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl",
    "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader",
    "--no-sandbox", "--disable-dev-shm-usage",
]
DEFAULT_OUT = Path("/workspace/htower/tools/overlap-report.json")

PROBE = """
(() => {
  window.__LOCK_CAM = window.__LOCK_CAM || true;
})();
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default=URL)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--plan", type=Path, default=None,
                    help="If set, also write a clean city-plan PNG here")
    ap.add_argument("--timeout", type=float, default=180)
    args = ap.parse_args()

    log = {"console": [], "page_errors": []}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=ARGS)
        page = browser.new_page(viewport={"width": 800, "height": 500},
                                device_scale_factor=1)
        page.on("console", lambda m: log["console"].append(
            {"type": m.type, "text": m.text[:400]}))
        page.on("pageerror", lambda e: log["page_errors"].append(str(e)[:400]))
        page.add_init_script(PROBE)
        page.goto(args.url, wait_until="domcontentloaded", timeout=60000)

        # Wait until the city is in the scene and the checker is installed.
        deadline = time.time() + args.timeout
        ready = False
        last = ""
        while time.time() < deadline:
            try:
                info = page.evaluate(
                    """() => ({
                      hasCheck: typeof window.__checkOverlaps === 'function',
                      hasCity: !!window.__city,
                      pruned: !!window.__westPlotPruned,
                      roads: !!window.__roadsReady,
                      orange: !!window.__ORANGE,
                    })"""
                )
                last = json.dumps(info)
                if info["hasCheck"] and info["hasCity"] and info["orange"]:
                    # Give prune + sealRoads a moment if they are mid-pass.
                    if info["pruned"] or time.time() + 8 > deadline:
                        ready = True
                        break
            except Exception as e:
                last = str(e)
            time.sleep(1.0)

        if not ready:
            print("TIMEOUT waiting for city/checker:", last, file=sys.stderr)
            for e in log["page_errors"][:8]:
                print(" pageerror:", e, file=sys.stderr)
            browser.close()
            return 2

        # One extra beat so pruneWestPlotForTower and dressers finish.
        time.sleep(2.0)
        report = page.evaluate("() => window.__checkOverlaps()")
        west = page.evaluate("() => window.__westPlotEdit || null")
        report["westPlotEdit"] = west
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(json.dumps(report, indent=2))
        print("buildings", report.get("buildings"), "ways", report.get("ways"),
              "overlaps", report.get("overlaps"),
              "h-tower", report.get("hTowerOverlaps"))
        if west:
            print("west-plot hidden", len(west.get("hidden") or []),
                  "moved", len(west.get("moved") or []))
        for item in (report.get("items") or [])[:40]:
            print("  ", item)
        if len(report.get("items") or []) > 40:
            print("  ...", len(report["items"]) - 40, "more")

        if args.plan:
            try:
                data = page.evaluate(
                    """() => {
                      if (typeof window.__renderCityPlan !== 'function') return null;
                      return window.__renderCityPlan(true, false, { fixed: true });
                    }"""
                )
                png = data.get("png") if isinstance(data, dict) else data
                if png and isinstance(png, str) and png.startswith("data:image"):
                    import base64
                    raw = base64.b64decode(png.split(",", 1)[1])
                    args.plan.parent.mkdir(parents=True, exist_ok=True)
                    args.plan.write_bytes(raw)
                    print("wrote plan", args.plan, "bytes", len(raw), "world", (data or {}).get("world") if isinstance(data, dict) else None)
                else:
                    print("plan missing, keys", list(data) if isinstance(data, dict) else type(data))
            except Exception as e:
                print("plan failed:", e, file=sys.stderr)

        browser.close()

    ok = bool(report.get("ok")) and report.get("overlaps") == 0
    print("RESULT", "OK" if ok else "OVERLAPS")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
