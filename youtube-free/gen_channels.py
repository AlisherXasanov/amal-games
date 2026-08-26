import json
import re
import sys
import urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SRC = r"C:\Users\User\AppData\Local\Temp\yt_full.json"
OUT = r"C:\Users\User\zombie-vs-plants\games\youtube-free\channels-data.js"

META = {
    "tri-kota": dict(name="Три кота", emoji="🐱", color="#ff9f43", desc="Коржик, Компот и Карамелька.", subs="12.4 млн"),
    "tri-beach": dict(
        name="Три кота · Пляж",
        emoji="🏖️",
        color="#74b9ff",
        desc="Настоящие серии про пляж и море — не трейлеры.",
        subs="12.4 млн",
        featured=True,
    ),
    "fixiki": dict(name="Фиксики", emoji="🔧", color="#55efc4", desc="Симка, Нолик и техника.", subs="6.7 млн"),
    "poznavatel": dict(name="Познаватель", emoji="🐻", color="#e17055", desc="Желейный медведь Валера и эксперименты.", subs="14.8 млн"),
    "fixeye": dict(name="Фиксай", emoji="👁️", color="#00cec9", desc="FixEye — Майнкрафт и приключения.", subs="11.4 млн"),
    "vladus": dict(name="Владус", emoji="🟩", color="#55efc4", desc="Владус Мармеладус — Майнкрафт и сюжеты.", subs="4.5 млн"),
    "vlada4": dict(name="Vlad A4", emoji="🔥", color="#e17055", desc="Челленджи и эксперименты.", subs="48 млн"),
    "mrbeast": dict(name="MrBeast", emoji="💰", color="#00b894", desc="Большие призы и челленджи.", subs="420 млн"),
    "sladosti": dict(name="Сладости или гадости", emoji="🍬", color="#fd79a8", desc="Сладкое vs гадость — челленджи.", subs="1.4 млн"),
    "yaroks": dict(name="Ярокс Блог", emoji="🚀", color="#a29bfe", desc="Standoff 2, игры и влоги.", subs="2.3 млн"),
    "sakvashin": dict(name="Саквашин", emoji="🥒", color="#84cc16", desc="Саша Квашеная — приколы и нарезки.", subs="1.1 млн"),
    "gravity": dict(name="Gravity Falls", emoji="🌲", color="#16a34a", desc="Гравити Фолз — песни и серии.", subs="620 тыс."),
    "marmeladus": dict(name="Владус Мармеладус", emoji="🍭", color="#4ade80", desc="Майнкрафт-сюжеты и приключения.", subs="4.5 млн"),
    "billionent": dict(name="Биллиент", emoji="💎", color="#38bdf8", desc="Майнкрафт, Roblox и челленджи.", subs="1.6 млн"),
    "amal-room": dict(
        name="Канал Amal",
        emoji="🌙",
        color="#f0b429",
        desc="Твои ролики — без рекламы YouTube.",
        subs="ты",
        allowUpload=True,
    ),
}

BEACH_VIDEOS = [
    {
        "id": "BkoQ-SqRPKk",
        "title": "Поездка на пляж · серия №160",
        "likes": "1.4 млн",
        "thumb": "https://i.ytimg.com/vi/BkoQ-SqRPKk/hqdefault.jpg",
        "part": 1,
    },
    {
        "id": "JV2SuYUyM3s",
        "title": "Сезон 4 · Поездка на пляж",
        "likes": "980 тыс.",
        "thumb": "https://i.ytimg.com/vi/JV2SuYUyM3s/hqdefault.jpg",
        "part": 2,
    },
    {
        "id": "7t4I-e1BeWM",
        "title": "Морские игры · серия №129",
        "likes": "870 тыс.",
        "thumb": "https://i.ytimg.com/vi/7t4I-e1BeWM/hqdefault.jpg",
        "part": 3,
    },
    {
        "id": "1XHJIYJFyB4",
        "title": "Водный поход · №244",
        "likes": "760 тыс.",
        "thumb": "https://i.ytimg.com/vi/1XHJIYJFyB4/hqdefault.jpg",
    },
    {
        "id": "4p4F866Tzl8",
        "title": "Море приключений · Крабы не еда 🎵",
        "likes": "540 тыс.",
        "thumb": "https://i.ytimg.com/vi/4p4F866Tzl8/hqdefault.jpg",
    },
]

YAROKS_ID = "UCAHCkDpk5bjGEfsmiRIDEqA"


def rss(channel_id, limit=15):
    url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
    with urllib.request.urlopen(url, timeout=20) as r:
        xml = r.read().decode("utf-8", "replace")
    ids = re.findall(r"<yt:videoId>([^<]+)</yt:videoId>", xml)[:limit]
    titles = re.findall(r"<title>([^<]+)</title>", xml)[1 : limit + 1]
    out = []
    for vid, title in zip(ids, titles):
        t = title.strip()
        short = "#shorts" in t.lower() or "shorts" in t.lower()
        out.append(
            {
                "id": vid,
                "title": t[:96],
                "likes": "—",
                "thumb": f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
                **({"short": True} if short else {}),
            }
        )
    return out


def trim_title(title):
    t = title.strip()
    if len(t) > 72:
        return t[:69] + "…"
    return t


def fake_likes(i):
    vals = ["520 тыс.", "410 тыс.", "360 тыс.", "310 тыс.", "280 тыс.", "240 тыс.", "210 тыс.", "180 тыс."]
    return vals[i % len(vals)]


with open(SRC, encoding="utf-8") as f:
    fetched = json.load(f)

