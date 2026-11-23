const KEY = "silksong-decrypted-setup-v2";
const UP = "https://github.com/Batatvideogames/silksong-archipelago-randomizer";
const DOWNLOAD = "https://github.com/Decryptu/silksong-decrypted/releases/download/v0.5.5-rc.1";
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
    ["mn-bep", "Install BepInEx", `Extract <a href="https://github.com/BepInEx/BepInEx/releases">BepInEx 5</a> next to the game .exe. Launch once, then close.`],
    ["mn-plugin", "Add the randomizer", `Extract the <a href="${DOWNLOAD}/SilksongDecrypted-0.5.5-rc.1-336c6bf.zip">Silksong Decrypted plugin ZIP</a> into the game folder.`]
  ],
  common: [
    ["ap-launcher", "Install Archipelago", `Get the <a href="https://github.com/ArchipelagoMW/Archipelago/releases/latest">Archipelago launcher</a> (0.6.8 or newer).`],
    ["ap-yaml", "Make your options file", `Use the <a href="./yaml.html">Silksong Decrypted YAML Generator</a> (or Archipelago's Options Creator) to export your <code>.yaml</code>. Send it to your host, or keep it if you host.`]
  ],
  host: [
    ["h-players", "Collect every YAML", "Put all players' option files in Archipelago's Players folder."],
    ["h-gen", "Generate the seed", "Press Generate. The .zip lands in the output folder."],
    ["h-room", "Open a room", `Upload the .zip at <a href="https://archipelago.gg/uploads">archipelago.gg/uploads</a> and share the room address.`]
  ],
  join: [
    ["j-connect", "Connect in game", "Launch Silksong, open the F3 panel, and enter the room host, port, assigned slot name, and password if required. Connect and select an empty save slot."],
    ["j-stuck", "Know the escape key", "Stuck? Press F4 to warp to a home point."]
  ]
};

const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
const save = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} };
let state = Object.assign({ role: null, install: null, done: {} }, load());

const $ = id => document.getElementById(id);

function render() {
  for (const name of ["role", "install"]) {
    document.querySelectorAll(`input[name=${name}]`).forEach(i => { i.checked = i.value === state[name]; });
  }
  const ready = state.role && state.install;
  $("hint").hidden = !!ready;
  const list = ready
    ? [
        ...STEPS[state.install],
        STEPS.common[0],
        ["ap-world", "Add the matching Silksong world", state.install === "manual"
          ? `Drag <a href="${DOWNLOAD}/silksong.apworld">silksong.apworld</a> onto the launcher, then restart it.`
          : `Install the <code>.apworld</code> from the <a href="${UP}/releases/latest">upstream release</a> that matches your plugin, then restart the launcher.`],
        STEPS.common[1],
        ...(state.role === "host" ? STEPS.host : []),
        ...STEPS.join
      ]
    : [];
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
