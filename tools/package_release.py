"""Package matched Windows plugin ZIP, silksong.apworld, and SHA256SUMS.txt."""

from __future__ import annotations

import argparse
import hashlib
import subprocess
import sys
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
PLUGIN_OUT = ROOT / "src" / "SilksongRandomizer" / "bin" / "Release" / "netstandard2.1"

REQUIRED_PLUGIN_FILES = (
    "SilksongRandomizer.dll",
    "Archipelago.MultiClient.Net.dll",
    "Newtonsoft.Json.dll",
    "SilksongRandomizer.deps.json",
    "MultiworldIcons.LICENSE.txt",
)

REQUIRED_CHECK_ICONS = (
    "Filler.png",
    "InventoryIcon.png",
    "LogicUnknown.png",
    "MapCheck.png",
    "Progression.png",
    "Trap.png",
    "Useful.png",
)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def verify_zip(path: Path) -> None:
    with ZipFile(path, "r") as zf:
        bad = zf.testzip()
        if bad is not None:
            raise RuntimeError(f"Corrupt ZIP member {bad} in {path}")


def package_plugin(output_zip: Path, plugin_dir: Path) -> None:
    for rel in REQUIRED_PLUGIN_FILES:
        if not (plugin_dir / rel).is_file():
            raise FileNotFoundError(f"Missing Release build file: {plugin_dir / rel}")

    icons_dir = plugin_dir / "CheckIcons"
    for icon in REQUIRED_CHECK_ICONS:
        if not (icons_dir / icon).is_file():
            raise FileNotFoundError(f"Missing CheckIcons file: {icons_dir / icon}")

    license_file = ROOT / "LICENSE"
    if not license_file.is_file():
        raise FileNotFoundError(f"Missing LICENSE file: {license_file}")

    output_zip.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(output_zip, "w", ZIP_DEFLATED) as zf:
        zf.write(license_file, "LICENSE")
        for rel in REQUIRED_PLUGIN_FILES:
            zf.write(plugin_dir / rel, f"BepInEx/plugins/SilksongDecrypted/{rel}")
        for icon in REQUIRED_CHECK_ICONS:
            zf.write(icons_dir / icon, f"BepInEx/plugins/SilksongDecrypted/CheckIcons/{icon}")

    verify_zip(output_zip)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--version", required=True, help="Release version label, e.g. 0.5.5-rc.2")
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--plugin-dir", type=Path, default=PLUGIN_OUT)
    args = parser.parse_args()

    out_dir = args.output_dir.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    plugin_zip = out_dir / f"SilksongDecrypted-{args.version}.zip"
    apworld = out_dir / "silksong.apworld"
    sums_file = out_dir / "SHA256SUMS.txt"

    package_plugin(plugin_zip, args.plugin_dir.resolve())
    subprocess.check_call(
        [sys.executable, str(ROOT / "tools" / "build_apworld.py"), "--output", str(apworld)],
        cwd=ROOT,
    )
    verify_zip(apworld)

    lines = [
        f"{sha256_file(plugin_zip)}  {plugin_zip.name}",
        f"{sha256_file(apworld)}  {apworld.name}",
    ]
    sums_file.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")

    print(f"Packaged:\n  {plugin_zip}\n  {apworld}\n  {sums_file}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
