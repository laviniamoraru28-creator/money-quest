"""Run with: python3 scripts/validate_one_lesson.py <lesson_id>
Validates one lesson's translation across all 8 non-English languages:
key coverage, quiz correctAnswer present among options, and no
suspiciously-English-identical values (>=15 chars).
"""
import json, sys

lesson_id = sys.argv[1]
en = json.load(open("messages/en.json"))["curriculum"][lesson_id]

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

en_keys = flatten(en)
print(f"=== {lesson_id} — EN fields: {len(en_keys)} ===")

all_ok = True
for locale in ["ro", "es", "fr", "de", "it", "pt", "nl", "pl"]:
    data = json.load(open(f"messages/{locale}.json"))
    lesson = data["curriculum"].get(lesson_id)
    if not lesson:
        print(f"{locale}: MISSING LESSON ENTIRELY")
        all_ok = False
        continue
    keys = flatten(lesson)
    missing = en_keys - keys
    extra = keys - en_keys
    correct = lesson["quiz"]["correctAnswer"]
    options = lesson["quiz"]["options"]
    correct_valid = correct in options
    identical = []
    def check_identical(en_obj, tr_obj, path=""):
        if isinstance(en_obj, dict):
            for k in en_obj:
                check_identical(en_obj[k], tr_obj.get(k) if tr_obj else None, f"{path}.{k}")
        elif isinstance(en_obj, list):
            for i, v in enumerate(en_obj):
                check_identical(v, tr_obj[i] if tr_obj and i < len(tr_obj) else None, f"{path}.{i}")
        elif isinstance(en_obj, str) and len(en_obj) >= 15 and en_obj == tr_obj:
            identical.append(path)
    check_identical(en, lesson)

    ok = not missing and not extra and correct_valid and not identical
    all_ok = all_ok and ok
    status = "OK" if ok else "PROBLEM"
    print(f"{locale}: {status} missing={len(missing)} extra={len(extra)} correctAnswerValid={correct_valid} identical={len(identical)}")
    if missing: print("   missing:", missing)
    if extra: print("   extra:", extra)
    if identical: print("   identical:", identical)

print("ALL LANGUAGES OK" if all_ok else "SOME LANGUAGES HAVE PROBLEMS")
sys.exit(0 if all_ok else 1)
