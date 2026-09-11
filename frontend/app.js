(() => {
  "use strict";

  function storageGet(store, key) {
    try { return store.getItem(key); } catch { return null; }
  }

  function storageSet(store, key, value) {
    try { value === null ? store.removeItem(key) : store.setItem(key, value); } catch { /* Storage may be disabled; scanning still works. */ }
  }

  let preferences = { theme: "dark", contrast: "normal", pageSize: 5, remember: true };
  try { Object.assign(preferences, JSON.parse(storageGet(localStorage, "depcheck-settings") || "{}")); } catch { /* Use defaults. */ }

  function loadStoredReport() {
    try {
      const value = preferences.remember && storageGet(sessionStorage, "depcheck-audit-report");
      const report = value ? JSON.parse(value) : null;
      return report?.schemaVersion === "depcheck-audit-v1" && Array.isArray(report.findings) && Array.isArray(report.candidates) && report.inventory && report.scan ? report : null;
    } catch {
      storageSet(sessionStorage, "depcheck-audit-report", null);
      return null;
    }
  }

  const storedReport = loadStoredReport();
  const state = {
    report: storedReport,
    selectedFindingId: storedReport?.findings?.[0]?.id ?? null,
    page: 1,
    pageSize: [5, 10, 25].includes(preferences.pageSize) ? preferences.pageSize : 5,
    scanMode: storedReport?.findings?.some(finding => String(finding.advisory?.id).startsWith("SIGNAL-")) ? "attack" : "default",
  };

  const $ = id => document.getElementById(id);
  const text = (tag, value, className) => {
    const node = document.createElement(tag);
    node.textContent = String(value ?? "");
    if (className) node.className = className;
    return node;
  };
  const displayValue = value => String(value ?? "unknown").replaceAll("_", " ");

  function route() {
    const requested = location.hash.slice(1) || "home";
    const page = ["home", "scan", "summary", "finding", "candidates", "audit", "settings"].includes(requested) ? requested : "home";
    document.querySelectorAll(".view").forEach(view => { view.hidden = view.dataset.page !== page; });
    document.querySelectorAll(".sidebar nav a").forEach(link => link.classList.toggle("active", link.dataset.view === page));
    if (page === "finding") renderFinding();
    if (page === "candidates") renderCandidates();
    if (page === "audit") renderAudit();
    document.title = `${document.querySelector(`[data-view="${page}"]`)?.textContent.trim() || "Depcheck"} · Depcheck Verify`;
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function badge(value) {
    return text("span", displayValue(value), `badge ${String(value ?? "unknown").replaceAll("_", "-")}`);
  }

  function renderMetrics() {
    const root = $("metrics");
    root.replaceChildren();
    if (!state.report) return;
    const metrics = [
      { label: "Package instances", value: state.report.inventory.data?.instances?.length ?? 0, icon: "◇" },
      { label: "Snapshot findings", value: state.report.findings.length, icon: "!" },
      { label: "Unknown reachability", value: state.report.findings.filter(finding => finding.reachability?.status === "unknown").length, icon: "?" },
      { label: "Candidates compared", value: state.report.candidates.length, icon: "⇄" },
    ];
    for (const metric of metrics) {
      const card = text("article", "", "metric");
      card.append(text("span", metric.icon, "metric-icon"), text("strong", metric.value), text("span", metric.label));
      root.append(card);
    }
  }

  function renderFindings() {
    const findings = state.report?.findings ?? [];
    const root = $("findings-body");
    root.replaceChildren();
    $("findings-state").textContent = findings.length
      ? `${findings.length} snapshot-backed finding${findings.length === 1 ? "" : "s"}. Select one to inspect its evidence chain.`
      : state.report ? "No findings are present in the supplied snapshot." : "Run a scan to populate findings.";

    const pages = Math.max(1, Math.ceil(findings.length / state.pageSize));
    state.page = Math.min(state.page, pages);
    const visible = findings.slice((state.page - 1) * state.pageSize, state.page * state.pageSize);
    for (const finding of visible) {
      const card = text("article", "", "finding-card");
      card.tabIndex = 0;
      card.setAttribute("role", "link");
      card.setAttribute("aria-label", `Inspect ${finding.advisory.id} for ${finding.package.name}`);
      card.append(
        text("div", finding.advisory.id, "finding-card-title"),
        text("div", `${finding.package.name}@${finding.package.version}\n${finding.package.direct ? "Direct dependency" : "Transitive dependency"}`, "finding-card-package")
      );
      const statuses = text("div", "", "finding-badges");
      statuses.append(badge(finding.applicability), badge(finding.reachability?.status ?? "unknown"));
      card.append(statuses, text("span", "→", "finding-arrow"));
      card.addEventListener("click", () => openFinding(finding.id));
      card.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openFinding(finding.id); }
      });
      root.append(card);
    }

    const pagination = $("pagination");
    pagination.replaceChildren();
    if (pages > 1) {
      const previous = text("button", "Previous", "button button-outline");
      const next = text("button", "Next", "button button-outline");
      previous.disabled = state.page === 1;
      next.disabled = state.page === pages;
      previous.addEventListener("click", () => { state.page--; renderFindings(); });
      next.addEventListener("click", () => { state.page++; renderFindings(); });
      pagination.append(previous, text("span", `Page ${state.page} of ${pages}`), next);
    }
  }

  function openFinding(id) {
    state.selectedFindingId = id;
    location.hash = "finding";
  }

  function createDetails(title, content, open = false) {
    const details = document.createElement("details");
    details.className = "deep-section";
    details.open = open;
    details.append(text("summary", title));
    const body = text("div", "", "deep-content");
    body.append(content);
    details.append(body);
    return details;
  }

  function createSummaryCard(summary) {
    const card = text("article", "", "summary-card");
    const header = text("div", "", "summary-card-header");
    const title = text("div", "", "summary-card-title");
    title.append(text("span", "✦", "summary-icon"), text("span", "Plain-English summary"), text("span", "Rule-based · structured fields", "summary-chip"));
    header.append(title, text("span", "Explore each step", "muted"));

    if (!summary) {
      card.append(header, text("div", "Summary data is not available for this finding.", "summary-panel"));
      return card;
    }

    const steps = [
      { key: "what", label: "What happened" },
      { key: "why", label: "Why it matters" },
      { key: "where", label: "Where it is" },
      { key: "how", label: "What to do" },
    ];
    const tabs = text("div", "", "summary-tabs");
    tabs.setAttribute("role", "tablist");
    const panel = text("div", "", "summary-panel");
    panel.setAttribute("role", "tabpanel");
    const progress = text("div", "", "summary-progress");
    const progressBar = text("span", "");
    progress.append(progressBar);

    const selectStep = index => {
      const step = steps[index];
      tabs.querySelectorAll("button").forEach((button, buttonIndex) => button.setAttribute("aria-selected", String(buttonIndex === index)));
      panel.replaceChildren(text("p", summary[step.key] ?? ""));
      panel.setAttribute("aria-label", step.label);
      progressBar.style.width = `${((index + 1) / steps.length) * 100}%`;
    };

    steps.forEach((step, index) => {
      const button = text("button", step.label, "summary-tab");
      button.type = "button";
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", "false");
      button.addEventListener("click", () => selectStep(index));
      button.addEventListener("keydown", event => {
        if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        const next = (index + (event.key === "ArrowRight" ? 1 : steps.length - 1)) % steps.length;
        tabs.children[next].focus();
        selectStep(next);
      });
      tabs.append(button);
    });

    card.append(header, tabs, panel, progress);
    selectStep(0);
    return card;
  }

  function createAiCard(finding) {
    const card = text("article", "", "ai-card");
    const header = text("div", "", "ai-header");
    const heading = text("div", "", "ai-title");
    const headingText = text("div", "");
    headingText.append(text("h2", "AI explanation"), text("small", "Optional prose · not authoritative"));
    heading.append(text("span", "✦", "ai-avatar"), headingText);
    const button = text("button", "Ask AI to explain", "button button-outline");
    header.append(heading, button);

    const thread = text("div", "", "ai-thread");
    thread.append(text("div", "Ask for an additional plain-language explanation based on this finding’s structured fields.", "bubble bubble-system"));
    card.append(header, thread);

    button.addEventListener("click", async () => {
      button.disabled = true;
      button.textContent = "Generating…";
      const loading = text("div", "", "bubble bubble-system");
      loading.setAttribute("aria-label", "Generating explanation");
      const typing = text("span", "", "typing");
      typing.append(text("i", ""), text("i", ""), text("i", ""));
      loading.append(typing);
      thread.append(loading);

      try {
        const response = await fetch("/api/ai-explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ findingId: finding.id, mode: state.scanMode }),
        });
        const data = await response.json();
        loading.remove();
        if (!response.ok) {
          thread.append(text("div", data.message || data.error || "The explanation could not be generated.", "bubble bubble-system bubble-error"));
          button.disabled = false;
          button.textContent = "Try again";
          return;
        }
        thread.append(text("div", data.explanation, "bubble bubble-ai"));
        button.hidden = true;
      } catch {
        loading.remove();
        thread.append(text("div", "The explanation service could not be reached.", "bubble bubble-system bubble-error"));
        button.disabled = false;
        button.textContent = "Try again";
      }
    });
    return card;
  }

  function createSignalCard(finding) {
    if (!String(finding.advisory.id).startsWith("SIGNAL-")) return null;
    const card = text("article", "", "panel signal-card");
    card.append(text("h2", `Supply-chain signal · ${finding.advisory.id}`));
    if (finding.summary?.what) card.append(text("p", finding.summary.what));
    const list = text("ul", "", "signal-list");
    for (const item of finding.uncertainty ?? []) list.append(text("li", item));
    if (list.childElementCount) card.append(list);
    return card;
  }

  function createImpact(finding) {
    const impact = finding.downstreamImpact;
    if (!impact) return null;
    const content = text("div", "");
    const summary = text("div", "", "impact-summary");
    const number = text("div", "", "impact-number");
    number.append(text("strong", impact.totalPaths ?? 0));
    summary.append(number, text("p", `${impact.totalPaths ?? 0} recorded dependency path${impact.totalPaths === 1 ? "" : "s"} connect this package to the application in the supplied graph.`));
    content.append(summary);

    if (impact.graph?.nodes?.length) {
      const container = text("div", "", "flowchart-container");
      const levels = [];
      for (const node of impact.graph.nodes) {
        while (levels.length <= node.level) levels.push([]);
        levels[node.level].push(node);
      }
      const nodeElements = new Map();
      for (const level of levels) {
        const column = text("div", "", "flowchart-level");
        for (const node of level) {
          const element = text("div", node.name, "flowchart-node");
          if (node.isApp) element.classList.add("app-node");
          if (node.isCompromised) element.classList.add("compromised-node");
          nodeElements.set(node.id, element);
          column.append(element);
        }
        container.append(column);
      }

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "flowchart-edges");
      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
      marker.setAttribute("id", `arrow-${String(finding.id).replace(/[^a-zA-Z0-9]/g, "-")}`);
      marker.setAttribute("markerWidth", "10"); marker.setAttribute("markerHeight", "7"); marker.setAttribute("refX", "9"); marker.setAttribute("refY", "3.5"); marker.setAttribute("orient", "auto");
      const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      polygon.setAttribute("points", "0 0, 10 3.5, 0 7"); polygon.setAttribute("fill", "#6c7c6e");
      marker.append(polygon); defs.append(marker); svg.append(defs); container.append(svg);

      const drawLines = () => {
        svg.replaceChildren(defs);
        const containerRect = container.getBoundingClientRect();
        for (const edge of impact.graph.edges ?? []) {
          const from = nodeElements.get(edge.from);
          const to = nodeElements.get(edge.to);
          if (!from || !to) continue;
          const fromRect = from.getBoundingClientRect();
          const toRect = to.getBoundingClientRect();
          const x1 = fromRect.right - containerRect.left;
          const y1 = fromRect.top - containerRect.top + fromRect.height / 2;
          const x2 = toRect.left - containerRect.left - 9;
          const y2 = toRect.top - containerRect.top + toRect.height / 2;
          const midpoint = (x1 + x2) / 2;
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", `M ${x1} ${y1} C ${midpoint} ${y1}, ${midpoint} ${y2}, ${x2} ${y2}`);
          path.setAttribute("stroke", "#6c7c6e"); path.setAttribute("stroke-width", "1.5"); path.setAttribute("fill", "none");
          path.setAttribute("marker-end", `url(#${marker.id})`);
          svg.append(path);
        }
      };
      if ("ResizeObserver" in window) new ResizeObserver(drawLines).observe(container);
      requestAnimationFrame(drawLines);
      content.append(container);
    }
    return createDetails("Dependency graph impact", content);
  }

  function renderFinding() {
    const root = $("finding-detail");
    root.replaceChildren();
    root.className = "finding-stack";
    const finding = state.report?.findings.find(item => item.id === state.selectedFindingId) ?? state.report?.findings[0];
    if (!finding) {
      root.className = "empty-state";
      root.textContent = state.report ? "This scan has no findings to inspect." : "Run a scan, then select a finding.";
      return;
    }
    state.selectedFindingId = finding.id;

    const sticky = text("article", "", "finding-sticky");
    const identity = text("div", "");
    identity.append(text("h2", finding.advisory.id), text("p", `${finding.package.name}@${finding.package.version} · ${finding.package.direct ? "direct" : "transitive"}`));
    const statuses = text("div", "", "finding-badges");
    statuses.append(badge(finding.applicability), badge(finding.reachability?.status ?? "unknown"));
    sticky.append(identity, statuses);
    root.append(sticky, createSummaryCard(finding.summary), createAiCard(finding));

    const signal = createSignalCard(finding);
    if (signal) root.append(signal);
    const impact = createImpact(finding);
    if (impact) root.append(impact);

    const reachability = text("div", "");
    const status = finding.reachability?.status;
    const reachabilityText = status === "potential_path_found"
      ? "A supported static invocation path was found from the declared entry point."
      : status === "no_path_found_in_scope"
        ? "No path was found within the supported analysed scope. This does not mean unreachable or safe."
        : "Unsupported or missing source behavior prevents a confident negative.";
    reachability.append(text("p", reachabilityText));
    if (finding.reachability?.unsupportedPatterns?.length) {
      const list = document.createElement("ul");
      for (const gap of finding.reachability.unsupportedPatterns) list.append(text("li", `${gap.pattern}: ${gap.reason}`));
      reachability.append(list);
    }
    root.append(createDetails("Bounded reachability evidence", reachability, true));

    const evidence = document.createElement("ul");
    for (const item of finding.evidence ?? []) evidence.append(text("li", `${item.kind} · ${item.locator} · sha256:${String(item.contentDigest).slice(0, 16)}…`));
    if (!evidence.childElementCount) evidence.append(text("li", "No finding-level evidence references were supplied."));
    root.append(createDetails("Evidence references", evidence));

    const uncertainty = document.createElement("ul");
    for (const item of finding.uncertainty ?? []) uncertainty.append(text("li", item));
    if (!uncertainty.childElementCount) uncertainty.append(text("li", "No additional uncertainty was recorded."));
    root.append(createDetails("Remaining uncertainty", uncertainty));
  }

  function criterion(value, stateName = "pass") {
    const root = text("div", "", "criterion");
    const icon = text("span", stateName === "pass" ? "✓" : stateName === "fail" ? "×" : "?", `criterion-icon ${stateName}`);
    root.append(icon, text("p", value));
    return root;
  }

  function renderCandidates() {
    const root = $("candidate-list");
    root.replaceChildren();
    const candidates = state.report?.candidates ?? [];
    if (!candidates.length) {
      root.append(text("div", state.report ? "No candidates were supplied for this scan." : "Run a scan to generate candidates.", "empty-state"));
      return;
    }

    const matrix = text("div", "", "matrix-grid");
    matrix.style.setProperty("--candidate-count", candidates.length);
    matrix.style.setProperty("--matrix-columns", candidates.length + 1);
    matrix.append(text("div", "Candidate", "matrix-cell matrix-label"));
    for (const candidate of candidates) {
      const header = text("div", "", `matrix-cell matrix-candidate ${candidate.decision}`);
      header.append(badge(candidate.decision), text("h2", candidate.proposedVersion, "candidate-version"), text("div", `${candidate.packageName} · from ${candidate.currentVersion}`, "candidate-current"));
      matrix.append(header);
    }

    const rows = [
      {
        label: "Decision rationale",
        render: candidate => criterion(candidate.reason, candidate.decision === "accepted" ? "pass" : candidate.decision === "rejected" ? "fail" : "unknown"),
      },
      {
        label: "Advisory applicability",
        tip: "Whether the supplied advisory snapshot includes the proposed version.",
        render: candidate => criterion(displayValue(candidate.advisoryApplicability), candidate.advisoryApplicability === "not_applicable" ? "pass" : candidate.advisoryApplicability === "applicable" ? "fail" : "unknown"),
      },
      {
        label: "Compatibility check",
        tip: "Only recorded test state is shown; no result is inferred.",
        render: candidate => criterion(`${displayValue(candidate.compatibilityTestState)} · ${candidate.verifiedUnderSpecifiedChecks ? "verified under specified checks" : "not verified under specified checks"}`, candidate.verifiedUnderSpecifiedChecks ? "pass" : "unknown"),
      },
      {
        label: "Remaining uncertainty",
        render: candidate => criterion(candidate.uncertainty?.length ? candidate.uncertainty.join(" · ") : "No candidate uncertainty recorded", candidate.uncertainty?.length ? "unknown" : "pass"),
      },
      {
        label: "Evidence",
        render: candidate => {
          const refs = candidate.evidence ?? [];
          return criterion(refs.length ? refs.map(item => `${item.kind}: ${item.locator}`).join("\n") : "No candidate evidence references supplied", refs.length ? "pass" : "unknown");
        },
      },
    ];

    for (const row of rows) {
      const label = text("div", "", "matrix-cell matrix-label");
      label.append(document.createTextNode(row.label));
      if (row.tip) {
        const tip = text("span", "i", "info-tip");
        tip.title = row.tip;
        tip.setAttribute("aria-label", row.tip);
        label.append(tip);
      }
      matrix.append(label);
      for (const candidate of candidates) {
        const cell = text("div", "", "matrix-cell");
        cell.append(row.render(candidate));
        matrix.append(cell);
      }
    }
    root.append(matrix);
  }

  function renderAudit() {
    $("audit-preview").textContent = state.report ? JSON.stringify(state.report, null, 2) : "Run a scan to preview the audit record.";
  }

  function downloadAudit() {
    if (!state.report) return;
    const blob = new Blob([JSON.stringify(state.report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `depcheck-audit-${state.report.scan.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function runScan(imported = false, mode = "default") {
    if (location.protocol === "file:") { $("connection-banner").hidden = false; location.hash = "scan"; return; }
    const primaryButton = imported ? $("import-button") : mode === "attack" ? $("scan-attack-button") : $("scan-button");
    const buttons = [$("scan-button"), $("scan-attack-button"), $("import-button")];
    const labels = buttons.map(button => button.textContent);
    buttons.forEach(button => { button.disabled = true; });
    primaryButton.textContent = "Scanning…";
    $("scan-message").textContent = "Parsing bounded local inputs…";
    $("engine-status").lastChild.textContent = " Engine running";
    try {
      let response;
      if (imported) {
        const lockfile = $("lockfile-input").files[0];
        const source = $("source-input").files[0];
        if (!lockfile) throw new Error("Choose a package-lock.json first, or run the deterministic scan.");
        if (lockfile.size > 524288 || (source && source.size > 524288)) throw new Error("Each file must be 512 KiB or smaller.");
        const session = await fetch("/api/session").then(result => result.json());
        response = await fetch("/api/import", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Depcheck-Token": session.token },
          body: JSON.stringify({ lockfile: await lockfile.text(), source: source ? await source.text() : undefined }),
          signal: AbortSignal.timeout(20000),
        });
      } else {
        const endpoint = mode === "attack" ? "/api/scan-results?mode=attack" : "/api/scan-results";
        response = await fetch(endpoint, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
      }
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "SCAN_FAILED");
      state.report = payload;
      state.selectedFindingId = payload.findings[0]?.id ?? null;
      state.page = 1;
      state.scanMode = imported ? "default" : mode;
      storageSet(sessionStorage, "depcheck-audit-report", preferences.remember ? JSON.stringify(payload) : null);
      $("top-export").disabled = false;
      $("page-export").disabled = false;
      $("engine-status").lastChild.textContent = " Engine complete";
      $("scan-message").textContent = `Completed ${payload.scan.id} from ${payload.advisorySnapshot.id}.`;
      renderMetrics(); renderFindings(); renderCandidates(); renderAudit();
      location.hash = "summary";
    } catch (error) {
      $("engine-status").lastChild.textContent = " Scan not completed";
      $("scan-message").textContent = `Scan failed: ${error instanceof Error ? error.message : "SCAN_FAILED"}. Check that npm run dev is running and retry. Any previous report remains available.`;
      location.hash = "scan";
    } finally {
      buttons.forEach((button, index) => { button.disabled = false; button.textContent = labels[index]; });
    }
  }

  const systemTheme = matchMedia("(prefers-color-scheme: light)");
  function applyPreferences() {
    document.documentElement.dataset.theme = preferences.theme === "system" ? (systemTheme.matches ? "light" : "dark") : preferences.theme;
    document.documentElement.dataset.contrast = preferences.contrast;
    state.pageSize = Number(preferences.pageSize);
    state.page = 1;
    renderFindings();
  }

  $("theme-setting").value = preferences.theme;
  $("contrast-setting").value = preferences.contrast;
  $("pagesize-setting").value = String(state.pageSize);
  $("remember-setting").checked = preferences.remember;
  for (const id of ["theme-setting", "contrast-setting", "pagesize-setting", "remember-setting"]) {
    $(id).addEventListener("change", () => {
      preferences = {
        theme: $("theme-setting").value,
        contrast: $("contrast-setting").value,
        pageSize: Number($("pagesize-setting").value),
        remember: $("remember-setting").checked,
      };
      storageSet(localStorage, "depcheck-settings", JSON.stringify(preferences));
      storageSet(sessionStorage, "depcheck-audit-report", preferences.remember && state.report ? JSON.stringify(state.report) : null);
      applyPreferences();
      $("settings-message").textContent = "Preferences applied.";
    });
  }
  systemTheme.addEventListener("change", applyPreferences);

  $("clear-report").addEventListener("click", () => {
    state.report = null;
    state.selectedFindingId = null;
    state.scanMode = "default";
    storageSet(sessionStorage, "depcheck-audit-report", null);
    $("top-export").disabled = true;
    $("page-export").disabled = true;
    $("engine-status").lastChild.textContent = " Engine idle";
    $("scan-message").textContent = "Report cleared. Choose the demo or import files to start again.";
    renderMetrics(); renderFindings(); renderFinding(); renderCandidates(); renderAudit();
    $("settings-message").textContent = "Current report cleared.";
  });

  $("connection-banner").hidden = location.protocol !== "file:";
  applyPreferences();
  window.addEventListener("hashchange", route);
  $("scan-button").addEventListener("click", () => runScan(false, "default"));
  $("scan-attack-button").addEventListener("click", () => runScan(false, "attack"));
  $("import-button").addEventListener("click", () => runScan(true));
  $("top-export").addEventListener("click", downloadAudit);
  $("page-export").addEventListener("click", downloadAudit);

  if (state.report) {
    $("top-export").disabled = false;
    $("page-export").disabled = false;
    $("engine-status").lastChild.textContent = " Engine complete";
    $("scan-message").textContent = `Restored ${state.report.scan.id} from this browser session.`;
    renderMetrics(); renderCandidates(); renderAudit();
  }
  route();
  renderFindings();
})();
