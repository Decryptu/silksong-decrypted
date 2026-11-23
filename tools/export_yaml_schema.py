"""Export the Silksong APWorld option schema for the first-party YAML generator."""

from __future__ import annotations

import argparse
import importlib.util
import inspect
import json
import sys
import types
from dataclasses import fields
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
APWORLD_DIR = ROOT / "APWorld" / "silksong"
DEFAULT_OUTPUT = ROOT / "site" / "yaml-schema.json"
GAME_NAME = "Hollow Knight: Silksong"


def _install_options_shim() -> types.ModuleType:
    """Provide a minimal Archipelago Options shim when Archipelago is not on sys.path."""
    mod = types.ModuleType("Options")

    class Visibility:
        none = 0
        all = 0b11111

    class _OptionMeta(type):
        def __new__(mcs, name: str, bases: tuple[type, ...], namespace: dict[str, Any]):
            cls = super().__new__(mcs, name, bases, namespace)
            options: dict[str, int] = {}
            aliases: dict[str, int] = {}
            for base in reversed(cls.__mro__):
                for attr_name, attr_val in base.__dict__.items():
                    if attr_name.startswith("option_"):
                        options[attr_name[len("option_"):]] = attr_val
                    elif attr_name.startswith("alias_"):
                        aliases[attr_name[len("alias_"):]] = attr_val
            cls.options = options
            cls.aliases = aliases
            cls.name_lookup = {val: key for key, val in options.items()}
            return cls

    class Option(metaclass=_OptionMeta):
        display_name: str = ""
        visibility: int = Visibility.all
        default: Any = None

    class Toggle(Option):
        option_false = 0
        option_true = 1
        default = 0

    class Choice(Option):
        default = 0

    class Range(Option):
        range_start = 0
        range_end = 100
        special_range_names: dict[str, int] = {}
        default = 0

    class FreeText(Option):
        default = ""

    class OptionDict(Option):
        default: dict[str, Any] = {}

    class StartInventoryPool(OptionDict):
        display_name = "Start Inventory from Pool"
        default: dict[str, int] = {}

    class ProgressionBalancing(Range):
        """A system that can move progression earlier, to try and prevent the player from getting stuck and bored early.

        A lower setting means more getting stuck. A higher setting means less getting stuck."""
        display_name = "Progression Balancing"
        range_start = 0
        range_end = 99
        default = 50
        special_range_names = {
            "disabled": 0,
            "normal": 50,
            "extreme": 99,
        }

    class ItemsAccessibility(Choice):
        """Set rules for reachability of your items/locations.

        **Full:** ensure everything can be reached and acquired.

        **Minimal:** ensure what is needed to reach your goal can be acquired.

        **Items:** ensure all logically relevant items can be acquired. Some items, such as keys, may be self-locking, and some locations may be inaccessible."""
        display_name = "Accessibility"
        option_full = 0
        option_minimal = 2
        option_items = 1
        alias_none = 2
        alias_locations = 0
        default = 1

    class OptionGroup:
        def __init__(self, name: str, options: list[type], start_collapsed: bool = False):
            self.name = name
            self.options = options
            self.start_collapsed = start_collapsed

    class PerGameCommonOptions:
        progression_balancing: ProgressionBalancing

    mod.Visibility = Visibility
    mod.Option = Option
    mod.Toggle = Toggle
    mod.Choice = Choice
    mod.Range = Range
    mod.FreeText = FreeText
    mod.OptionDict = OptionDict
    mod.StartInventoryPool = StartInventoryPool
    mod.ProgressionBalancing = ProgressionBalancing
    mod.ItemsAccessibility = ItemsAccessibility
    mod.OptionGroup = OptionGroup
    mod.PerGameCommonOptions = PerGameCommonOptions
    return mod


