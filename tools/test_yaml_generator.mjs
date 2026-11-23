import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const schema = JSON.parse(
  fs.readFileSync(path.join(ROOT, "site", "yaml-schema.json"), "utf8")
);
const core = require(path.join(ROOT, "site", "yaml-core.js"));

test("schema covers every group option cleanly", () => {
  assert.equal(schema.game, "Hollow Knight: Silksong");
  assert.ok(Object.keys(schema.options).length >= 130);
  const seen = new Set();
  for (const group of schema.groups) {
    assert.ok(group.options.length > 0, `empty group ${group.name}`);
    for (const key of group.options) {
      assert.ok(schema.options[key], `missing option ${key}`);
      assert.ok(!seen.has(key), `duplicate option ${key}`);
      seen.add(key);
    }
  }
  assert.equal(seen.size, Object.keys(schema.options).length);
});

test("all presets validate cleanly and round-trip in compact and full YAML", () => {
  for (const preset of core.PRESETS) {
    const options = core.applyPreset(schema, preset.id);
    const config = { name: "Hornet", description: preset.name, presetName: preset.name, options };
    const result = core.validateConfig(schema, config);
    assert.equal(
      result.errors.length,
      0,
      `Preset ${preset.id} had errors: ${JSON.stringify(result.errors)}`
    );

    for (const includeDefaults of [false, true]) {
      const yamlText = core.serializeYaml(schema, config, { includeDefaults, includeComments: true });
      assert.ok(yamlText.includes("name: Hornet"));
      assert.ok(yamlText.includes("game: 'Hollow Knight: Silksong'"));
      const parsed = core.parseYaml(schema, yamlText);
      assert.equal(parsed.name, "Hornet");
      assert.equal(parsed.unknownKeys.length, 0, `Unknown keys for ${preset.id}: ${parsed.unknownKeys}`);
      for (const key of Object.keys(schema.options)) {
        assert.deepEqual(
          parsed.options[key],
          options[key],
          `Round-trip mismatch on ${preset.id}.${key} (includeDefaults=${includeDefaults})`
        );
      }
    }
  }
});

test("parseYaml handles Archipelago aliases and weighted choice blocks", () => {
  const sample = `
name: Lace
game: 'Hollow Knight: Silksong'
'Hollow Knight: Silksong':
  accessibility: locations
  goal:
    act_1: 0
    act_2: 50
    act_3: 0
  skill_randomization: anywhere
  crest_randomization: vanilla
  progression_balancing: extreme
  wish_plando:
    "Wish: Berry Picking": "Wish: Final Audience"
`;
  const parsed = core.parseYaml(schema, sample);
  assert.equal(parsed.name, "Lace");
  assert.equal(parsed.options.accessibility, "full");
  assert.equal(parsed.options.goal, "act_2");
  assert.equal(parsed.options.skill_randomization, true);
  assert.equal(parsed.options.crest_randomization, false);
  assert.equal(parsed.options.progression_balancing, 99);
  assert.deepEqual(parsed.options.wish_plando, {
    "Wish: Berry Picking": "Wish: Final Audience",
  });
});

