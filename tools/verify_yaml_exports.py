"""Verify exported YAMLs from the first-party generator against ArchipelagoGenerate.exe."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_AP_DIR = ROOT / "artifacts" / "smoke-ap068"


def _export_yaml(preset_id: str, player_name: str, include_defaults: bool) -> str:
    script = (
        "const fs = require('fs');"
        "const schema = JSON.parse(fs.readFileSync('site/yaml-schema.json', 'utf8'));"
        "const core = require('./site/yaml-core.js');"
        "const [presetId, name, inc] = process.argv.slice(1);"
        "const preset = core.PRESETS.find(p => p.id === presetId);"
        "const options = core.applyPreset(schema, presetId);"
        "const cfg = { name, description: preset.name, presetName: preset.name, options };"
        "const res = core.validateConfig(schema, cfg);"
        "if (!res.valid) { console.error(JSON.stringify(res.errors)); process.exit(2); }"
        "process.stdout.write(core.serializeYaml(schema, cfg, { includeDefaults: inc === '1', includeComments: true }));"
    )
    return subprocess.check_output(
        ["node", "-e", script, preset_id, player_name, "1" if include_defaults else "0"],
        cwd=ROOT,
        text=True,
        encoding="utf-8",
    )


def _run_generate(ap_exe: Path, players_dir: Path, out_dir: Path, multi: int, seed: str, label: str) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    proc = subprocess.run(
        [
            str(ap_exe),
            "--player_files_path",
            str(players_dir),
            "--multi",
            str(multi),
            "--seed",
            seed,
            "--outputpath",
            str(out_dir),
            "--spoiler",
            "1",
        ],
        cwd=ap_exe.parent,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if proc.returncode != 0:
        print(f"FAIL [{label}] (exit {proc.returncode})", file=sys.stderr)
        if proc.stdout:
            print(proc.stdout[-2000:], file=sys.stderr)
        if proc.stderr:
            print(proc.stderr[-2000:], file=sys.stderr)
        raise SystemExit(1)

    zips = sorted(out_dir.glob("*.zip"))
    if not zips:
        print(f"FAIL [{label}]: no output zip found in {out_dir}", file=sys.stderr)
        raise SystemExit(1)
    archive_path = zips[-1]
    with ZipFile(archive_path, "r") as zf:
        bad = zf.testzip()
        if bad is not None:
            print(f"FAIL [{label}]: corrupt zip member {bad}", file=sys.stderr)
            raise SystemExit(1)
    print(f"PASS [{label}] -> {archive_path.name}")
    return archive_path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ap-dir", type=Path, default=DEFAULT_AP_DIR)
    parser.add_argument("--seed", default="12345")
    parser.add_argument(
        "--rebuild-apworld",
        action="store_true",
        help="Package APWorld/silksong into <ap-dir>/custom_worlds/silksong.apworld before generating.",
    )
    args = parser.parse_args()

    ap_exe = args.ap_dir / "ArchipelagoGenerate.exe"
    if not ap_exe.exists():
        print(f"ArchipelagoGenerate.exe not found at {ap_exe}", file=sys.stderr)
        return 1

    if args.rebuild_apworld:
        target_apworld = args.ap_dir / "custom_worlds" / "silksong.apworld"
        subprocess.check_call(
            [sys.executable, str(ROOT / "tools" / "build_apworld.py"), "--output", str(target_apworld)],
            cwd=ROOT,
        )

    presets = json.loads(
        subprocess.check_output(
            ["node", "-e", "const c = require('./site/yaml-core.js'); console.log(JSON.stringify(c.PRESETS.map(p => p.id)));"],
            cwd=ROOT,
            text=True,
        )
    )

    scratch = Path(tempfile.mkdtemp(prefix="silksong-yaml-verify-", dir=ROOT / "artifacts"))
    try:
        # 1. Solo verification for every preset (compact) + full-defaults verification for standard
        cases: list[tuple[str, str, bool, str]] = [
            (pid, "Hornet", False, "54321" if pid == "experimental_chaos" else args.seed)
            for pid in presets
        ]
        cases.append(("standard", "Hornet", True, args.seed))

        for preset_id, player_name, include_defaults, seed in cases:
            label = f"solo:{preset_id}{':full' if include_defaults else ''}"
            pdir = scratch / label.replace(":", "_") / "players"
            odir = scratch / label.replace(":", "_") / "out"
            pdir.mkdir(parents=True, exist_ok=True)
            yaml_text = _export_yaml(preset_id, player_name, include_defaults)
            (pdir / f"{player_name}.yaml").write_text(yaml_text, encoding="utf-8", newline="\n")
            _run_generate(ap_exe, pdir, odir, 1, seed, label)

        # 2. Multiworld verification (3 Silksong players with mixed presets + full/compact modes)
        mw_players = scratch / "multiworld_3p" / "players"
        mw_out = scratch / "multiworld_3p" / "out"
        mw_players.mkdir(parents=True, exist_ok=True)
        for name, preset_id, include_defaults in (
            ("Hornet", "standard", False),
            ("Lace", "flea_hunt", False),
            ("Shakra", "act2_classic", True),
        ):
            yaml_text = _export_yaml(preset_id, name, include_defaults)
            (mw_players / f"{name}.yaml").write_text(yaml_text, encoding="utf-8", newline="\n")
        _run_generate(ap_exe, mw_players, mw_out, 3, args.seed, "multiworld:3p-mixed")
    finally:
        shutil.rmtree(scratch, ignore_errors=True)

    print("All exported YAML solo and multiworld generation checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