def _load_silksong_options(archipelago_lib: Path | None = None):
    """Load APWorld/silksong/options.py without importing full world runtime dependencies."""
    added_paths: list[str] = []
    if archipelago_lib is not None:
        lib_str = str(archipelago_lib)
        if lib_str not in sys.path:
            sys.path.insert(0, lib_str)
            added_paths.append(lib_str)

    try:
        import Options as options_lib  # type: ignore
    except ImportError:
        options_lib = _install_options_shim()
        sys.modules["Options"] = options_lib

    pkg = types.ModuleType("silksong")
    pkg.__path__ = [str(APWORLD_DIR)]
    sys.modules["silksong"] = pkg

    minor_families_stub = types.ModuleType("silksong.minor_families")
    minor_families_stub.MINOR_FAMILY_KEYS = ()
    minor_families_stub.MINOR_FAMILY_OPTION_BY_KEY = {}
    sys.modules["silksong.minor_families"] = minor_families_stub

    spec = importlib.util.spec_from_file_location(
        "silksong.options", APWORLD_DIR / "options.py"
    )
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load {APWORLD_DIR / 'options.py'}")
    options_mod = importlib.util.module_from_spec(spec)
    sys.modules["silksong.options"] = options_mod
    spec.loader.exec_module(options_mod)

    version_spec = importlib.util.spec_from_file_location(
        "silksong.version", APWORLD_DIR / "version.py"
    )
    if version_spec is None or version_spec.loader is None:
        raise RuntimeError(f"Could not load {APWORLD_DIR / 'version.py'}")
    version_mod = importlib.util.module_from_spec(version_spec)
    sys.modules["silksong.version"] = version_mod
    version_spec.loader.exec_module(version_mod)

    return options_lib, options_mod, version_mod.WORLD_VERSION


def _humanize(key: str) -> str:
    special = {
        "x1": "1x",
        "x1_5": "1.5x",
        "x2": "2x",
        "x3": "3x",
        "x5": "5x",
        "x10": "10x",
        "act_1": "Act 1",
        "act_2": "Act 2",
        "act_3": "Act 3",
        "pilgrims_rest": "Pilgrim's Rest",
        "shakra_stock": "Shakra Map Stock (14 purchases)",
        "owned_maps": "Owned Maps",
        "npc_souls": "NPC Souls",
    }
    if key in special:
        return special[key]
    return " ".join(part.capitalize() for part in key.split("_"))


def _clean_doc(cls: type) -> str:
    doc = inspect.getdoc(cls) or ""
    lines = [line.strip() for line in doc.splitlines()]
    # Collapse single blank lines cleanly while preserving paragraph breaks.
    paragraphs: list[str] = []
    current: list[str] = []
    for line in lines:
        if not line:
            if current:
                paragraphs.append(" ".join(current))
                current = []
        else:
            current.append(line)
    if current:
        paragraphs.append(" ".join(current))
    return "\n\n".join(paragraphs)


def _is_subclass_named(cls: type, name: str) -> bool:
    return any(base.__name__ == name for base in cls.__mro__)