test("validation detects incompatible combinations and quickFixes resolve them", () => {
  // 1. Force naked without crest randomization
  let opts = core.createDefaultOptions(schema);
  opts.force_naked = true;
  opts.crest_randomization = false;
  let res = core.validateConfig(schema, { name: "Hornet", options: opts });
  let err = res.errors.find((e) => e.code === "force_naked_requires_crest_rando");
  assert.ok(err, "expected force_naked error");
  Object.assign(opts, err.quickFix.patch);
  res = core.validateConfig(schema, { name: "Hornet", options: opts });
  assert.equal(res.errors.length, 0);

  // 2. Songclave on Act 1
  opts = core.createDefaultOptions(schema);
  opts.goal = "act_1";
  opts.starting_location = "songclave";
  res = core.validateConfig(schema, { name: "Hornet", options: opts });
  err = res.errors.find((e) => e.code === "songclave_requires_act2");
  assert.ok(err, "expected songclave act_1 error");
  Object.assign(opts, err.quickFix.patch);
  res = core.validateConfig(schema, { name: "Hornet", options: opts });
  assert.equal(res.errors.length, 0);

  // 3. Songclave with small Flea Hunt count
  opts = core.createDefaultOptions(schema);
  opts.goal = "flea_hunt";
  opts.flea_hunt_count = 5;
  opts.starting_location = "songclave";
  res = core.validateConfig(schema, { name: "Hornet", options: opts });
  assert.ok(res.errors.some((e) => e.code === "songclave_short_hunt"));

  // 4. Invalid Spelling Bee phrase
  opts = core.createDefaultOptions(schema);
  opts.goal = "spelling_bee";
  opts.spelling_bee_phrase = "12345";
  res = core.validateConfig(schema, { name: "Hornet", options: opts });
  err = res.errors.find((e) => e.code === "invalid_spelling_bee_phrase");
  assert.ok(err, "expected invalid_spelling_bee_phrase error");
  Object.assign(opts, err.quickFix.patch);
  assert.equal(opts.spelling_bee_phrase, "Hornet");

  // 5. Boss + NPC souls without extra filler caches
  opts = core.createDefaultOptions(schema);
  opts.goal = "act_1";
  opts.boss_souls = true;
  opts.npc_souls = true;
  res = core.validateConfig(schema, { name: "Hornet", options: opts });
  err = res.errors.find((e) => e.code === "insufficient_filler_pool");
  assert.ok(err, "expected insufficient_filler_pool error");
  Object.assign(opts, err.quickFix.patch);
  res = core.validateConfig(schema, { name: "Hornet", options: opts });
  assert.equal(res.errors.length, 0);

  // 6. Wish Plando without Shuffle Wish Offers
  opts = core.createDefaultOptions(schema);
  opts.wish_plando = { "Wish: Berry Picking": "Wish: Final Audience" };
  opts.shuffle_wish_offers = false;
  res = core.validateConfig(schema, { name: "Hornet", options: opts });
  err = res.errors.find((e) => e.code === "wish_plando_requires_shuffle");
  assert.ok(err);
  Object.assign(opts, err.quickFix.patch);
  res = core.validateConfig(schema, { name: "Hornet", options: opts });
  assert.equal(res.errors.length, 0);

  // 7. Player name empty / too long
  res = core.validateConfig(schema, { name: "", options: core.createDefaultOptions(schema) });
  assert.ok(res.errors.some((e) => e.code === "empty_player_name"));
  res = core.validateConfig(schema, { name: "VeryLongPlayerName123", options: core.createDefaultOptions(schema) });
  assert.ok(res.errors.some((e) => e.code === "player_name_too_long"));

  // 8. Warnings: traps with zero weights, skill options without skill rando, steel soul cap
  opts = core.createDefaultOptions(schema);
  opts.trap_percentage = 25;
  for (const k of core.TRAP_WEIGHT_OPTIONS) opts[k] = 0;
  opts.skill_randomization = false;
  opts.split_dash_and_sprint = true;
  opts.game_mode = "steel_soul";
  opts.silk_and_soul_points = 23;
  res = core.validateConfig(schema, { name: "Hornet", options: opts });
  assert.ok(res.warnings.some((w) => w.code === "traps_all_zero_weight"));
  assert.ok(res.warnings.some((w) => w.code === "skill_options_ignored"));
  assert.ok(res.warnings.some((w) => w.code === "steel_soul_wish_points_cap"));
});

test("yaml.html contains every DOM ID referenced by yaml-ui.js and valid local asset links", () => {
  const html = fs.readFileSync(path.join(ROOT, "site", "yaml.html"), "utf8");
  const uiJs = fs.readFileSync(path.join(ROOT, "site", "yaml-ui.js"), "utf8");
  const idRefs = new Set([...uiJs.matchAll(/\$\("([^"]+)"\)/g)].map((m) => m[1]));
  assert.ok(idRefs.size > 10, "expected DOM ID references in yaml-ui.js");
  for (const id of idRefs) {
    assert.ok(
      html.includes(`id="${id}"`),
      `site/yaml.html is missing id="${id}" referenced by site/yaml-ui.js`
    );
  }

  for (const page of ["index.html", "yaml.html"]) {
    const pageHtml = fs.readFileSync(path.join(ROOT, "site", page), "utf8");
    const refs = [...pageHtml.matchAll(/(?:src|href)="\.\/([^"#?]+)"/g)].map((m) => m[1]);
    for (const rel of refs) {
      if (!rel) continue;
      assert.ok(
        fs.existsSync(path.join(ROOT, "site", rel)),
        `site/${page} references missing local asset ./${rel}`
      );
    }
  }
});
