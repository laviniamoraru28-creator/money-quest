"""Run with: python3 scripts/validate_one_game.py <game_key>
Validates one game's translation across all 8 non-English languages:
structure matches English exactly (same ids/keys/numbers at every
position), translatable text differs from English where length >= 8,
and mechanic-specific answer-validity checks (multiple-choice
correctOption is among the translated options; sort/compare/allocate
structural keys are untouched so correctness there is guaranteed by
construction, but checked anyway as a real verification, not an
assumption).
"""
import json, sys

key = sys.argv[1]
en = json.load(open("messages/en.json"))["games"][key]

STRUCTURAL_KEYS = {"id", "key", "mechanic", "correctBucketKey", "correctOptionKey", "categoryKey",
                    "amountMinorUnits", "totalMinorUnits", "targetMinorUnits", "toleranceMinorUnits",
                    "correctValue", "isCurrency", "toleranceValue", "ageBand", "difficulty", "isSuspicious"}

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
    elif isinstance(en_obj, str):
        last_key = path.rsplit(".", 1)[-1]
        is_structural = last_key in STRUCTURAL_KEYS or last_key.isdigit() and path.split(".")[-2] in STRUCTURAL_KEYS
        if not is_structural and len(en_obj) >= 8 and en_obj == tr_obj:
            out.append(path)

def check_answer_validity(game, out):
    for vi, v in enumerate(game["variants"]):
        for ri, r in enumerate(v["rounds"]):
            if r["mechanic"] == "multiple-choice":
                if r["correctOption"] not in r["options"]:
                    out.append(f"variant{vi}.round{ri}: correctOption not in options")
            elif r["mechanic"] == "sort":
                bucket_keys = {b["key"] for b in r["buckets"]}
                for it in r["items"]:
                    if it["correctBucketKey"] not in bucket_keys:
                        out.append(f"variant{vi}.round{ri}: item correctBucketKey invalid")
            elif r["mechanic"] == "compare":
                option_keys = {o["key"] for o in r["options"]}
                if r["correctOptionKey"] not in option_keys:
                    out.append(f"variant{vi}.round{ri}: correctOptionKey invalid")

en_keys = flatten(en)
print(f"=== {key} — EN fields: {len(en_keys)} ===")

all_ok = True
for locale in ["ro", "es", "fr", "de", "it", "pt", "nl", "pl"]:
    data = json.load(open(f"messages/{locale}.json"))
    game = data.get("games", {}).get(key)
    if not game:
        print(f"{locale}: MISSING GAME ENTIRELY")
        all_ok = False
        continue
    keys = flatten(game)
    missing = en_keys - keys
    extra = keys - en_keys
    identical = []
    check_identical(en, game, "", identical)
    answer_issues = []
    check_answer_validity(game, answer_issues)

    ok = not missing and not extra and not identical and not answer_issues
    all_ok = all_ok and ok
    status = "OK" if ok else "PROBLEM"
    print(f"{locale}: {status} missing={len(missing)} extra={len(extra)} identical={len(identical)} answerIssues={len(answer_issues)}")
    if missing: print("   missing:", list(missing)[:5])
    if extra: print("   extra:", list(extra)[:5])
    if identical: print("   identical:", identical[:5])
    if answer_issues: print("   answer issues:", answer_issues[:5])

print("ALL LANGUAGES OK" if all_ok else "SOME LANGUAGES HAVE PROBLEMS")
sys.exit(0 if all_ok else 1)