def _serialize_option(
    key: str,
    opt_cls: type,
    options_mod: types.ModuleType,
    options_lib: types.ModuleType,
) -> dict[str, Any]:
    display_name = getattr(opt_cls, "display_name", "") or _humanize(key)
    description = _clean_doc(opt_cls)
    visibility = getattr(opt_cls, "visibility", options_lib.Visibility.all)
    experimental = visibility == options_lib.Visibility.none

    is_global_rando = issubclass(opt_cls, options_mod.GlobalRandomization)
    is_toggle = _is_subclass_named(opt_cls, "Toggle")
    is_choice = _is_subclass_named(opt_cls, "Choice")
    is_range = _is_subclass_named(opt_cls, "Range")
    is_text = _is_subclass_named(opt_cls, "FreeText")
    is_dict = _is_subclass_named(opt_cls, "OptionDict")

    entry: dict[str, Any] = {
        "key": key,
        "displayName": display_name,
        "description": description,
        "experimental": experimental,
    }

    if is_global_rando:
        entry["kind"] = "global_randomization"
        entry["default"] = bool(opt_cls.default)
        entry["aliases"] = {
            "vanilla": False,
            "off": False,
            "false": False,
            "anywhere": True,
            "true": True,
        }
    elif is_toggle and not is_choice:
        entry["kind"] = "toggle"
        entry["default"] = bool(opt_cls.default)
        entry["aliases"] = {"false": False, "off": False, "true": True, "on": True}
    elif is_choice:
        entry["kind"] = "choice"
        # Preserve canonical option order from class hierarchy (excluding aliases).
        raw_options: dict[str, int] = {}
        raw_aliases: dict[str, int] = {}
        for base in reversed(opt_cls.__mro__):
            for attr_name, attr_val in base.__dict__.items():
                if attr_name.startswith("option_"):
                    raw_options[attr_name[len("option_"):]] = attr_val
                elif attr_name.startswith("alias_"):
                    raw_aliases[attr_name[len("alias_"):]] = attr_val
        if not raw_options and hasattr(opt_cls, "options"):
            # Built-in Archipelago choices like ItemsAccessibility put options in .options
            seen_vals: set[int] = set()
            for opt_name, opt_val in opt_cls.options.items():
                canonical = opt_cls.name_lookup.get(opt_val, opt_name)
                if opt_val not in seen_vals:
                    raw_options[canonical] = opt_val
                    seen_vals.add(opt_val)
                if opt_name != canonical:
                    raw_aliases[opt_name] = opt_val

        value_to_name = {v: k for k, v in raw_options.items()}
        choices = [
            {"value": opt_name, "label": _humanize(opt_name)}
            for opt_name in raw_options
        ]
        default_raw = opt_cls.default
        if default_raw == "random":
            choices.insert(0, {"value": "random", "label": "Random"})
            default_val: Any = "random"
        elif isinstance(default_raw, str):
            default_val = default_raw
        else:
            default_val = value_to_name.get(default_raw, next(iter(raw_options)))

        aliases: dict[str, str] = {}
        for alias_name, alias_val in raw_aliases.items():
            if alias_name not in raw_options and alias_val in value_to_name:
                aliases[alias_name] = value_to_name[alias_val]

        entry["default"] = default_val
        entry["choices"] = choices
        if aliases:
            entry["aliases"] = aliases
    elif is_range:
        entry["kind"] = "range"
        entry["default"] = int(opt_cls.default)
        entry["min"] = int(opt_cls.range_start)
        entry["max"] = int(opt_cls.range_end)
        special = getattr(opt_cls, "special_range_names", None)
        if special:
            entry["specialValues"] = {k: int(v) for k, v in special.items()}
    elif is_text:
        entry["kind"] = "text"
        entry["default"] = str(opt_cls.default)
    elif is_dict:
        entry["kind"] = "dict"
        entry["default"] = dict(opt_cls.default or {})
    else:
        raise ValueError(f"Unsupported option class {opt_cls!r} for key {key!r}")

    return entry


def _collect_catalogue_counts() -> dict[str, Any]:
    """Read soul catalogue counts per act directly from APWorld JSON files."""
    boss_rows = json.loads((APWORLD_DIR / "boss_souls.json").read_text(encoding="utf-8"))
    npc_rows = json.loads((APWORLD_DIR / "npc_souls.json").read_text(encoding="utf-8"))
    enemy_rows = json.loads((APWORLD_DIR / "enemy_souls.json").read_text(encoding="utf-8"))

    # Note: boss_souls.json excludes Act 2/3 bosses when Act 1 scope trims locations.
    # Act 1 verified export has 13 boss souls; Act 2 has 43; Act 3 has 46.
    npc_by_act = {
        str(act): sum(
            1
            for row in npc_rows
            if not row.get("legacy")
            and row.get("act", 1) <= act
            and row.get("game_mode", "classic") == "classic"
        )
        for act in (1, 2, 3)
    }
    return {
        "bossSouls": {"1": 13, "2": 43, "3": len(boss_rows)},
        "npcSouls": npc_by_act,
        "enemySoulsTotal": len(enemy_rows),
    }


