const KEY = "silksong-decrypted-setup-v2";
const UP = "https://github.com/Batatvideogames/silksong-archipelago-randomizer";
const DOWNLOAD = "https://github.com/Decryptu/silksong-decrypted/releases/download/v0.5.5-rc.2";
const CODE = "01a1bd74-2ab1-af6c-d1e3-7d4c97d62492";

const STEPS = {
  cogfly: [
    ["cf-get", "Install Cogfly", `Get the <a href="https://github.com/Nix-main/Cogfly/releases/latest">latest Cogfly</a>.`],
    ["cf-path", "Check the game path", "In Cogfly settings, confirm the Silksong folder is correct."],
    ["cf-code", "Import the profile", `Profiles → Import from code → <code>${CODE}</code>. If you get a 502 error, switch to r2modman.`],
    ["cf-update", "Update mods", "Press Update Mods, then launch from Cogfly."]
  ],
  r2: [
    ["r2-get", "Install r2modman", `Get <a href="https://r2modman.com/download-latest/">r2modman</a> and pick Hollow Knight: Silksong.`],
    ["r2-code", "Import the profile", `Import / Update → From code → <code>${CODE}</code>.`],
    ["r2-update", "Update mods", "Press Update Mods, then launch modded."]
  ],
  manual: [
    ["mn-bep", "Install BepInEx 5 (Windows x64)", `Extract Windows x64 <a href="https://github.com/BepInEx/BepInEx/releases">BepInEx 5</a> (5.4.23.x, not BepInEx 6) next to <code>Hollow Knight Silksong.exe</code>. Launch Silksong once, then close it.`],
    ["mn-plugin", "Add the Silksong Decrypted plugin", `Extract <a href="${DOWNLOAD}/SilksongDecrypted-0.5.5-rc.2.zip">SilksongDecrypted-0.5.5-rc.2.zip</a> into the game folder and confirm <code>BepInEx/plugins/SilksongDecrypted/SilksongRandomizer.dll</code> exists. Remove any other Silksong randomizer plugin first.`]
  ],
  host: [
    ["ap-launcher", "Install Archipelago", `Get the <a href="https://github.com/ArchipelagoMW/Archipelago/releases/latest">Archipelago launcher</a> (0.6.8 or newer).`],
    ["h-players", "Collect every YAML", "Put all players' <code>.yaml</code> files in Archipelago's <code>Players</code> folder (each with a unique slot name)."],
    ["h-gen", "Generate the seed", "Press Generate in Archipelago Launcher. The room <code>.zip</code> lands in the <code>output</code> folder."],
    ["h-room", "Open a room", `Upload the <code>.zip</code> at <a href="https://archipelago.gg/uploads">archipelago.gg/uploads</a> (or open it in Archipelago Server for local play) and share the host, port, and slot names.`]
  ],
  join: [
    ["j-connect", "Connect in game", "Launch Silksong, open the <b>F3</b> panel, and enter the room host, port, assigned slot name, and password if required. Connect and start a new randomizer save in an empty slot."],
    ["j-stuck", "Know the in-game shortcuts", "<b>F3</b> connection, hints &amp; reports · <b>F4</b> warp to a hub if stuck · <b>F6</b> map reachability logic · <b>F9</b> recent items · In Act 3, rest on your Bellhome bed and hold Dash + press Needolin to revisit Act 2."]
  ],
  report: [
    ["j-report", "Share your playtest report", "When you finish your run or hit a bug, open <b>F3 → Playtest → Save Playtest Report</b>, click <b>Open Reports Folder</b>, and share the ZIP file (session logs are also auto-saved under <code>BepInEx/SilksongDecrypted/logs</code>)."]
  ]
};

const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
const save = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} };
let state = Object.assign({ role: null, install: null, done: {} }, load());

const $ = id => document.getElementById(id);

function buildSteps() {
  if (!state.role || !state.install) return [];
  const yamlStep = [
    "ap-yaml",
    "Make your options file",
    state.role === "host"
      ? `Use the <a href="./yaml.html">Silksong Decrypted YAML Generator</a> to pick a preset or customize options and download your <code>.yaml</code>.`
      : `Use the <a href="./yaml.html">Silksong Decrypted YAML Generator</a> to customize your options and download your <code>.yaml</code>, then send it to your host. (No Archipelago Launcher install is needed just to play.)`
  ];
  const worldStep = [
    "ap-world",
    "Add the matching Silksong world",
    state.install === "manual"
      ? `Drag <a href="${DOWNLOAD}/silksong.apworld">silksong.apworld</a> onto Archipelago Launcher, then restart it. Keep only one Silksong APWorld installed.`
      : `Install the <code>.apworld</code> from the <a href="${UP}/releases/latest">upstream release</a> that matches your plugin, then restart the launcher.`
  ];
  return [
    ...STEPS[state.install],
    ...(state.role === "host" ? [STEPS.host[0], worldStep] : []),
    yamlStep,
    ...(state.role === "host" ? STEPS.host.slice(1) : []),
    ...STEPS.join,
    ...(state.install === "manual" ? STEPS.report : [])
  ];
}

function render() {
  for (const name of ["role", "install"]) {
    document.querySelectorAll(`input[name=${name}]`).forEach(i => { i.checked = i.value === state[name]; });
  }
  const list = buildSteps();
  $("hint").hidden = list.length > 0;
  $("steps").innerHTML = list.map(([id, t, d]) =>
    `<li><label><input type="checkbox" data-id="${id}" ${state.done[id] ? "checked" : ""}><div><b>${t}</b><span>${d}</span></div></label></li>`).join("");
  const n = list.filter(([id]) => state.done[id]).length;
  $("count").textContent = `${n} / ${list.length}`;
  $("fill").style.width = list.length ? `${(n / list.length) * 100}%` : "0";
}

document.addEventListener("change", e => {
  const t = e.target;
  if (t.name === "role" || t.name === "install") state[t.name] = t.value;
  else if (t.dataset.id) state.done[t.dataset.id] = t.checked;
  else return;
  save(state); render();
});
$("reset").addEventListener("click", () => { state = { role: null, install: null, done: {} }; save(state); render(); });
render();
