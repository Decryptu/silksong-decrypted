"""Package the Silksong world from tracked files and honor its exclusions."""

import argparse
import subprocess
from fnmatch import fnmatchcase
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "APWorld" / "silksong"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path)
    output = parser.parse_args().output
    patterns = [
        line.strip().lstrip("/")
        for line in (SOURCE / ".apignore").read_text(encoding="utf-8").splitlines()
        if line.strip().lstrip("/") and not line.lstrip().startswith("#")
    ]
    files = subprocess.check_output(
        ["git", "-C", str(SOURCE), "ls-files", "-z"]
    ).decode("utf-8").split("\0")
    output.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(output, "w", ZIP_DEFLATED) as archive:
        for filename in filter(None, files):
            if filename == ".apignore" or any(
                fnmatchcase(filename, pattern) or (pattern.endswith("/") and filename.startswith(pattern))
                for pattern in patterns
            ):
                continue
            archive.write(SOURCE / filename, f"silksong/{filename}")
    print(output)


if __name__ == "__main__":
    main()