def build_schema(archipelago_lib: Path | None = None) -> dict[str, Any]:
    options_lib, options_mod, world_version = _load_silksong_options(archipelago_lib)
    silksong_options = options_mod.SilksongOptions

    # Map option classes -> field keys declared on SilksongOptions + progression_balancing.
    cls_to_key: dict[type, str] = {
        options_lib.ProgressionBalancing: "progression_balancing",
    }
    declared_fields: dict[str, type] = {
        "progression_balancing": options_lib.ProgressionBalancing,
    }
    namespace = vars(options_mod)
    for f in fields(silksong_options):
        ann = f.type
        if isinstance(ann, str):
            opt_cls = namespace.get(ann) or getattr(options_lib, ann, None)
        else:
            opt_cls = ann
        if opt_cls is None:
            continue
        # Skip generic Archipelago plando/list meta options not shown in Silksong option groups.
        if f.name in {
            "local_items",
            "non_local_items",
            "start_inventory",
            "start_inventory_from_pool",
            "start_hints",
            "start_location_hints",
            "exclude_locations",
            "priority_locations",
            "item_links",
            "plando_items",
        }:
            continue
        declared_fields[f.name] = opt_cls
        cls_to_key[opt_cls] = f.name

    groups_out: list[dict[str, Any]] = []
    seen_keys: set[str] = set()
    beta_extra_keys = ("boss_souls", "enemy_souls", "npc_souls")

    for group in options_mod.silksong_option_groups:
        group_keys: list[str] = []
        for opt_cls in group.options:
            key = cls_to_key.get(opt_cls)
            if key is None:
                continue
            if key == "wish_plando":
                # Keep wish_plando serialized in schema (experimental dict) cleanly.
                pass
            group_keys.append(key)
            seen_keys.add(key)

        if group.name == "BETA Features":
            for extra_key in beta_extra_keys:
                if extra_key in declared_fields and extra_key not in seen_keys:
                    group_keys.append(extra_key)
                    seen_keys.add(extra_key)

        groups_out.append(
            {
                "id": group.name.lower().replace("/", "-").replace(" ", "-"),
                "name": group.name,
                "startCollapsed": bool(group.start_collapsed),
                "experimental": group.name == "BETA Features",
                "options": group_keys,
            }
        )

    # Ensure every declared Silksong option belongs to a group.
    leftover = [k for k in declared_fields if k not in seen_keys]
    if leftover:
        raise RuntimeError(f"Unassigned SilksongOptions fields: {leftover}")

    options_out = {
        key: _serialize_option(key, opt_cls, options_mod, options_lib)
        for key, opt_cls in declared_fields.items()
    }

    return {
        "game": GAME_NAME,
        "worldVersion": world_version,
        "groups": groups_out,
        "options": options_out,
        "catalogueCounts": _collect_catalogue_counts(),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--archipelago-lib", type=Path, default=None)
    parser.add_argument(
        "--check",
        action="store_true",
        help="Verify that the existing output file matches the freshly exported schema.",
    )
    args = parser.parse_args()

    schema = build_schema(args.archipelago_lib)
    rendered = json.dumps(schema, indent=2, ensure_ascii=False) + "\n"

    if args.check:
        if not args.output.exists():
            print(f"Schema file missing: {args.output}", file=sys.stderr)
            return 1
        existing = args.output.read_text(encoding="utf-8")
        if existing != rendered:
            print(
                f"Schema out of date: {args.output}. Run python tools/export_yaml_schema.py",
                file=sys.stderr,
            )
            return 1
        print(f"Schema up to date ({len(schema['options'])} options): {args.output}")
        return 0

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(rendered, encoding="utf-8", newline="\n")
    print(f"Exported {len(schema['options'])} options to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
