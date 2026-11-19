#!/usr/bin/env python3
"""Load the office scene and run window.__checkOverlaps().

Exit 0 when the H tower itself has zero overlaps. Other pre-existing
overlaps in the original city are listed but do not fail the run, unless
--strict is set (then any overlap fails).
Optional --plan writes a clean city-plan PNG via window.__renderCityPlan.
Optional --scan sweeps footprint scales and reports the first clear size.
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
    ap.add_argument("--scan", action="store_true",
                    help="Sweep footprint scales and print the first clear size")
    ap.add_argument("--strict", action="store_true",
                    help="Fail on any city overlap, not only H-tower hits")
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

        deadline = time.time() + args.timeout
        ready = False
        last = ""
        while time.time() < deadline:
            try:
                info = page.evaluate(
                    """() => ({
                      hasCheck: typeof window.__checkOverlaps === 'function',
                      hasCity: !!window.__city,
                      roads: !!window.__roadsReady,
                      orange: !!window.__ORANGE,
                      atom: !!window.__atom,
                    })"""
                )
                last = json.dumps(info)
                if info["hasCheck"] and info["hasCity"] and info["orange"]:
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

        # Extra beat so atom / mega dressers finish.
        time.sleep(3.0)
        report = page.evaluate("() => window.__checkOverlaps()")
        fit = None
        if args.scan:
            fit = page.evaluate(
                """() => window.__scanTowerFit({ kMin: 0.2, kMax: 1, step: 0.02 })"""
            )
            report["fit"] = {
                "firstClear": (fit or {}).get("firstClear"),
                "rows": (fit or {}).get("rows"),
            }
            print("FIT firstClear", (fit or {}).get("firstClear"))
            for row in (fit or {}).get("rows") or []:
                flag = "CLEAR" if row.get("hits") == 0 else "hits=%s" % row.get("hits")
                items = row.get("items") or []
                brief = ", ".join(
                    "%s:%s" % (it.get("b"), it.get("kind")) for it in items[:6]
                )
                print("  k=%.2f  %sx%s  %s  %s" % (
                    row["k"], row["fw"], row["fd"], flag, brief))

        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(json.dumps(report, indent=2))
        print("buildings", report.get("buildings"), "ways", report.get("ways"),
              "overlaps", report.get("overlaps"),
              "h-tower", report.get("hTowerOverlaps"))
        clr = report.get("hClearance") or {}
        print("H clearance: minClear=%s m  margin=%s m  ok=%s  inside=%s  hits=%s  nearest=%s" % (
            clr.get("minClear"), clr.get("margin"), clr.get("ok"),
            clr.get("inside"), clr.get("hits"), clr.get("nearest")))
        items = report.get("items") or []
        h_items = [it for it in items if it.get("a") == "h-tower" or it.get("b") == "h-tower"]
        other = [it for it in items if it not in h_items]
        if h_items:
            print("H TOWER HITS:")
            for item in h_items:
                print("  ", item)
        if other:
            print("OTHER (pre-existing, not fixed):")
            for item in other[:60]:
                print("  ", item)
            if len(other) > 60:
                print("  ...", len(other) - 60, "more")

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
                    print("wrote plan", args.plan, "bytes", len(raw),
                          "world", (data or {}).get("world") if isinstance(data, dict) else None)
                else:
                    print("plan missing, keys", list(data) if isinstance(data, dict) else type(data))
            except Exception as e:
                print("plan failed:", e, file=sys.stderr)

        browser.close()

    h_ok = report.get("hTowerOverlaps") == 0
    strict_ok = report.get("overlaps") == 0
    ok = strict_ok if args.strict else h_ok
    print("RESULT", "OK" if ok else "OVERLAPS",
          "(H-tower clean)" if h_ok else "(H-tower hits)",
          "other=%d" % (report.get("overlaps", 0) - report.get("hTowerOverlaps", 0)))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
