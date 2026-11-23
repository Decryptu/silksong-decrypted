(function () {
  "use strict";

  const STORAGE_KEY = "silksong-decrypted-yaml-v1";
  const CORE = window.SilksongYaml;
  const $ = (id) => document.getElementById(id);

  let schema = null;
  let state = {
    name: "Hornet",
    description: "",
    presetId: "standard",
    options: {},
    includeDefaults: false,
    includeComments: true,
    showExperimental: false,
    changedOnly: false,
    search: "",
  };

  function loadSavedState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          name: state.name,
          description: state.description,
          presetId: state.presetId,
          options: state.options,
          includeDefaults: state.includeDefaults,
          includeComments: state.includeComments,
          showExperimental: state.showExperimental,
        })
      );
    } catch (_) {
      // Ignore storage errors in private browsing modes.
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatDescription(text) {
    if (!text) return "";
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n\n/g, "<br><br>");
  }

  function currentPresetName() {
    const found = CORE.PRESETS.find((p) => p.id === state.presetId);
    return found ? found.name : "Custom";
  }

  function hasActiveExperimentalOptions() {
    return Object.keys(schema.options).some((k) => {
      const def = schema.options[k];
      return def.experimental && !CORE.valuesEqual(state.options[k], def.default);
    });
  }

  function renderPresets() {
    const grid = $("preset-grid");
    grid.innerHTML = "";
    for (const preset of CORE.PRESETS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "preset-card" + (state.presetId === preset.id ? " active" : "");
      btn.dataset.preset = preset.id;
      btn.setAttribute("aria-pressed", state.presetId === preset.id ? "true" : "false");
      btn.innerHTML =
        `<div class="preset-top"><strong>${escapeHtml(preset.name)}</strong>` +
        `<span class="tag${preset.experimental ? " beta" : ""}">${escapeHtml(preset.tag)}</span></div>` +
        `<span class="preset-desc">${escapeHtml(preset.summary)}</span>`;
      btn.addEventListener("click", () => {
        state.presetId = preset.id;
        state.options = CORE.applyPreset(schema, preset.id);
        if (preset.experimental) {
          state.showExperimental = true;
          $("show-experimental").checked = true;
        }
        saveState();
        renderAll();
      });
      grid.appendChild(btn);
    }
  }

  function buildControl(def, value) {
    const wrap = document.createElement("div");
    wrap.className = "opt-control";

    if (def.kind === "toggle" || def.kind === "global_randomization") {
      const offLabel = def.kind === "global_randomization" ? "Vanilla" : "Off";
      const onLabel = def.kind === "global_randomization" ? "Anywhere" : "On";
      const seg = document.createElement("div");
      seg.className = "segmented";
      seg.setAttribute("role", "radiogroup");
      seg.setAttribute("aria-label", def.displayName);

      for (const [boolVal, label] of [[false, offLabel], [true, onLabel]]) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "seg-btn" + (Boolean(value) === boolVal ? " active" : "");
        b.setAttribute("aria-pressed", Boolean(value) === boolVal ? "true" : "false");
        b.textContent = label;
        b.addEventListener("click", () => {
          updateOption(def.key, boolVal);
        });
        seg.appendChild(b);
      }
      wrap.appendChild(seg);
      return wrap;
    }

    if (def.kind === "choice") {
      const select = document.createElement("select");
      select.id = `opt-${def.key}`;
      select.setAttribute("aria-label", def.displayName);
      for (const ch of def.choices) {
        const opt = document.createElement("option");
        opt.value = ch.value;
        opt.textContent = ch.label;
        if (ch.value === value) opt.selected = true;
        select.appendChild(opt);
      }
      select.addEventListener("change", () => {
        updateOption(def.key, select.value);
      });
      wrap.appendChild(select);
      return wrap;
    }

    if (def.kind === "range") {
      const row = document.createElement("div");
      row.className = "range-control";

      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = String(def.min);
      slider.max = String(def.max);
      slider.value = String(value);
      slider.setAttribute("aria-label", `${def.displayName} slider`);

      const num = document.createElement("input");
      num.type = "number";
      num.id = `opt-${def.key}`;
      num.min = String(def.min);
      num.max = String(def.max);
      num.value = String(value);
      num.setAttribute("aria-label", def.displayName);

      slider.addEventListener("input", () => {
        num.value = slider.value;
        updateOption(def.key, Number(slider.value), { skipGroupsRebuild: true });
      });
      slider.addEventListener("change", () => {
        updateOption(def.key, Number(slider.value));
      });
      num.addEventListener("change", () => {
        const parsed = Number(num.value);
        if (Number.isFinite(parsed)) {
          slider.value = String(Math.min(def.max, Math.max(def.min, Math.round(parsed))));
          updateOption(def.key, Math.round(parsed));
        }
      });

      row.appendChild(slider);
      row.appendChild(num);
      wrap.appendChild(row);

      if (def.specialValues) {
        const chips = document.createElement("div");
        chips.className = "special-chips";
        for (const [label, sVal] of Object.entries(def.specialValues)) {
          const chip = document.createElement("button");
          chip.type = "button";
          chip.className = "chip" + (Number(value) === sVal ? " active" : "");
          chip.textContent = `${label} (${sVal})`;
          chip.addEventListener("click", () => updateOption(def.key, sVal));
          chips.appendChild(chip);
        }
        wrap.appendChild(chips);
      }
      return wrap;
    }

    if (def.kind === "text") {
      const input = document.createElement("input");
      input.type = "text";
      input.id = `opt-${def.key}`;
      input.value = String(value ?? "");
      input.setAttribute("aria-label", def.displayName);
      input.addEventListener("input", () => {
        updateOption(def.key, input.value, { skipGroupsRebuild: true });
      });
      wrap.appendChild(input);
      return wrap;
    }

    if (def.kind === "dict") {
      const area = document.createElement("textarea");
      area.id = `opt-${def.key}`;
      area.rows = 3;
      area.placeholder = '{"Wish: Berry Picking": "Wish: Final Audience"}';
      area.value = Object.keys(value || {}).length ? JSON.stringify(value, null, 2) : "";
      area.setAttribute("aria-label", def.displayName);
      area.addEventListener("change", () => {
        const trimmed = area.value.trim();
        if (!trimmed) {
          area.classList.remove("invalid");
          updateOption(def.key, {});
          return;
        }
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            area.classList.remove("invalid");
            updateOption(def.key, parsed);
          } else {
            area.classList.add("invalid");
          }
        } catch (_) {
          area.classList.add("invalid");
        }
      });
      wrap.appendChild(area);
      return wrap;
    }

    return wrap;
  }

  function updateOption(key, value, opts) {
    state.options[key] = value;
    state.presetId = "custom";
    saveState();
    renderPresets();
    if (!opts || !opts.skipGroupsRebuild) {
      renderGroups();
    } else {
      syncOptionRowModifiedState(key);
    }
    renderValidationAndOutput();
  }

  function syncOptionRowModifiedState(key) {
    const def = schema.options[key];
    const row = document.querySelector(`.opt-row[data-key="${key}"]`);
    if (!row || !def) return;
    const isModified = !CORE.valuesEqual(state.options[key], def.default);
    row.classList.toggle("modified", isModified);
  }

  function renderGroups(validation) {
    const container = $("groups-container");
    const openMap = new Map();
    container.querySelectorAll("details.opt-group").forEach((el) => {
      openMap.set(el.dataset.group, el.open);
    });

    const query = state.search.trim().toLowerCase();
    const issueSeverityByField = new Map();
    if (validation) {
      for (const issue of validation.warnings) {
        for (const f of issue.fields || []) {
          if (!issueSeverityByField.has(f)) issueSeverityByField.set(f, "warning");
        }
      }
      for (const issue of validation.errors) {
        for (const f of issue.fields || []) {
          issueSeverityByField.set(f, "error");
        }
      }
    }

    container.innerHTML = "";
    let visibleTotal = 0;

    for (const group of schema.groups) {
      const visibleKeys = [];
      let changedCount = 0;

      for (const key of group.options) {
        const def = schema.options[key];
        if (!def) continue;
        const val = state.options[key];
        const isChanged = !CORE.valuesEqual(val, def.default);
        if (isChanged) changedCount += 1;

        if (def.experimental && !state.showExperimental && !isChanged) continue;
        if (state.changedOnly && !isChanged) continue;
        if (query) {
          const haystack = `${def.displayName} ${def.key} ${def.description}`.toLowerCase();
          if (!haystack.includes(query)) continue;
        }
        visibleKeys.push(key);
      }

      if (!visibleKeys.length) continue;
      visibleTotal += visibleKeys.length;

      const details = document.createElement("details");
      details.className = "opt-group" + (group.experimental ? " experimental-group" : "");
      details.dataset.group = group.id;
      if (query || state.changedOnly) {
        details.open = true;
      } else if (openMap.has(group.id)) {
        details.open = openMap.get(group.id);
      } else {
        details.open = !group.startCollapsed;
      }

      const summary = document.createElement("summary");
      summary.innerHTML =
        `<span class="group-title">${escapeHtml(group.name)}` +
        (group.experimental ? ` <span class="tag beta">Beta</span>` : "") +
        `</span>` +
        `<span class="group-meta">${changedCount ? `<span class="changed-pill">${changedCount} changed</span>` : ""}` +
        `<span>${visibleKeys.length} options</span></span>`;
      details.appendChild(summary);

      const list = document.createElement("div");
      list.className = "opt-list";

      for (const key of visibleKeys) {
        const def = schema.options[key];
        const val = state.options[key];
        const isChanged = !CORE.valuesEqual(val, def.default);
        const sev = issueSeverityByField.get(key);

        const row = document.createElement("div");
        row.className =
          "opt-row" +
          (isChanged ? " modified" : "") +
          (sev ? ` issue-${sev}` : "");
        row.dataset.key = key;

        const head = document.createElement("div");
        head.className = "opt-head";

        const infoCol = document.createElement("div");
        infoCol.className = "opt-info";

        const titleLine = document.createElement("div");
        titleLine.className = "opt-title-line";
        titleLine.innerHTML =
          `<strong>${escapeHtml(def.displayName)}</strong>` +
          `<code>${escapeHtml(def.key)}</code>` +
          (def.experimental ? `<span class="tag beta">Beta</span>` : "");

        if (isChanged) {
          const resetBtn = document.createElement("button");
          resetBtn.type = "button";
          resetBtn.className = "opt-reset";
          resetBtn.textContent = "Reset";
          resetBtn.title = `Reset ${def.displayName} to default`;
          resetBtn.addEventListener("click", () => {
            updateOption(def.key, def.kind === "dict" ? {} : def.default);
          });
          titleLine.appendChild(resetBtn);
        }

        infoCol.appendChild(titleLine);

        if (def.description) {
          const desc = document.createElement("p");
          desc.className = "opt-desc";
          desc.innerHTML = formatDescription(def.description);
          infoCol.appendChild(desc);
        }

        head.appendChild(infoCol);
        head.appendChild(buildControl(def, val));
        row.appendChild(head);
        list.appendChild(row);
      }

      details.appendChild(list);
      container.appendChild(details);
    }

    if (visibleTotal === 0) {
      container.innerHTML = `<p class="hint">No options match your current filters.</p>`;
    }
  }

  function applyQuickFix(fix) {
    if (fix.metaPatch) {
      if (typeof fix.metaPatch.name === "string") {
        state.name = fix.metaPatch.name;
        $("player-name").value = state.name;
      }
    }
    if (fix.patch) {
      for (const [k, v] of Object.entries(fix.patch)) {
        state.options[k] = v;
      }
      state.presetId = "custom";
    }
    saveState();
    renderAll();
  }

  function renderValidationAndOutput() {
    const config = {
      name: state.name,
      description: state.description,
      presetName: currentPresetName(),
      options: state.options,
    };

    const validation = CORE.validateConfig(schema, config);

    // Highlight player-name field on name errors
    const nameHasError = validation.errors.some((e) => (e.fields || []).includes("name"));
    $("player-name").classList.toggle("invalid", nameHasError);

    const pill = $("validation-pill");
    if (validation.errors.length > 0) {
      pill.textContent = `${validation.errors.length} error${validation.errors.length === 1 ? "" : "s"}`;
      pill.className = "status-pill error";
    } else if (validation.warnings.length > 0) {
      pill.textContent = `${validation.warnings.length} warning${validation.warnings.length === 1 ? "" : "s"}`;
      pill.className = "status-pill warn";
    } else {
      pill.textContent = "Ready";
      pill.className = "status-pill ok";
    }

    const budget = validation.fillerBudget;
    const fillerEl = $("filler-summary");
    if (budget.demanded > 0) {
      fillerEl.hidden = false;
      fillerEl.className = "filler-summary" + (budget.shortBy > 0 ? " short" : "");
      fillerEl.innerHTML =
        `<span>Estimated Act ${budget.act} filler slots: <strong>${budget.available}</strong> available / <strong>~${budget.demanded}</strong> needed</span>`;
    } else {
      fillerEl.hidden = true;
    }

    const listEl = $("validation-list");
    listEl.innerHTML = "";
    const allIssues = [...validation.errors, ...validation.warnings, ...validation.info];

    if (allIssues.length === 0) {
      listEl.innerHTML = `<p class="validation-ok">All options are valid and compatible with APWorld v${escapeHtml(schema.worldVersion)}.</p>`;
    } else {
      for (const issue of allIssues) {
        const card = document.createElement("div");
        card.className = `issue-card ${issue.severity}`;
        card.innerHTML =
          `<strong>${escapeHtml(issue.title)}</strong>` +
          `<p>${escapeHtml(issue.message)}</p>`;
        if (issue.quickFix) {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "btn quickfix";
          btn.textContent = issue.quickFix.label;
          btn.addEventListener("click", () => applyQuickFix(issue.quickFix));
          card.appendChild(btn);
        }
        listEl.appendChild(card);
      }
    }

    const overrideCount = Object.keys(schema.options).filter(
      (k) => !CORE.valuesEqual(state.options[k], schema.options[k].default)
    ).length;

    const filename = CORE.suggestFilename(state.name);
    $("export-filename").textContent = filename;
    $("override-count").textContent = `${overrideCount} override${overrideCount === 1 ? "" : "s"}`;

    const yamlText = CORE.serializeYaml(schema, config, {
      includeDefaults: state.includeDefaults,
      includeComments: state.includeComments,
    });
    $("yaml-preview").textContent = yamlText;

    const downloadBtn = $("download-yaml");
    downloadBtn.disabled = !validation.valid;
    downloadBtn.title = validation.valid
      ? `Download ${filename}`
      : "Resolve validation errors before downloading.";

    // Sync row highlights without rebuilding inputs during typing
    document.querySelectorAll(".opt-row").forEach((row) => {
      row.classList.remove("issue-error", "issue-warning");
    });
    for (const issue of validation.warnings) {
      for (const f of issue.fields || []) {
        const row = document.querySelector(`.opt-row[data-key="${f}"]`);
        if (row) row.classList.add("issue-warning");
      }
    }
    for (const issue of validation.errors) {
      for (const f of issue.fields || []) {
        const row = document.querySelector(`.opt-row[data-key="${f}"]`);
        if (row) {
          row.classList.remove("issue-warning");
          row.classList.add("issue-error");
        }
      }
    }
  }

  function renderAll() {
    renderPresets();
    const validation = CORE.validateConfig(schema, {
      name: state.name,
      description: state.description,
      options: state.options,
    });
    renderGroups(validation);
    renderValidationAndOutput();
  }

  function showImportStatus(message, isError) {
    const el = $("import-status");
    el.hidden = false;
    el.className = "import-status" + (isError ? " error" : "");
    el.textContent = message;
  }

  function bindEvents() {
    $("player-name").addEventListener("input", (e) => {
      state.name = e.target.value;
      saveState();
      renderValidationAndOutput();
    });

    $("player-description").addEventListener("input", (e) => {
      state.description = e.target.value;
      saveState();
      renderValidationAndOutput();
    });

    $("option-search").addEventListener("input", (e) => {
      state.search = e.target.value;
      renderGroups();
      renderValidationAndOutput();
    });

    $("filter-changed").addEventListener("change", (e) => {
      state.changedOnly = e.target.checked;
      renderGroups();
      renderValidationAndOutput();
    });

    $("show-experimental").addEventListener("change", (e) => {
      state.showExperimental = e.target.checked;
      saveState();
      renderGroups();
      renderValidationAndOutput();
    });

    $("expand-all").addEventListener("click", () => {
      document.querySelectorAll("details.opt-group").forEach((d) => { d.open = true; });
    });

    $("collapse-all").addEventListener("click", () => {
      document.querySelectorAll("details.opt-group").forEach((d) => { d.open = false; });
    });

    $("include-defaults").addEventListener("change", (e) => {
      state.includeDefaults = e.target.checked;
      saveState();
      renderValidationAndOutput();
    });

    $("include-comments").addEventListener("change", (e) => {
      state.includeComments = e.target.checked;
      saveState();
      renderValidationAndOutput();
    });

    $("reset-defaults").addEventListener("click", () => {
      state.name = "Hornet";
      state.description = "";
      state.presetId = "standard";
      state.options = CORE.createDefaultOptions(schema);
      state.includeDefaults = false;
      state.includeComments = true;
      state.showExperimental = false;
      state.search = "";
      state.changedOnly = false;
      $("player-name").value = state.name;
      $("player-description").value = state.description;
      $("include-defaults").checked = state.includeDefaults;
      $("include-comments").checked = state.includeComments;
      $("show-experimental").checked = state.showExperimental;
      $("option-search").value = "";
      $("filter-changed").checked = false;
      $("import-status").hidden = true;
      saveState();
      renderAll();
    });

    $("import-file").addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = CORE.parseYaml(schema, text);
        if (parsed.name) {
          state.name = parsed.name;
          $("player-name").value = state.name;
        }
        state.description = parsed.description || "";
        $("player-description").value = state.description;
        state.options = parsed.options;
        state.presetId = "custom";
        if (hasActiveExperimentalOptions()) {
          state.showExperimental = true;
          $("show-experimental").checked = true;
        }
        saveState();
        renderAll();
        const extra = parsed.unknownKeys.length
          ? ` Ignored ${parsed.unknownKeys.length} unrecognized key(s): ${parsed.unknownKeys.slice(0, 4).join(", ")}.`
          : "";
        showImportStatus(`Imported ${file.name}.${extra}`, false);
      } catch (err) {
        showImportStatus(`Could not read ${file.name}: ${err.message}`, true);
      }
    });

    $("download-yaml").addEventListener("click", () => {
      const config = {
        name: state.name,
        description: state.description,
        presetName: currentPresetName(),
        options: state.options,
      };
      const yamlText = CORE.serializeYaml(schema, config, {
        includeDefaults: state.includeDefaults,
        includeComments: state.includeComments,
      });
      const blob = new Blob([yamlText], { type: "text/yaml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = CORE.suggestFilename(state.name);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

    $("copy-yaml").addEventListener("click", async () => {
      const text = $("yaml-preview").textContent || "";
      const status = $("copy-status");
      try {
        await navigator.clipboard.writeText(text);
        status.hidden = false;
        status.textContent = "Copied YAML to clipboard.";
      } catch (_) {
        status.hidden = false;
        status.textContent = "Select the preview above and press Ctrl+C to copy.";
      }
      setTimeout(() => { status.hidden = true; }, 3000);
    });
  }

  async function init() {
    try {
      const resp = await fetch("./yaml-schema.json", { cache: "no-cache" });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      schema = await resp.json();
    } catch (err) {
      $("groups-container").innerHTML =
        `<p class="hint">Could not load option schema (${escapeHtml(err.message)}). Serve the site directory over HTTP.</p>`;
      return;
    }

    $("world-version").textContent = `· APWorld v${schema.worldVersion}`;

    const defaults = CORE.createDefaultOptions(schema);
    const saved = loadSavedState();
    if (saved && saved.options && typeof saved.options === "object") {
      state.name = typeof saved.name === "string" ? saved.name : "Hornet";
      state.description = typeof saved.description === "string" ? saved.description : "";
      state.presetId = typeof saved.presetId === "string" ? saved.presetId : "custom";
      state.includeDefaults = Boolean(saved.includeDefaults);
      state.includeComments = saved.includeComments !== false;
      state.showExperimental = Boolean(saved.showExperimental);
      state.options = Object.assign({}, defaults);
      for (const [k, v] of Object.entries(saved.options)) {
        if (Object.prototype.hasOwnProperty.call(schema.options, k)) {
          state.options[k] = v;
        }
      }
    } else {
      state.options = defaults;
    }

    if (hasActiveExperimentalOptions()) {
      state.showExperimental = true;
    }

    $("player-name").value = state.name;
    $("player-description").value = state.description;
    $("include-defaults").checked = state.includeDefaults;
    $("include-comments").checked = state.includeComments;
    $("show-experimental").checked = state.showExperimental;

    bindEvents();
    renderAll();
  }

  init();
}());
