"""Run with: python3 scripts/validate_one_scenario.py <scenario_key>
Validates one simulator scenario's translation across all 8 non-English
languages: key coverage matches English exactly, no suspicious
identical text, and choice-count consistency per event (every choice
in the structure has a matching translated label/consequence).
"""
import json, sys

key = sys.argv[1]
en = json.load(open("messages/en.json"))["simulatorScenarios"][key]

def flatten(obj, prefix=""):
    keys = set()
    if isinstance(obj, dict):
        for k, v in obj.items():
            keys |= flatten(v, f"{prefix}.{k}" if prefix else k)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            keys |= flatten(v, f"{prefix}.{i}")
    else:
        keys.add(prefix)
    return keys

def check_identical(en_obj, tr_obj, path, out):
    if isinstance(en_obj, dict):
        for k in en_obj:
            check_identical(en_obj[k], tr_obj.get(k) if isinstance(tr_obj, dict) else None, f"{path}.{k}", out)
    elif isinstance(en_obj, list):
        for i, v in enumerate(en_obj):
            check_identical(v, tr_obj[i] if isinstance(tr_obj, list) and i < len(tr_obj) else None, f"{path}.{i}", out)
    elif isinstance(en_obj, str) and len(en_obj) >= 8 and en_obj == tr_obj:
        out.append(path)

en_keys = flatten(en)
print(f"=== {key} — EN fields: {len(en_keys)} ===")

all_ok = True
for locale in ["ro", "es", "fr", "de", "it", "pt", "nl", "pl"]:
    data = json.load(open(f"messages/{locale}.json"))
    scenario = data.get("simulatorScenarios", {}).get(key)
    if not scenario:
        print(f"{locale}: MISSING SCENARIO ENTIRELY")
        all_ok = False
        continue
    keys = flatten(scenario)
    missing = en_keys - keys
    extra = keys - en_keys
    identical = []
    check_identical(en, scenario, "", identical)

    ok = not missing and not extra and not identical
    all_ok = all_ok and ok
    status = "OK" if ok else "PROBLEM"
    print(f"{locale}: {status} missing={len(missing)} extra={len(extra)} identical={len(identical)}")
    if missing: print("   missing:", list(missing)[:5])
    if extra: print("   extra:", list(extra)[:5])
    if identical: print("   identical:", identical[:5])

print("ALL LANGUAGES OK" if all_ok else "SOME LANGUAGES HAVE PROBLEMS")
sys.exit(0 if all_ok else 1)
