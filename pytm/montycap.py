#!/usr/bin/env python3
"""
pytm threat model for montycap.

Run modes (see package.json scripts):
  npm run pytm:report   — generate markdown findings report to stdout
  npm run pytm:dfd      — generate DFD PNG via graphviz
  npm run pytm          — generate both into docs/pytm/
"""

from pytm import (
    TM,
    Actor,
    Boundary,
    Classification,
    Data,
    Dataflow,
    Datastore,
    ExternalEntity,
    Process,
)

# ── Threat model ─────────────────────────────────────────────────────────────

tm = TM("montycap")
tm.description = (
    "Browser-only Monte Carlo simulation tool for capacity planning. "
    "Runs entirely client-side as a single HTML file. "
    "No server component, no authentication, no persistent storage."
)
tm.isOrdered = True

# ── Trust boundaries ──────────────────────────────────────────────────────────

browser = Boundary("User Browser")
internet = Boundary("Internet")

# ── Information assets (Data) ─────────────────────────────────────────────────

task_config = Data(
    "task-configuration",
    description="Task names, effort estimates, skip probabilities, and capacity settings. Session-only.",
    classification=Classification.RESTRICTED,
    isPII=False,
    isStored=False,
)

imported_csv = Data(
    "imported-csv",
    description="CSV file supplied by the user containing task data. Parsed entirely in the browser.",
    classification=Classification.RESTRICTED,
    isPII=False,
    isStored=False,
)

simulation_results = Data(
    "simulation-results",
    description="Monte Carlo output: effort distributions, capacity risk metrics. Session-only.",
    classification=Classification.RESTRICTED,
    isPII=False,
    isStored=False,
)

exported_csv = Data(
    "exported-csv",
    description="CSV file written to the user's filesystem. Leaves the system boundary.",
    classification=Classification.RESTRICTED,
    isPII=False,
    isStored=True,
)

cdn_script = Data(
    "cdn-script",
    description="JavaScript library loaded from CDN (Chart.js or PapaParse).",
    classification=Classification.PUBLIC,
    isPII=False,
    isStored=False,
)

# ── External entities ─────────────────────────────────────────────────────────

user = Actor("User", inBoundary=internet)

chartjs_cdn = ExternalEntity(
    "Chart.js CDN",
    inBoundary=internet,
    description="CDN serving the Chart.js visualisation library.",
)
chartjs_cdn.controls.isHardened = False

papaparse_cdn = ExternalEntity(
    "PapaParse CDN",
    inBoundary=internet,
    description="CDN serving the PapaParse CSV parsing library.",
)
papaparse_cdn.controls.isHardened = False

# ── Processes ─────────────────────────────────────────────────────────────────

form_handler = Process(
    "UI / Form Handler",
    inBoundary=browser,
    description="Handles form input, orchestrates task state, triggers simulation.",
)
form_handler.allowsClientSideScripting = True
form_handler.controls.sanitizesInput = True
form_handler.controls.validatesInput = True
form_handler.controls.encodesOutput = True
form_handler.controls.handlesResourceConsumption = True
form_handler.controls.checksInputBounds = True

csv_parser = Process(
    "CSV Parser",
    inBoundary=browser,
    description="Parses uploaded CSV files using PapaParse. Validates fields before storing.",
)
csv_parser.allowsClientSideScripting = True
csv_parser.controls.sanitizesInput = True
csv_parser.controls.validatesInput = True
csv_parser.controls.encodesOutput = True
csv_parser.controls.handlesResourceConsumption = True
csv_parser.controls.checksInputBounds = True

sim_engine = Process(
    "Simulation Engine",
    inBoundary=browser,
    description="Pure statistical computation — no DOM access. Runs Monte Carlo iterations.",
)
sim_engine.allowsClientSideScripting = False
sim_engine.controls.handlesResourceConsumption = True
sim_engine.controls.checksInputBounds = True

chart_renderer = Process(
    "Chart Renderer",
    inBoundary=browser,
    description="Renders distribution charts using Chart.js. Reads from session state only.",
)
chart_renderer.allowsClientSideScripting = True
chart_renderer.controls.encodesOutput = True

# ── Data store ────────────────────────────────────────────────────────────────

session_state = Datastore(
    "Session State",
    inBoundary=browser,
    description="In-memory application state. Never written to disk or transmitted.",
)
session_state.isEncryptedAtRest = False
session_state.isSQL = False
session_state.controls.isHardened = True

# ── Data flows ────────────────────────────────────────────────────────────────

# User → browser
Dataflow(user, form_handler, "form input", data=[task_config])

Dataflow(
    user,
    csv_parser,
    "csv upload",
    data=[imported_csv],
    note="File delivered via the HTML5 File API; never transmitted to a server.",
)

# Browser → user
Dataflow(
    session_state,
    user,
    "csv download",
    data=[exported_csv],
    note="Blob URL download; exported file leaves the system boundary.",
)

Dataflow(session_state, user, "display results", data=[simulation_results])

# CDN → browser (cross-boundary: internet → browser)
cdn_to_chart = Dataflow(
    chartjs_cdn,
    chart_renderer,
    "Chart.js script",
    data=[cdn_script],
    protocol="HTTPS",
)
cdn_to_chart.controls.authenticatesDestination = True

cdn_to_csv = Dataflow(
    papaparse_cdn,
    csv_parser,
    "PapaParse script",
    data=[cdn_script],
    protocol="HTTPS",
)
cdn_to_csv.controls.authenticatesDestination = True

# Internal flows (within browser boundary)
Dataflow(csv_parser, form_handler, "parsed tasks", data=[task_config])
Dataflow(form_handler, sim_engine, "task data", data=[task_config])
Dataflow(sim_engine, session_state, "store results", data=[simulation_results])
Dataflow(session_state, chart_renderer, "result data", data=[simulation_results])

# ── Run ───────────────────────────────────────────────────────────────────────

def generate_report():
    """Write a markdown findings report to stdout."""
    tm.resolve()

    print(f"# Threat Model Report: {tm.name}\n")
    print(f"{tm.description}\n")
    print(f"## Findings ({len(tm.findings)} total)\n")

    by_severity = {"Very High": [], "High": [], "Medium": [], "Low": []}
    for f in tm.findings:
        bucket = by_severity.get(f.severity, by_severity["Low"])
        bucket.append(f)

    for severity, findings in by_severity.items():
        if not findings:
            continue
        print(f"### {severity}\n")
        seen = set()
        for f in findings:
            if f.threat_id in seen:
                continue
            seen.add(f.threat_id)
            print(f"#### {f.threat_id} — {f.description}")
            print(f"\n- **Target:** {f.target}")
            print(f"- **Mitigations:** {f.mitigations}\n")


if __name__ == "__main__":
    import sys
    if "--markdown" in sys.argv:
        sys.argv.remove("--markdown")
        generate_report()
    else:
        tm.process()