# extra channels via RSS
fetched["yaroks"] = {
    "channelId": YAROKS_ID,
    "uploads": "UU" + YAROKS_ID[2:],
    "icon": "",
    "videos": rss(YAROKS_ID, 15),
}
if fetched["yaroks"]["videos"]:
    fetched["yaroks"]["icon"] = fetched["yaroks"]["videos"][0]["thumb"]

# sladosti + 5 новых каналов через RSS
EXTRA_IDS = {
    "sladosti": "UCS6P_uMrthRW5LYR9yahNnQ",
    "sakvashin": "UCLTgbvgydbIU3OQ0Z-PpTpA",
    "gravity": "UC4EgyB4PSOUqfcHUaj6VbIQ",
    "marmeladus": "UCPG6OP7eL7kLuyFpQMdqYSA",
    "billionent": "UCu1aua1z80iY-KrZd1W4Bhw",
}
for key, cid in EXTRA_IDS.items():
    vids = rss(cid, 15)
    fetched[key] = {
        "channelId": cid,
        "uploads": "UU" + cid[2:],
        "icon": vids[0]["thumb"] if vids else "",
        "videos": vids,
    }

channels = []
order = [
    "tri-beach",
    "tri-kota",
    "fixiki",
    "poznavatel",
    "fixeye",
    "vladus",
    "marmeladus",
    "vlada4",
    "mrbeast",
    "sakvashin",
    "gravity",
    "sladosti",
    "billionent",
    "yaroks",
    "amal-room",
]

for key in order:
    meta = META[key]
    if key == "amal-room":
        channels.append(
            {
                "id": key,
                "name": meta["name"],
                "emoji": meta["emoji"],
                "color": meta["color"],
                "desc": meta["desc"],
                "subs": meta["subs"],
                "allowUpload": True,
                "icon": "",
                "videos": [],
            }
        )
        continue

    if key == "tri-beach":
        base = fetched.get("tri-kota", {})
        ch = {
            "id": key,
            "name": meta["name"],
            "emoji": meta["emoji"],
            "color": meta["color"],
            "desc": meta["desc"],
            "subs": meta["subs"],
            "channelId": base.get("channelId", "UCdSaNPMpj-Vi_SF6_MAFpSw"),
            "uploads": base.get("uploads", "UUdSaNPMpj-Vi_SF6_MAFpSw"),
            "icon": BEACH_VIDEOS[0]["thumb"],
            "featured": True,
            "videos": BEACH_VIDEOS
            + [
                {
                    "id": "playlist",
                    "title": "▶ Все серии «Три кота»",
                    "playlist": base.get("uploads", "UUdSaNPMpj-Vi_SF6_MAFpSw"),
                    "likes": "—",
                    "thumb": base.get("icon", BEACH_VIDEOS[0]["thumb"]),
                }
            ],
        }
        channels.append(ch)
        continue

    data = fetched.get(key)
    if not data:
        continue

    videos = []
    for i, v in enumerate(data.get("videos", [])[:15]):
        item = {
            "id": v["id"],
            "title": trim_title(v["title"]),
            "likes": v.get("likes") if v.get("likes") and v.get("likes") != "—" else fake_likes(i),
            "thumb": v["thumb"],
        }
        if v.get("short"):
            item["short"] = True
        videos.append(item)

    uploads = data.get("uploads") or ("UU" + data["channelId"][2:])
    if videos:
        videos.append(
            {
                "id": "playlist",
                "title": "▶ Все ролики канала",
                "playlist": uploads,
                "likes": "—",
                "thumb": data.get("icon") or videos[0]["thumb"],
            }
        )

    ch = {
        "id": key,
        "name": meta["name"],
        "emoji": meta["emoji"],
        "color": meta["color"],
        "desc": meta["desc"],
        "subs": meta["subs"],
        "channelId": data["channelId"],
        "uploads": uploads,
        "icon": data.get("icon") or (videos[0]["thumb"] if videos else ""),
        "videos": videos,
    }
    if meta.get("featured"):
        ch["featured"] = True
    channels.append(ch)

# fix mrbeast main channel
mr = next(c for c in channels if c["id"] == "mrbeast")
mr["channelId"] = "UCX6OQ3DkcsbYNE6H8uQQuVA"
mr["uploads"] = "UUX6OQ3DkcsbYNE6H8uQQuVA"
try:
    mr_vids = rss("UCX6OQ3DkcsbYNE6H8uQQuVA", 12)
    mr["videos"] = [
        {
            "id": v["id"],
            "title": trim_title(v["title"]),
            "likes": fake_likes(i),
            "thumb": v["thumb"],
            **({"short": True} if v.get("short") else {}),
        }
        for i, v in enumerate(mr_vids)
    ] + [
        {
            "id": "playlist",
            "title": "▶ Все ролики MrBeast",
            "playlist": "UUX6OQ3DkcsbYNE6H8uQQuVA",
            "likes": "—",
            "thumb": mr_vids[0]["thumb"] if mr_vids else mr["icon"],
        }
    ]
    if mr_vids:
        mr["icon"] = mr_vids[0]["thumb"]
except Exception as e:
    print("mrbeast rss warn", e, file=sys.stderr)


def js_str(s):
    return json.dumps(s, ensure_ascii=False)


lines = [
    "/**",
    " * Настоящие ролики (YouTube id) + превью + иконки каналов.",
    " * tri-beach — официальные серии про пляж, не трейлеры.",
    " */",
    "window.YT_CHANNELS = " + json.dumps(channels, ensure_ascii=False, indent=2) + ";",
]

with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")

print("Wrote", OUT, "channels:", len(channels))
for c in channels:
    print(c["id"], len(c.get("videos", [])))
