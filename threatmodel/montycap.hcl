spec_version = "0.2.6"

threatmodel "montycap" {
  author      = "@garethm"
  description = "Browser-only Monte Carlo simulation tool for capacity planning. Runs entirely client-side as a single HTML file. No server component, no authentication, no persistent storage."
  link        = "https://github.com/garethm/montycap"

  attributes {
    new_initiative   = "false"
    internet_facing  = "false"
    initiative_size  = "Small"
  }

  additional_attribute "deployment_model" {
    value = "Static file served from browser — no backend"
  }

  // ── Information Assets ──────────────────────────────────────────────────────

  information_asset "task-configuration" {
    description             = "Task names, effort estimates, skip probabilities, and capacity settings entered by the user. Session-only; never transmitted or persisted."
    information_classification = "Restricted"
  }

  information_asset "imported-csv" {
    description             = "CSV files uploaded by the user containing task data. Parsed entirely in the browser."
    information_classification = "Restricted"
  }

  information_asset "simulation-results" {
    description             = "Monte Carlo simulation output: effort distributions, capacity risk metrics. Derived from task-configuration; session-only."
    information_classification = "Restricted"
  }

  information_asset "exported-csv" {
    description             = "CSV file produced by the export function and written to the user's filesystem. Contains task configuration data serialised for use in external tools. Leaves the system boundary."
    information_classification = "Restricted"
  }

  // ── Use Cases ───────────────────────────────────────────────────────────────

  usecase {
    description = "User configures capacity planning scenarios via the task input form and runs simulations."
  }

  usecase {
    description = "User imports task configurations by uploading a CSV file."
  }

  usecase {
    description = "User exports simulation task data as a CSV file for use in other tools."
  }

  // ── Exclusions ───────────────────────────────────────────────────────────────

  exclusion {
    description = "Server-side attacks: there is no server component."
  }

  exclusion {
    description = "Authentication and authorisation: there is no login mechanism."
  }

  exclusion {
    description = "Persistent data storage attacks: all data is session-only and never written to disk or transmitted."
  }

  exclusion {
    description = "Network traffic interception: the application does not transmit user data over the network."
  }

  // ── Third-Party Dependencies ─────────────────────────────────────────────────

  third_party_dependency "Chart.js CDN" {
    description       = "JavaScript charting library loaded from a public CDN. Used for distribution histogram and workload visualisation."
    saas              = "false"
    paying_customer   = "false"
    open_source       = "true"
    infrastructure    = "false"
    uptime_dependency = "degraded"
    uptime_notes      = "Charts will not render if the CDN is unavailable, but simulation results remain accessible as text."
  }

  third_party_dependency "PapaParse CDN" {
    description       = "CSV parsing library loaded from a public CDN. Used for CSV import and export."
    saas              = "false"
    paying_customer   = "false"
    open_source       = "true"
    infrastructure    = "false"
    uptime_dependency = "degraded"
    uptime_notes      = "CSV import/export will fail if the CDN is unavailable, but manual task entry remains functional."
  }

  // ── Threats ──────────────────────────────────────────────────────────────────

  threat "CDN supply chain compromise" {
    description = <<EOT
Chart.js or PapaParse served from the CDN is replaced with a malicious version (e.g. via CDN account compromise or BGP hijacking). The malicious script executes in the user's browser with full access to the page, potentially exfiltrating task data or executing arbitrary code.
EOT
    impacts     = ["Confidentiality", "Integrity", "Availability"]
    stride      = ["Tampering", "Info Disclosure", "Denial Of Service", "Elevation Of Privilege"]
    information_asset_refs = ["task-configuration", "imported-csv", "simulation-results"]

    control "Subresource Integrity (SRI)" {
      description          = "CDN script tags use integrity= SHA-384 hashes and crossorigin=anonymous. The browser refuses to execute any script that does not match the pinned hash."
      implemented          = true
      implementation_notes = "SRI hashes pinned for Chart.js and PapaParse in src/template.html."
      risk_reduction       = 90

      attribute "Reference" {
        value = "https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity"
      }
    }

    control "Content Security Policy" {
      description          = "A strict CSP restricts which script sources the browser will execute, providing defence-in-depth if SRI is misconfigured."
      implemented          = true
      implementation_notes = "CSP meta tag in src/template.html; script-src limited to self and the two CDN origins."
      risk_reduction       = 33
    }
  }

  threat "XSS via task name input" {
    description = <<EOT
A user manually enters a task name containing HTML/script payloads (e.g. <script>alert(1)</script> or javascript: URIs). If rendered via innerHTML the payload executes in the browser. Likelihood is low — with no persistence or sharing mechanism this is effectively self-XSS, meaning the user would be attacking their own session. The controls are still warranted as defence-in-depth against accidental unsafe rendering.
EOT
    impacts     = ["Confidentiality", "Integrity", "Availability"]
    stride      = ["Tampering", "Info Disclosure", "Denial Of Service", "Elevation Of Privilege"]
    information_asset_refs = ["task-configuration"]

    control "DOM API text rendering" {
      description          = "All user-supplied strings are inserted into the DOM using textContent or equivalent safe DOM APIs rather than innerHTML."
      implemented          = true
      implementation_notes = "Enforced throughout src/ui.js; reviewed in feat/dom-api-xss-hardening."
      risk_reduction       = 85
    }

    control "Content Security Policy" {
      description          = "CSP blocks inline script execution, limiting the blast radius of any accidental unsafe rendering."
      implemented          = true
      implementation_notes = "script-src disallows 'unsafe-inline'; nonce/hash approach used for any legitimate inline scripts."
      risk_reduction       = 40
    }
  }

  threat "CSV import injection — XSS" {
    description = <<EOT
A malicious CSV file contains task fields with embedded HTML or script payloads. On import the application parses and displays these values; if any rendering path uses innerHTML the payload executes.
EOT
    impacts     = ["Confidentiality", "Integrity", "Availability"]
    stride      = ["Tampering", "Info Disclosure", "Denial Of Service", "Elevation Of Privilege"]
    information_asset_refs = ["imported-csv", "task-configuration"]

    control "Input sanitisation on CSV import" {
      description          = "CSV fields are validated and stripped of dangerous content before being stored in application state."
      implemented          = true
      implementation_notes = "Validation logic added in feat/csv-upload-validation."
      risk_reduction       = 70
    }

    control "DOM API text rendering" {
      description          = "Imported values are rendered via textContent, not innerHTML, so even un-sanitised payloads are inert."
      implemented          = true
      risk_reduction       = 85
    }
  }

  threat "CSV export formula injection" {
    description = <<EOT
The exported CSV contains task names or values beginning with =, +, -, or @ (spreadsheet formula trigger characters). When the file is opened in a spreadsheet application (Excel, Google Sheets), the formula executes in that application's context — potentially running arbitrary commands via DDE or exfiltrating data held in the spreadsheet. Montycap is the delivery vehicle; the CIA impacts are on the downstream application, not on this system.
EOT
    information_asset_refs = ["exported-csv"]

    control "Formula injection hardening on export" {
      description          = "Task name and value fields are prefixed with a tab character (or apostrophe) before export to prevent spreadsheet formula execution."
      implemented          = true
      implementation_notes = "Hardening applied in feat/csv-export-injection-hardening."
      risk_reduction       = 80

      attribute "Reference" {
        value = "https://owasp.org/www-community/attacks/CSV_Injection"
      }
    }
  }

  threat "Missing or bypassable Content Security Policy" {
    description = <<EOT
The CSP is absent, misconfigured, or uses overly permissive directives (e.g. unsafe-inline, unsafe-eval, wildcard sources). This removes a critical layer of defence against XSS and CDN compromise, allowing injected scripts to execute freely.
EOT
    impacts     = ["Confidentiality", "Integrity"]
    stride      = ["Tampering", "Info Disclosure", "Elevation Of Privilege"]

    control "CSP implementation and testing" {
      description          = "CSP is implemented via a meta tag and reviewed in CI. The policy is validated against known bypass patterns before each release."
      implemented          = true
      implementation_notes = "CSP meta tag in src/template.html; HTML validation includes CSP structure checks."
      risk_reduction       = 70
    }
  }

  threat "Simulation complexity denial of service" {
    description = <<EOT
A crafted CSV import contains an extreme number of task rows or extreme quantity values, causing the simulation to consume excessive CPU and hang or crash the browser tab. Unlike form input, CSV import provides no natural friction to prevent large values being supplied in bulk.
EOT
    impacts     = ["Availability"]
    stride      = ["Denial Of Service"]
    information_asset_refs = ["task-configuration"]

    control "Input complexity limits" {
      description          = "Maximum values are enforced for task count, quantity, and simulation run count to keep execution time within an acceptable bound."
      implemented          = true
      implementation_notes = "Limits added in feat/simulation-complexity-limits."
      risk_reduction       = 75
    }
  }

  // ── Data Flow Diagram ─────────────────────────────────────────────────────

  data_flow_diagram_v2 "montycap data flows" {

    trust_zone "User Browser" {
      process "Simulation Engine" {}
      process "CSV Parser" {}
      process "UI / Form Handler" {}
      process "Chart Renderer" {}
      data_store "Session State" {
        information_asset = "simulation-results"
      }
    }

    trust_zone "Internet (CDN)" {
      external_element "Chart.js CDN" {}
      external_element "PapaParse CDN" {}
    }

    external_element "User" {}

    // User interactions
    flow "form input" {
      from     = "User"
      to       = "UI / Form Handler"
      protocol = "browser event"
    }

    flow "csv upload" {
      from     = "User"
      to       = "CSV Parser"
      protocol = "File API"
    }

    flow "csv download" {
      from     = "Session State"
      to       = "User"
      protocol = "Blob URL"
    }

    flow "display results" {
      from     = "Session State"
      to       = "User"
      protocol = "DOM"
    }

    // Internal flows
    flow "task data" {
      from     = "UI / Form Handler"
      to       = "Simulation Engine"
      protocol = "in-memory"
    }

    flow "parsed tasks" {
      from     = "CSV Parser"
      to       = "UI / Form Handler"
      protocol = "in-memory"
    }

    flow "store results" {
      from     = "Simulation Engine"
      to       = "Session State"
      protocol = "in-memory"
    }

    flow "result data" {
      from     = "Session State"
      to       = "Chart Renderer"
      protocol = "in-memory"
    }

    flow "rendered chart" {
      from     = "Chart Renderer"
      to       = "User"
      protocol = "Canvas"
    }

    // CDN dependency flows
    flow "https" {
      from     = "Chart.js CDN"
      to       = "Chart Renderer"
      protocol = "https"
    }

    flow "https" {
      from     = "PapaParse CDN"
      to       = "CSV Parser"
      protocol = "https"
    }
  }
}
