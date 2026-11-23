(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.SilksongYaml = factory();
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const PRESETS = [
    {
      id: "standard",
      name: "Standard Act 3",
      summary: "Shipped APWorld defaults: Act 3 ending, randomized progression, early sprint, and full maps.",
      tag: "Default",
      experimental: false,
      overrides: {},
    },
    {
      id: "act1_quick",
      name: "Act 1 Sprint",
      summary: "Shorter Act 1 run with boosted currency drops, faster Silkheart pickups, and Silk Soar removed.",
      tag: "Short",
      experimental: false,
      overrides: {
        goal: "act_1",
        silk_soar_begone: true,
        enemy_rosary_multiplier: "x3",
        enemy_shard_multiplier: "x3",
        faster_silkheart_animation: true,
      },
    },
    {
      id: "act2_classic",
      name: "Act 2 Classic",
      summary: "Act 2 goal with Act 2 Souls shuffled and Silk Soar removed.",
      tag: "Standard",
      experimental: false,
      overrides: {
        goal: "act_2",
        silk_soar_begone: true,
        soul_randomization: true,
      },
    },
    {
      id: "flea_hunt",
      name: "Flea Hunt (15)",
      summary: "Collect 15 randomized Fleas with Vog area hints enabled.",
      tag: "Hunt",
      experimental: false,
      overrides: {
        goal: "flea_hunt",
        flea_hunt_count: 15,
        flea_randomization: true,
        vog_area_hints: 5,
      },
    },
    {
      id: "spelling_bee",
      name: "Spelling Bee",
      summary: "Alphabet Mode word hunt with extra filler checks enabled to hold all 26 letters.",
      tag: "Mode",
      experimental: false,
      overrides: {
        goal: "spelling_bee",
        spelling_bee_phrase: "Hornet",
        alphabet_mode: true,
        wish_sanity: true,
        lore_tablet_randomization: true,
      },
    },
    {
      id: "all_checks",
      name: "Full Pharloom",
      summary: "High-density Act 3 run with bosses, wishes, lore, keys, needle upgrades, caches, and 15% traps.",
      tag: "Long",
      experimental: false,
      overrides: {
        goal: "act_3",
        eva_randomization: true,
        soul_randomization: true,
        old_heart_randomization: true,
        everbloom_randomization: true,
        memento_randomization: true,
        materium_randomization: true,
        farsight_randomization: true,
        bellhome_randomization: true,
        cogheart_piece_randomization: true,
        quest_collectible_randomization: true,
        twisted_bud_randomization: true,
        needle_upgrade_randomization: true,
        pale_oil_randomization: true,
        major_key_randomization: true,
        diving_bell_key_randomization: true,
        memory_locket_randomization: true,
        craftmetal_randomization: true,
        mossberry_randomization: true,
        pollip_heart_randomization: true,
        silkeater_randomization: true,
        lore_tablet_randomization: true,
        rosary_cache_randomization: true,
        shell_shard_cache_randomization: true,
        boss_sanity: true,
        bell_shrine_sanity: true,
        wish_sanity: true,
        individual_relic_turn_ins: true,
        vog_area_hints: 10,
        trap_percentage: 15,
      },
    },
    {
      id: "experimental_chaos",
      name: "Experimental Shuffle",
      summary: "Beta souls, directional traversal, and coupled interior entrances with cache filler (verified 5-Flea preset).",
      tag: "Beta",
      experimental: true,
      overrides: {
        goal: "flea_hunt",
        flea_hunt_count: 5,
        boss_souls: true,
        enemy_souls: true,
        npc_souls: true,
        skill_randomization: true,
        ledgegrab_ability_rando: true,
        swim_ability_rando: true,
        split_dash_and_sprint: true,
        directional_swift_step: true,
        directional_ledge_grab: true,
        directional_cling_grip: true,
        directional_clawline: true,
        entrance_randomization: "coupled",
        entrance_randomization_scope: "interiors",
        rosary_cache_randomization: true,
        shell_shard_cache_randomization: true,
      },
    },
  ];

  const TRAP_WEIGHT_OPTIONS = [
    "stagger_trap_weight",
    "rosary_spill_trap_weight",
    "darkness_trap_weight",
    "cursed_crest_trap_weight",
    "muckmaggot_status_trap_weight",
    "naked_trap_weight",
    "literacy_trap_weight",
    "shader_trap_weight",
  ];

  const SKILL_DEPENDENT_OPTIONS = [
    "split_dash_and_sprint",
    "directional_cling_grip",
    "directional_swift_step",
    "directional_clawline",
    "early_sprint",
  ];

  const ACT3_ONLY_OPTIONS = [
    "old_heart_randomization",
    "everbloom_randomization",
    "farsight_randomization",
    "diving_bell_key_randomization",
  ];

  // Approximate replaceable filler contributions per act scope (1, 2, 3) when enabled.
  const FILLER_CONTRIBUTIONS = {
    base: { 1: 4, 2: 14, 3: 24 },
    start_with_maps_and_rando: { 1: 8, 2: 18, 3: 24 },
    automatic_compass_and_rando: { 1: 1, 2: 1, 3: 1 },
    start_fully_mapped_and_quill: { 1: 1, 2: 1, 3: 1 },
    wish_sanity: { 1: 8, 2: 18, 3: 24 },
    lore_tablet_randomization: { 1: 14, 2: 32, 3: 42 },
    individual_relic_turn_ins: { 1: 4, 2: 15, 3: 21 },
    frayed_rosary_string_randomization: { 1: 10, 2: 17, 3: 19 },
    rosary_string_randomization: { 1: 1, 2: 3, 3: 3 },
    rosary_necklace_randomization: { 1: 4, 2: 10, 3: 13 },
    heavy_rosary_necklace_randomization: { 1: 2, 2: 8, 3: 11 },
    pale_rosary_necklace_randomization: { 1: 0, 2: 1, 3: 2 },
    shard_bundle_randomization: { 1: 5, 2: 10, 3: 12 },
    beast_shard_randomization: { 1: 2, 2: 5, 3: 7 },
    pristine_core_randomization: { 1: 0, 2: 2, 3: 2 },
    rosary_cache_randomization: { 1: 70, 2: 160, 3: 206 },
    shell_shard_cache_randomization: { 1: 55, 2: 125, 3: 153 },
  };

  function cloneValue(value) {
    if (value && typeof value === "object") {
      return Array.isArray(value) ? value.slice() : Object.assign({}, value);
    }
    return value;
  }

  function createDefaultOptions(schema) {
    const out = {};
    for (const key of Object.keys(schema.options)) {
      out[key] = cloneValue(schema.options[key].default);
    }
    return out;
  }

  function applyPreset(schema, presetId) {
    const preset = PRESETS.find((p) => p.id === presetId);
    const options = createDefaultOptions(schema);
    if (!preset) return options;
    for (const [key, val] of Object.entries(preset.overrides)) {
      if (Object.prototype.hasOwnProperty.call(schema.options, key)) {
        options[key] = cloneValue(val);
      }
    }
    return options;
  }

  function valuesEqual(a, b) {
    if (a === b) return true;
    if (a && b && typeof a === "object" && typeof b === "object") {
      const aKeys = Object.keys(a);
      const bKeys = Object.keys(b);
      if (aKeys.length !== bKeys.length) return false;
      return aKeys.every((k) => a[k] === b[k]);
    }
    return false;
  }

  function parseSpellingBeePhrase(value) {
    if (typeof value !== "string") return null;
    for (let i = 0; i < value.length; i += 1) {
      const ch = value[i];
      const isLetter = (ch >= "A" && ch <= "Z") || (ch >= "a" && ch <= "z");
      const isPunct = ch === " " || ch === "," || ch === "." || ch === "!" || ch === "?";
      if (!isLetter && !isPunct) return null;
    }
    const phrase = value.trim().replace(/\s+/g, " ");
    if (!phrase) return null;
    const letters = [];
    const seen = new Set();
    for (const ch of phrase) {
      if (" ,.!?".includes(ch)) continue;
      const upper = ch.toUpperCase();
      if (!seen.has(upper)) {
        seen.add(upper);
        letters.push(upper);
      }
    }
    return letters.length ? { phrase, letters } : null;
  }

  function resolveEffectiveActScope(options) {
    const goal = options.goal;
    if (goal === "act_1") return { minAct: 1, maxAct: 1 };
    if (goal === "act_2" || goal === "cursed_ending") return { minAct: 2, maxAct: 2 };
    if (goal === "act_3") return { minAct: 3, maxAct: 3 };
    if (goal === "flea_hunt") {
      const count = Number(options.flea_hunt_count) || 0;
      const base = count <= 10 ? 1 : count <= 20 ? 2 : 3;
      return { minAct: base, maxAct: Math.min(3, base + 1) };
    }
    if (goal === "spelling_bee") {
      const parsed = parseSpellingBeePhrase(options.spelling_bee_phrase);
      if (!parsed) return { minAct: 2, maxAct: 2 };
      const count = parsed.letters.length;
      const base = count <= 10 ? 1 : count <= 20 ? 2 : 3;
      return { minAct: base, maxAct: Math.min(3, base + 1) };
    }
    return { minAct: 3, maxAct: 3 };
  }

  function estimateFillerBudget(schema, options) {
    const scope = resolveEffectiveActScope(options);
    const act = scope.minAct;
    const actKey = String(act);
    const counts = schema.catalogueCounts || {
      bossSouls: { "1": 13, "2": 43, "3": 46 },
      npcSouls: { "1": 47, "2": 59, "3": 59 },
    };

    const skillsAnywhere = Boolean(options.skill_randomization);
    const ledgeGrabOn = Boolean(options.ledgegrab_ability_rando || options.directional_ledge_grab);
    const spellingValid = options.goal === "spelling_bee" && parseSpellingBeePhrase(options.spelling_bee_phrase) !== null;
    const alphabetActive = Boolean(options.alphabet_mode || spellingValid);

    let demanded = 0;
    const demandParts = [];

    if (ledgeGrabOn) {
      demanded += 1;
      demandParts.push("Ledge Grab (1)");
    }
    if (options.directional_ledge_grab) {
      demanded += 1;
      demandParts.push("Directional Ledge Grab (+1)");
    }
    if (options.swim_ability_rando) {
      demanded += 1;
      demandParts.push("Swim (1)");
    }
    if (options.bind_randomization === "shared") {
      demanded += 1;
      demandParts.push("Bind Shared (1)");
    } else if (options.bind_randomization === "per_crest") {
      demanded += 7;
      demandParts.push("Bind Per Crest (7)");
    }
    if (options.diving_bell_key_randomization) {
      demanded += 1;
      demandParts.push("Diving Bell Key (1)");
    }
    if (skillsAnywhere) {
      if (options.split_dash_and_sprint) {
        demanded += 1;
        demandParts.push("Split Dash & Sprint (+1)");
      }
      if (options.directional_swift_step) {
        demanded += 1;
        demandParts.push("Directional Swift Step (+1)");
      }
      if (options.directional_cling_grip) {
        demanded += 1;
        demandParts.push("Directional Cling Grip (+1)");
      }
      if (options.directional_clawline) {
        demanded += 1;
        demandParts.push("Directional Clawline (+1)");
      }
    }
    if (options.boss_souls) {
      const n = counts.bossSouls[actKey] || 13;
      demanded += n;
      demandParts.push(`Boss Souls (~${n})`);
    }
    if (options.npc_souls) {
      const n = counts.npcSouls[actKey] || 47;
      demanded += n;
      demandParts.push(`NPC Souls (~${n})`);
    }
    if (alphabetActive) {
      demanded += 26;
      demandParts.push("Alphabet Mode (26)");
    }

    let available = FILLER_CONTRIBUTIONS.base[act];
    if (options.start_with_maps && options.map_randomization) {
      available += FILLER_CONTRIBUTIONS.start_with_maps_and_rando[act];
    }
    if (options.automatic_compass && options.compass_randomization) {
      available += FILLER_CONTRIBUTIONS.automatic_compass_and_rando[act];
    }
    if (options.start_fully_mapped && options.quill_randomization) {
      available += FILLER_CONTRIBUTIONS.start_fully_mapped_and_quill[act];
    }
    for (const [optKey, byAct] of Object.entries(FILLER_CONTRIBUTIONS)) {
      if (optKey === "base" || optKey.includes("_and_")) continue;
      if (options[optKey]) {
        available += byAct[act];
      }
    }

    return {
      act,
      demanded,
      available,
      shortBy: Math.max(0, demanded - available),
      demandParts,
    };
  }

  function validateConfig(schema, config) {
    const errors = [];
    const warnings = [];
    const info = [];

    const playerName = typeof config.name === "string" ? config.name.trim() : "";
    const options = config.options || {};

    // 1. Player slot name validation
    if (!playerName) {
      errors.push({
        code: "empty_player_name",
        severity: "error",
        title: "Player name is required",
        message: "Enter a slot name for this YAML (for example, Hornet).",
        fields: ["name"],
        quickFix: { label: "Set name to Hornet", metaPatch: { name: "Hornet" } },
      });
    } else if (playerName.length > 16) {
      errors.push({
        code: "player_name_too_long",
        severity: "error",
        title: "Player name exceeds 16 characters",
        message: `Archipelago slot names can be at most 16 characters (currently ${playerName.length}).`,
        fields: ["name"],
        quickFix: { label: "Trim to 16 chars", metaPatch: { name: playerName.slice(0, 16).trim() } },
      });
    }

    // 2. Range & choice bounds check against schema
    for (const [key, def] of Object.entries(schema.options)) {
      const val = options[key];
      if (def.kind === "range") {
        const num = Number(val);
        if (!Number.isInteger(num) || num < def.min || num > def.max) {
          errors.push({
            code: `range_${key}`,
            severity: "error",
            title: `${def.displayName} is out of range`,
            message: `${def.displayName} must be an integer between ${def.min} and ${def.max}.`,
            fields: [key],
            quickFix: {
              label: `Clamp to ${Math.min(def.max, Math.max(def.min, Number.isFinite(num) ? Math.round(num) : def.default))}`,
              patch: {
                [key]: Math.min(def.max, Math.max(def.min, Number.isFinite(num) ? Math.round(num) : def.default)),
              },
            },
          });
        }
      } else if (def.kind === "choice") {
        const validValues = def.choices.map((c) => c.value);
        if (!validValues.includes(val)) {
          errors.push({
            code: `choice_${key}`,
            severity: "error",
            title: `${def.displayName} has an unsupported value`,
            message: `"${String(val)}" is not a valid choice for ${def.displayName}.`,
            fields: [key],
            quickFix: { label: `Reset to ${def.default}`, patch: { [key]: def.default } },
          });
        }
      }
    }

    // 3. Naked start requires Crest Randomization
    if (options.force_naked && !options.crest_randomization) {
      errors.push({
        code: "force_naked_requires_crest_rando",
        severity: "error",
        title: "Force Naked requires Crest Randomization",
        message: "Naked start requires Crest Randomization to be enabled (anywhere).",
        fields: ["force_naked", "crest_randomization"],
        quickFix: { label: "Enable Crest Randomization", patch: { crest_randomization: true } },
      });
    }

    // 4. Songclave start vs content scope
    const scope = resolveEffectiveActScope(options);
    if (options.starting_location === "songclave") {
      if (options.goal === "act_1") {
        errors.push({
          code: "songclave_requires_act2",
          severity: "error",
          title: "Songclave start is incompatible with Act 1",
          message: "Songclave start requires an Act 2 or later goal.",
          fields: ["starting_location", "goal"],
          quickFix: { label: "Switch start to Bone Bottom", patch: { starting_location: "bone_bottom" } },
        });
      } else if (scope.minAct === 1) {
        errors.push({
          code: "songclave_short_hunt",
          severity: "error",
          title: "Songclave start can fail with 10 or fewer goal items",
          message: "Flea Hunt and Spelling Bee with 10 or fewer required items roll Act 1 scope most of the time, which rejects Songclave start.",
          fields: ["starting_location", "goal", options.goal === "flea_hunt" ? "flea_hunt_count" : "spelling_bee_phrase"],
          quickFix: { label: "Switch start to Bone Bottom", patch: { starting_location: "bone_bottom" } },
        });
      }
    }

    // 5. Spelling Bee phrase validation
    if (options.goal === "spelling_bee") {
      const parsed = parseSpellingBeePhrase(options.spelling_bee_phrase);
      if (!parsed) {
        errors.push({
          code: "invalid_spelling_bee_phrase",
          severity: "error",
          title: "Invalid Spelling Bee phrase",
          message: "Use only A-Z letters, spaces, and , . ! ? with at least one letter. Other characters fall back to Act 2 instead of Spelling Bee.",
          fields: ["spelling_bee_phrase", "goal"],
          quickFix: { label: "Use \"Hornet\"", patch: { spelling_bee_phrase: "Hornet" } },
        });
      } else if (!options.alphabet_mode) {
        info.push({
          code: "spelling_bee_auto_alphabet",
          severity: "info",
          title: "Spelling Bee enables Alphabet Mode automatically",
          message: `The generator adds all 26 Letter items to the pool for "${parsed.phrase}" (${parsed.letters.length} unique letters).`,
          fields: ["goal", "alphabet_mode"],
          quickFix: { label: "Set Alphabet Mode to true", patch: { alphabet_mode: true } },
        });
      }
    }

    // 6. Wish Plando requires Shuffle Wish Offers
    if (options.wish_plando && typeof options.wish_plando === "object" && Object.keys(options.wish_plando).length > 0 && !options.shuffle_wish_offers) {
      errors.push({
        code: "wish_plando_requires_shuffle",
        severity: "error",
        title: "Wish Offer Plando requires Shuffle Wish Offers",
        message: "Enable Shuffle Wish Offers or clear Wish Offer Plando entries.",
        fields: ["wish_plando", "shuffle_wish_offers"],
        quickFix: { label: "Enable Shuffle Wish Offers", patch: { shuffle_wish_offers: true } },
      });
    }

    // 7. Filler pool budget check (Souls, Alphabet Mode, Directional/Innate Traversal)
    const fillerBudget = estimateFillerBudget(schema, options);
    const hasBigFillerNeed = Boolean(
      options.boss_souls ||
      options.npc_souls ||
      options.alphabet_mode ||
      (options.goal === "spelling_bee" && parseSpellingBeePhrase(options.spelling_bee_phrase)) ||
      options.directional_swift_step ||
      options.directional_cling_grip ||
      options.directional_clawline ||
      options.directional_ledge_grab ||
      options.bind_randomization === "per_crest"
    );

    if (fillerBudget.shortBy > 0) {
      const severe = fillerBudget.shortBy >= 8 || Boolean(options.boss_souls || options.npc_souls || options.alphabet_mode || options.goal === "spelling_bee");
      const target = severe ? errors : warnings;
      const fixPatch = {};
      if (!options.rosary_cache_randomization) fixPatch.rosary_cache_randomization = true;
      if (!options.shell_shard_cache_randomization) fixPatch.shell_shard_cache_randomization = true;
      if (!Object.keys(fixPatch).length && !options.lore_tablet_randomization) fixPatch.lore_tablet_randomization = true;
      if (!Object.keys(fixPatch).length && !options.wish_sanity) fixPatch.wish_sanity = true;

      target.push({
        code: "insufficient_filler_pool",
        severity: severe ? "error" : "warning",
        title: "Not enough filler slots for selected pool options",
        message: `Selected options demand about ${fillerBudget.demanded} extra filler slots (${fillerBudget.demandParts.join(", ")}), but Act ${fillerBudget.act} scope only supplies about ${fillerBudget.available} replaceable filler items. Enable Rosary Caches, Shell Shard Caches, Lore Tablets, or Wish Completion Checks.`,
        fields: [
          "rosary_cache_randomization",
          "shell_shard_cache_randomization",
          "lore_tablet_randomization",
          "wish_sanity",
        ],
        quickFix: Object.keys(fixPatch).length
          ? { label: "Enable cache filler checks", patch: fixPatch }
          : undefined,
      });
    } else if (hasBigFillerNeed && fillerBudget.available - fillerBudget.demanded <= 6) {
      warnings.push({
        code: "tight_filler_pool",
        severity: "warning",
        title: "Filler pool margin is tight",
        message: `Estimated filler headroom is small (${fillerBudget.available} available vs. ~${fillerBudget.demanded} needed). If generation reports a filler shortage, enable Rosary Caches or Shell Shard Caches.`,
        fields: ["rosary_cache_randomization", "shell_shard_cache_randomization"],
        quickFix: !options.rosary_cache_randomization
          ? { label: "Enable Rosary Caches", patch: { rosary_cache_randomization: true } }
          : undefined,
      });
    }

    // 8. Skill-dependent options ignored when skill_randomization is false
    if (!options.skill_randomization) {
      const ignored = SKILL_DEPENDENT_OPTIONS.filter((k) => k !== "early_sprint" && options[k]);
      if (ignored.length > 0) {
        const names = ignored.map((k) => schema.options[k]?.displayName || k).join(", ");
        warnings.push({
          code: "skill_options_ignored",
          severity: "warning",
          title: "Skill options inactive without Skill Randomization",
          message: `${names} only take effect when Skill Randomization is enabled.`,
          fields: ["skill_randomization", ...ignored],
          quickFix: { label: "Enable Skill Randomization", patch: { skill_randomization: true } },
        });
      }
    }

    // 9. Starting Crest ignored when Crest Randomization is vanilla
    if (!options.crest_randomization && !options.force_naked && options.starting_crest !== "hunter" && options.starting_crest !== "random") {
      warnings.push({
        code: "starting_crest_ignored",
        severity: "warning",
        title: "Starting Crest is fixed to Hunter",
        message: "When Crest Randomization is off, Hornet always starts with the Hunter Crest.",
        fields: ["starting_crest", "crest_randomization"],
        quickFix: { label: "Enable Crest Randomization", patch: { crest_randomization: true } },
      });
    }

    // 10. Trap Percentage > 0 with all trap weights = 0
    if (Number(options.trap_percentage) > 0) {
      const totalWeight = TRAP_WEIGHT_OPTIONS.reduce((sum, k) => sum + (Number(options[k]) || 0), 0);
      if (totalWeight <= 0) {
        const restorePatch = {};
        for (const k of TRAP_WEIGHT_OPTIONS) restorePatch[k] = schema.options[k].default;
        warnings.push({
          code: "traps_all_zero_weight",
          severity: "warning",
          title: "Trap Percentage has no active trap weights",
          message: "Trap Percentage is above 0, but all trap weights are 0, so no traps will be placed.",
          fields: ["trap_percentage", ...TRAP_WEIGHT_OPTIONS],
          quickFix: { label: "Restore default trap weights", patch: restorePatch },
        });
      }
    }

    // 11. Directional Ledge Grab auto-enables Ledge Grab Rando
    if (options.directional_ledge_grab && !options.ledgegrab_ability_rando) {
      info.push({
        code: "directional_ledge_auto_enable",
        severity: "info",
        title: "Directional Ledge Grab enables Ledge Grab Rando",
        message: "The APWorld automatically turns on Ledge Grab Rando whenever Directional Ledge Grab is enabled.",
        fields: ["directional_ledge_grab", "ledgegrab_ability_rando"],
        quickFix: { label: "Set Ledge Grab Rando to true", patch: { ledgegrab_ability_rando: true } },
      });
    }

    // 12. Ledge Grab Rando overrides Vanilla start to Bone Bottom
    if ((options.ledgegrab_ability_rando || options.directional_ledge_grab) && options.starting_location === "vanilla") {
      info.push({
        code: "ledge_grab_replaces_vanilla_start",
        severity: "info",
        title: "Ledge Grab Rando changes Vanilla start to Bone Bottom",
        message: "When Ledge Grab is randomized, Vanilla starting location is automatically replaced with Bone Bottom.",
        fields: ["starting_location", "ledgegrab_ability_rando"],
      });
    }

    // 13. Steel Soul Silk and Soul points cap
    if (options.goal === "act_3" && options.game_mode === "steel_soul" && Number(options.silk_and_soul_points) > 22) {
      warnings.push({
        code: "steel_soul_wish_points_cap",
        severity: "warning",
        title: "Steel Soul caps Silk and Soul Points at 22",
        message: "In Steel Soul mode, values above 22 are clamped to 22 during generation.",
        fields: ["silk_and_soul_points", "game_mode"],
        quickFix: { label: "Set to 22", patch: { silk_and_soul_points: 22 } },
      });
    }

    // 14. Silk Heart Logic disabled caution
    if (options.silk_heart_logic === false) {
      warnings.push({
        code: "silk_heart_logic_off",
        severity: "warning",
        title: "Silk Heart Logic is disabled",
        message: "Turning off Silk Heart Logic can lead to softlocks where silk-draining abilities like Needolin or Clawline are expected without a Silk Heart.",
        fields: ["silk_heart_logic"],
      });
    }

    // 15. Act 3 options enabled on Act 1 / Act 2 / Cursed Ending goal
    if (scope.maxAct < 3) {
      const inactiveAct3 = ACT3_ONLY_OPTIONS.filter((k) => options[k]);
      if (inactiveAct3.length > 0) {
        const names = inactiveAct3.map((k) => schema.options[k]?.displayName || k).join(", ");
        info.push({
          code: "act3_options_outside_act3",
          severity: "info",
          title: "Act 3 options selected on an earlier-act goal",
          message: `${names} are intended for Act 3 goals and have limited or no effect on ${options.goal}.`,
          fields: ["goal", ...inactiveAct3],
        });
      }
    }

    // 16. Experimental / Beta feature notice
    const activeExperimental = Object.keys(schema.options).filter((k) => {
      const def = schema.options[k];
      if (!def.experimental) return false;
      return !valuesEqual(options[k], def.default);
    });
    if (activeExperimental.length > 0) {
      const names = activeExperimental.map((k) => schema.options[k].displayName).join(", ");
      info.push({
        code: "experimental_options_active",
        severity: "info",
        title: "Experimental (Beta) options enabled",
        message: `Active beta settings: ${names}. Verify your generated room before starting a group multiworld.`,
        fields: activeExperimental,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      info,
      fillerBudget,
    };
  }

  function yamlQuoteString(str) {
    if (str === "") return '""';
    const needsQuotes =
      /^\s|\s$/.test(str) ||
      /[:#{}[\],&*?|>!%@`"'\n\r]/.test(str) ||
      /^(true|false|yes|no|on|off|null|~|[+-]?\d+(\.\d+)?)$/i.test(str);
    if (!needsQuotes) return str;
    return '"' + str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n") + '"';
  }

  function formatYamlValue(def, value) {
    if (def.kind === "toggle" || def.kind === "global_randomization") {
      return value ? "true" : "false";
    }
    if (def.kind === "range") {
      return String(Math.round(Number(value)));
    }
    if (def.kind === "choice") {
      return yamlQuoteString(String(value));
    }
    if (def.kind === "text") {
      return yamlQuoteString(String(value ?? ""));
    }
    if (def.kind === "dict") {
      const entries = Object.entries(value || {});
      if (!entries.length) return "{}";
      return entries;
    }
    return yamlQuoteString(String(value));
  }

  function serializeYaml(schema, config, opts) {
    const settings = Object.assign({ includeDefaults: false, includeComments: true }, opts);
    const name = (config.name || "Hornet").trim() || "Hornet";
    const description = (config.description || "").trim();
    const options = config.options || {};

    const lines = [];
    if (settings.includeComments) {
      lines.push(`# Generated by Silksong Decrypted YAML Generator (APWorld v${schema.worldVersion})`);
      if (config.presetName) {
        lines.push(`# Preset: ${config.presetName}`);
      }
    }

    lines.push(`name: ${yamlQuoteString(name)}`);
    if (description) {
      lines.push(`description: ${yamlQuoteString(description)}`);
    }
    lines.push(`game: '${schema.game}'`);

    const optionLines = [];
    for (const group of schema.groups) {
      const groupEntries = [];
      for (const key of group.options) {
        const def = schema.options[key];
        if (!def) continue;
        const val = Object.prototype.hasOwnProperty.call(options, key) ? options[key] : def.default;
        const isDefault = valuesEqual(val, def.default);
        if (!settings.includeDefaults && isDefault) continue;
        // Skip unchanged hidden/beta options even when includeDefaults is enabled unless changed.
        if (def.experimental && isDefault) continue;

        const formatted = formatYamlValue(def, val);
        if (Array.isArray(formatted)) {
          groupEntries.push(`  ${key}:`);
          for (const [dk, dv] of formatted) {
            groupEntries.push(`    ${yamlQuoteString(String(dk))}: ${yamlQuoteString(String(dv))}`);
          }
        } else {
          groupEntries.push(`  ${key}: ${formatted}`);
        }
      }
      if (groupEntries.length) {
        if (settings.includeComments && settings.includeDefaults) {
          optionLines.push(`  # ${group.name}`);
        }
        optionLines.push(...groupEntries);
      }
    }

    if (optionLines.length === 0) {
      lines.push(`'${schema.game}': {}`);
    } else {
      lines.push(`'${schema.game}':`);
      lines.push(...optionLines);
    }

    return lines.join("\n") + "\n";
  }

  function stripYamlQuotes(raw) {
    const trimmed = raw.trim();
    if (trimmed.length >= 2 && trimmed[0] === "'" && trimmed[trimmed.length - 1] === "'") {
      return trimmed.slice(1, -1).replace(/''/g, "'");
    }
    if (trimmed.length >= 2 && trimmed[0] === '"' && trimmed[trimmed.length - 1] === '"') {
      return trimmed
        .slice(1, -1)
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\");
    }
    return trimmed;
  }

  function stripInlineComment(raw) {
    let inSingle = false;
    let inDouble = false;
    for (let i = 0; i < raw.length; i += 1) {
      const ch = raw[i];
      if (ch === "'" && !inDouble) inSingle = !inSingle;
      else if (ch === '"' && !inSingle && raw[i - 1] !== "\\") inDouble = !inDouble;
      else if (ch === "#" && !inSingle && !inDouble && (i === 0 || /\s/.test(raw[i - 1]))) {
        return raw.slice(0, i).trim();
      }
    }
    return raw.trim();
  }

  function coerceOptionValue(def, rawValue) {
    const str = stripYamlQuotes(String(rawValue));
    const lower = str.toLowerCase();

    if (def.kind === "toggle" || def.kind === "global_randomization") {
      if (def.aliases && Object.prototype.hasOwnProperty.call(def.aliases, lower)) {
        return def.aliases[lower];
      }
      if (lower === "1") return true;
      if (lower === "0") return false;
      return Boolean(def.default);
    }
    if (def.kind === "range") {
      if (def.specialValues && Object.prototype.hasOwnProperty.call(def.specialValues, lower)) {
        return def.specialValues[lower];
      }
      const num = Number(str);
      return Number.isFinite(num) ? Math.round(num) : def.default;
    }
    if (def.kind === "choice") {
      if (def.aliases && Object.prototype.hasOwnProperty.call(def.aliases, lower)) {
        return def.aliases[lower];
      }
      const exact = def.choices.find((c) => c.value.toLowerCase() === lower);
      return exact ? exact.value : str;
    }
    if (def.kind === "text") {
      return str;
    }
    return str;
  }

  function splitYamlKeyValue(line) {
    let inSingle = false;
    let inDouble = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === "'" && !inDouble) {
        inSingle = !inSingle;
      } else if (ch === '"' && !inSingle && line[i - 1] !== "\\") {
        inDouble = !inDouble;
      } else if (ch === ":" && !inSingle && !inDouble) {
        if (i + 1 === line.length || /\s/.test(line[i + 1])) {
          return [line.slice(0, i), line.slice(i + 1)];
        }
      }
    }
    return null;
  }

  function parseYaml(schema, text) {
    const result = {
      name: "",
      description: "",
      options: createDefaultOptions(schema),
      unknownKeys: [],
    };
    const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
    let inGameSection = false;
    let gameIndent = 0;
    let activeBlockKey = null;
    let activeBlockIndent = 0;
    let activeWeighted = null;

    function flushWeighted() {
      if (!activeWeighted) return;
      const { key, def, entries } = activeWeighted;
      activeWeighted = null;
      let bestKey = null;
      let bestWeight = 0;
      for (const [choiceKey, weight] of entries) {
        if (weight > bestWeight) {
          bestWeight = weight;
          bestKey = choiceKey;
        }
      }
      if (bestKey !== null) {
        result.options[key] = coerceOptionValue(def, bestKey);
      }
    }

    for (const rawLine of lines) {
      if (!rawLine.trim() || rawLine.trim().startsWith("#")) continue;
      const indent = rawLine.length - rawLine.trimStart().length;
      const cleaned = stripInlineComment(rawLine.trim());
      if (!cleaned) continue;

      if (activeBlockKey && indent > activeBlockIndent) {
        const pair = splitYamlKeyValue(cleaned);
        if (pair) {
          const dk = stripYamlQuotes(pair[0]);
          const dv = stripYamlQuotes(pair[1]);
          if (activeWeighted) {
            const weight = Number(dv);
            if (Number.isFinite(weight)) {
              activeWeighted.entries.push([dk, weight]);
            }
          } else {
            result.options[activeBlockKey][dk] = dv;
          }
        }
        continue;
      }
      flushWeighted();
      activeBlockKey = null;

      if (indent === 0) {
        inGameSection = false;
        const pair = splitYamlKeyValue(cleaned);
        if (!pair) continue;
        const rawKey = stripYamlQuotes(pair[0]);
        const rawVal = pair[1].trim();
        if (rawKey === "name") {
          result.name = stripYamlQuotes(rawVal);
        } else if (rawKey === "description") {
          result.description = stripYamlQuotes(rawVal);
        } else if (rawKey === schema.game) {
          if (rawVal === "{}" || rawVal === "") {
            inGameSection = rawVal === "";
            gameIndent = indent;
          }
        }
        continue;
      }

      if (inGameSection && indent > gameIndent) {
        const pair = splitYamlKeyValue(cleaned);
        if (!pair) continue;
        const key = stripYamlQuotes(pair[0]);
        const rawVal = pair[1].trim();
        const def = schema.options[key];
        if (!def) {
          result.unknownKeys.push(key);
          continue;
        }
        if (def.kind === "dict") {
          result.options[key] = {};
          if (rawVal === "" || rawVal === "{}") {
            if (rawVal === "") {
              activeBlockKey = key;
              activeBlockIndent = indent;
            }
          } else if (rawVal.startsWith("{") && rawVal.endsWith("}")) {
            try {
              const parsed = JSON.parse(rawVal);
              if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                result.options[key] = parsed;
              }
            } catch (_) {
              // Leave empty if inline dict isn't strict JSON.
            }
          }
        } else if (rawVal === "") {
          activeBlockKey = key;
          activeBlockIndent = indent;
          activeWeighted = { key, def, entries: [] };
        } else {
          result.options[key] = coerceOptionValue(def, rawVal);
        }
      }
    }
    flushWeighted();

    return result;
  }

  function suggestFilename(playerName) {
    const safe = String(playerName || "Hornet")
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .replace(/^_+|_+$/g, "");
    return (safe || "Hornet") + ".yaml";
  }

  return {
    PRESETS,
    TRAP_WEIGHT_OPTIONS,
    createDefaultOptions,
    applyPreset,
    valuesEqual,
    parseSpellingBeePhrase,
    resolveEffectiveActScope,
    estimateFillerBudget,
    validateConfig,
    serializeYaml,
    parseYaml,
    coerceOptionValue,
    suggestFilename,
  };
}));
