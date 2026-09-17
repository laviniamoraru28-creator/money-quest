"""
merge_game_translation(en_game, translated_text) -> full localized game dict

Takes the full English game structure and a "text-only" translated
structure of the SAME shape (same number of variants/rounds/items in
the SAME order), and produces a complete localized game by copying every
structural field (id, key, correctBucketKey, amountMinorUnits, etc.)
from English and taking every translatable field from translated_text.

This avoids two failure modes: (1) manually retyping every id/key next
to its translation (error-prone at this nesting depth), and (2) a
string-substitution approach that could accidentally match the wrong
occurrence of a short string. Position in the structure is the source
of truth for correspondence, matching the same care applied to lesson
translations, adapted for games' nested per-round shape.
"""
import json

def merge_round(en_round, tr_round):
    mechanic = en_round["mechanic"]
    out = dict(en_round)  # start from English (ids, keys, numbers, mechanic)
    out["prompt"] = tr_round["prompt"]
    out["hint"] = tr_round["hint"]
    out["explanation"] = tr_round["explanation"]

    if mechanic == "sort":
        out["buckets"] = [
            {**b, "label": tr_round["buckets"][i]["label"]}
            for i, b in enumerate(en_round["buckets"])
        ]
        out["items"] = [
            {**it, "label": tr_round["items"][i]["label"]}
            for i, it in enumerate(en_round["items"])
        ]
    elif mechanic == "compare":
        out["options"] = [
            {**o, "label": tr_round["options"][i]["label"],
             **({"detail": tr_round["options"][i]["detail"]} if "detail" in o else {})}
            for i, o in enumerate(en_round["options"])
        ]
    elif mechanic == "allocate":
        out["categories"] = [
            {**c, "label": tr_round["categories"][i]["label"]}
            for i, c in enumerate(en_round["categories"])
        ]
    elif mechanic == "match":
        out["pairs"] = [
            {**p, "left": tr_round["pairs"][i]["left"], "right": tr_round["pairs"][i]["right"]}
            for i, p in enumerate(en_round["pairs"])
        ]
    elif mechanic == "numeric":
        out["givenContext"] = tr_round["givenContext"]
    elif mechanic == "spot":
        out["scenario"] = tr_round["scenario"]
        out["items"] = [
            {**it, "text": tr_round["items"][i]["text"]}
            for i, it in enumerate(en_round["items"])
        ]
    elif mechanic == "multiple-choice":
        out["options"] = tr_round["options"]
        out["correctOption"] = tr_round["correctOption"]
    elif mechanic == "mission":
        out["situation"] = tr_round["situation"]
        out["choices"] = [
            {**c, "label": tr_round["choices"][i]["label"], "consequence": tr_round["choices"][i]["consequence"]}
            for i, c in enumerate(en_round["choices"])
        ]
    return out

def merge_game_translation(en_game, translated_text):
    return {
        "title": translated_text["title"],
        "feedback": {
            "correct": translated_text["feedback"]["correct"],
            "incorrect": translated_text["feedback"]["incorrect"],
        },
        "variants": [
            {
                "ageBand": v["ageBand"],
                "difficulty": v["difficulty"],
                "rounds": [
                    merge_round(en_round, translated_text["variants"][vi]["rounds"][ri])
                    for ri, en_round in enumerate(v["rounds"])
                ],
            }
            for vi, v in enumerate(en_game["variants"])
        ],
    }
