#!usr/bin/env python3 - coding=utf-8/13
#code by : Moch Aang Ardiansyah Dev.

import json, os, re, shutil, sys, urllib.request, urllib.error
from pathlib import Path
from datetime import datetime


class AVFYP:
    def __init__(self):
        self.root = Path(__file__).resolve().parents[2]
        self.posts = self.root / "posts.json"
        self.backup = self.root / "backup"

    def clear(self):
        os.system("cls" if os.name == "nt" else "clear")

    def pause(self):
        input("\nEnter untuk kembali...")

    def load(self):
        if not self.posts.exists():
            print("[ERROR] posts.json tidak ditemukan")
            return None
        try:
            d = json.loads(self.posts.read_text(encoding="utf-8"))
            if isinstance(d, list): return d
            if isinstance(d, dict):
                for k in ("posts", "videos", "data"):
                    if isinstance(d.get(k), list): return d[k]
        except Exception as e:
            print(f"[ERROR] {e}")
        return None

    def slug(self, p): return str(p.get("slug", "")).strip()
    def title(self, p): return str(p.get("title", "")).strip()
    def thumb(self, p): return str(p.get("thumbnail") or p.get("thumb") or p.get("image") or "").strip()
    def views(self, p):
        try: return int(p.get("views", 0))
        except: return 0

    def servers(self, p):
        s = p.get("servers")
        if isinstance(s, dict):
            return str(s.get("server1", "")).strip(), str(s.get("server2", "")).strip()
        return str(p.get("st", "")).strip(), str(p.get("gd") or p.get("vd") or "").strip()

    def url(self, x):
        return bool(re.match(r"^https?://", x, re.I))

    def check_posts(self):
        self.clear(); print("=== CEK posts.json ===\n")
        posts = self.load()
        if posts is None: return self.pause()

        err, slugs = [], {}
        for i, p in enumerate(posts, 1):
            if not isinstance(p, dict):
                err.append(f"#{i} → bukan object"); continue

            s, t, th = self.slug(p), self.title(p), self.thumb(p)
            s1, s2 = self.servers(p)

            if not s: err.append(f"#{i} → slug kosong")
            else: slugs.setdefault(s, []).append(i)
            if not t: err.append(f"#{i} → title kosong")
            if th and not self.url(th): err.append(f"#{i} → thumbnail invalid")
            if not s1: err.append(f"#{i} → SERVER1 kosong")
            if s2 and not self.url(s2): err.append(f"#{i} → SERVER2 invalid")

        for s, n in slugs.items():
            if len(n) > 1: err.append(f"slug duplikat '{s}' → {n}")

        print(f"Total video : {len(posts)}\nMasalah     : {len(err)}")
        if err:
            print("\n".join("[!] " + x for x in err))
        else:
            print("\n[✓] Semua data valid.")
        self.pause()

    def search(self):
        self.clear(); print("=== CARI VIDEO ===\n")
        posts = self.load()
        if posts is None: return self.pause()

        q = input("Kata kunci: ").strip().lower()
        if not q: return print("\n[!] Kata kunci kosong.")

        found = [
            p for p in posts if isinstance(p, dict) and q in (
                self.title(p) + " " + self.slug(p) +
                " " + str(p.get("description", ""))
            ).lower()
        ]

        print(f"\nDitemukan: {len(found)}\n")
        for i, p in enumerate(found, 1):
            print(f"{i}. {self.title(p) or '-'}")
            print(f"   Slug : {self.slug(p) or '-'}")
            print(f"   Views: {self.views(p):,}\n")
        self.pause()

    def check_url(self, url):
        try:
            r = urllib.request.urlopen(
                urllib.request.Request(
                    url, method="HEAD",
                    headers={"User-Agent": "AVFYP-Admin"}
                ), timeout=8
            )
            return True, r.status
        except urllib.error.HTTPError as e:
            return False, e.code
        except:
            return False, None

    def thumbnails(self):
        self.clear(); print("=== CEK THUMBNAIL ===\n")
        posts = self.load()
        if posts is None: return self.pause()

        items = []
        seen = set()

        for p in posts:
            if isinstance(p, dict):
                u = self.thumb(p)
                if u and u not in seen:
                    seen.add(u); items.append((p, u))

        for p, u in items:
            ok, code = self.check_url(u)
            print(
                f"[{'✓' if ok else '✗'}] "
                f"{self.slug(p) or self.title(p) or '-'}"
                + ("" if ok else f" → HTTP {code}" if code else " → gagal")
            )

        self.pause()

    def servers_check(self):
        self.clear(); print("=== CEK URL SERVER ===\n")
        posts = self.load()
        if posts is None: return self.pause()

        result = {"S1 kosong": [], "S1 invalid": [], "S2 kosong": [], "S2 invalid": []}

        for p in posts:
            if not isinstance(p, dict): continue
            name = self.slug(p) or self.title(p) or "-"
            s1, s2 = self.servers(p)

            if not s1: result["S1 kosong"].append(name)
            elif not self.url(s1): result["S1 invalid"].append(name)
            if not s2: result["S2 kosong"].append(name)
            elif not self.url(s2): result["S2 invalid"].append(name)

        for k, v in result.items():
            print(f"{k:<12}: {len(v)}")
            if v:
                for x in v: print("  -", x)

        self.pause()

    def stats(self):
        self.clear(); print("=== STATISTIK ===\n")
        posts = self.load()
        if posts is None: return self.pause()

        posts = [p for p in posts if isinstance(p, dict)]

        print(f"VIDEO       : {len(posts)}")
        print(f"VIEWS       : {sum(map(self.views, posts)):,}")
        print(f"THUMBNAIL   : {sum(bool(self.thumb(p)) for p in posts)}")
        print(f"SERVER1     : {sum(bool(self.servers(p)[0]) for p in posts)}")
        print(f"SERVER2     : {sum(bool(self.servers(p)[1]) for p in posts)}")

        print("\n--- TOP 10 ---")
        for i, p in enumerate(sorted(posts, key=self.views, reverse=True)[:10], 1):
            print(f"{i:>2}. {self.title(p) or self.slug(p) or '-'} — {self.views(p):,}")

        self.pause()

    def backup_posts(self):
        self.clear(); print("=== BACKUP ===\n")
        if not self.posts.exists():
            print("[ERROR] posts.json tidak ditemukan")
            return self.pause()

        self.backup.mkdir(exist_ok=True)
        dest = self.backup / f"posts_{datetime.now():%Y-%m-%d_%H-%M-%S}.json"
        shutil.copy2(self.posts, dest)
        print(f"[✓] Backup: {dest}")
        self.pause()

    def run(self):
        menu = {
            "1": self.check_posts,
            "2": self.search,
            "3": self.thumbnails,
            "4": self.servers_check,
            "6": self.stats,
            "7": self.backup_posts
        }

        while True:
            self.clear()
            print("""╔════════════════════════════════╗
║       AVFYP ADMIN TOOLS       ║
╚════════════════════════════════╝

[1] Cek posts.json
[2] Cari video
[3] Cek thumbnail
[4] Cek URL server
[6] Statistik video
[7] Backup posts.json
[0] Keluar
""")

            c = input("Pilih menu: ").strip()

            if c == "0":
                sys.exit("Keluar...")
            elif c in menu:
                menu[c]()
            else:
                print("[!] Pilihan tidak tersedia")
                self.pause()


if __name__ == "__main__":
    AVFYP().run()
