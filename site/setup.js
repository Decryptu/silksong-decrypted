const KEY = "silksong-decrypted-setup-v2";
const DOWNLOAD = "https://github.com/Decryptu/silksong-decrypted/releases/download/v0.5.5-rc.3";

const STEPS = {
  manual: [
    ["mn-bep", "Install BepInEx 5 (Windows x64)", `Extract Windows x64 <a href="https://github.com/BepInEx/BepInEx/releases">BepInEx 5</a> (5.4.23.x, not BepInEx 6) next to <code>Hollow Knight Silksong.exe</code>. Launch Silksong once, then close it.`],
    ["mn-plugin", "Add the Silksong Decrypted plugin", `Extract <a href="${DOWNLOAD}/SilksongDecrypted-0.5.5-rc.3.zip">SilksongDecrypted-0.5.5-rc.3.zip</a> into the game folder and confirm <code>BepInEx/plugins/SilksongDecrypted/SilksongRandomizer.dll</code> exists. Remove any other Silksong randomizer plugin first, including one installed by Cogfly or r2modman (their profile codes install the upstream mod, not Silksong Decrypted).`]
  ],
  host: [
    ["ap-launcher", "Install Archipelago", `Get the <a href="https://github.com/ArchipelagoMW/Archipelago/releases/latest">Archipelago launcher</a> (0.6.8 or newer; older versions cannot load the Silksong world).`],
    ["h-players", "Put every YAML in the Players folder", `In Archipelago Launcher, click <b>Browse Files</b> to open the Archipelago folder (usually <code>C:\\ProgramData\\Archipelago</code>), then open <code>Players</code>. Put your own <code>.yaml</code> and every other player's <code>.yaml</code> there. Each file needs a different <code>name</code>. Move out any old YAMLs you don't want in this game: <b>every</b> <code>.yaml</code> in <code>Players</code> becomes a slot. Playing solo? Just your one YAML.`],
    ["h-gen", "Generate the seed", `Back in Archipelago Launcher, click <b>Generate</b>. A console window opens; wait for it to finish without errors and close. The seed is a file named like <code>AP_12345678901234567890.zip</code> in the <code>output</code> folder next to <code>Players</code>. Don't unzip it. <br><b>Got <code>File Hornet.yaml is invalid. Please fix your yaml</code>?</b> Your YAML is usually fine: Archipelago can't find the Silksong world. Update Archipelago to <b>0.6.8 or newer</b> (older versions refuse this world), drag <code>silksong.apworld</code> onto the Launcher again, and fully close and reopen the Launcher before pressing Generate.`],
    ["h-room", "Open a room", `<b>Online:</b> upload the <code>AP_….zip</code> at <a href="https://archipelago.gg/uploads">archipelago.gg/uploads</a>, click <b>Create New Room</b>, and share the room's address (for example <code>archipelago.gg:38281</code>: host <code>archipelago.gg</code>, port <code>38281</code>) with each player's slot name. <b>Same PC only:</b> click <b>Host</b> in Archipelago Launcher, pick the <code>.zip</code>, and connect to <code>127.0.0.1</code> with the port shown in the server window (default <code>38281</code>); keep that window open while playing.`]
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
let state = Object.assign({ role: null, done: {} }, load());

const $ = id => document.getElementById(id);

function buildSteps() {
  if (!state.role) return [];
  const yamlStep = [
    "ap-yaml",
    "Make your options file",
    state.role === "host"
      ? `Use the <a href="./yaml.html">Silksong Decrypted YAML Generator</a> to pick a preset or customize options and download your <code>.yaml</code>.`
      : `Use the <a href="./yaml.html">Silksong Decrypted YAML Generator</a> to customize your options and download your <code>.yaml</code>, then send that <code>.yaml</code> file to your host. The host generates the seed and sends you back a room address. (No Archipelago Launcher install is needed just to play. Playing solo? Pick <b>Hosting a game</b> instead: you generate your own seed.)`
  ];
  const worldStep = [
    "ap-world",
    "Add the matching Silksong world",
    `Drag <a href="${DOWNLOAD}/silksong.apworld">silksong.apworld</a> onto Archipelago Launcher, then restart it. Keep only one Silksong APWorld installed.`
  ];
  return [
    ...STEPS.manual,
    ...(state.role === "host" ? [STEPS.host[0], worldStep] : []),
    yamlStep,
    ...(state.role === "host" ? STEPS.host.slice(1) : []),
    ...STEPS.join,
    ...STEPS.report
  ];
}

function render() {
  for (const name of ["role"]) {
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
  if (t.name === "role") state.role = t.value;
  else if (t.dataset.id) state.done[t.dataset.id] = t.checked;
  else return;
  save(state); render();
});
$("reset").addEventListener("click", () => { state = { role: null, done: {} }; save(state); render(); });
render();
