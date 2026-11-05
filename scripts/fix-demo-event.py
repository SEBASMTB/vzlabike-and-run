#!/usr/bin/env python3
"""Fix the demo event - update boolean and numeric columns with correct types"""
import json
import os
import urllib.request
import ssl

# Read .env
env_path = "/home/z/my-project/.env"
TURSO_TOKEN = ""
TURSO_URL = "libsql://vzlabikeandrun-vbrresult.aws-us-west-2.turso.io"
with open(env_path) as f:
    for line in f:
        if line.startswith("TURSO_AUTH_TOKEN="):
            TURSO_TOKEN = line.strip().split("=", 1)[1]

db_host = TURSO_URL.replace("libsql://", "")
url = f"https://{db_host}/v2/pipeline"

# First: delete the bad event
print("=== Eliminando evento con tipos incorrectos ===")
delete_body = {
    "requests": [
        {
            "type": "execute",
            "stmt": {"sql": "DELETE FROM Event WHERE slug = 'desafio-mtb-la-culata-2026-demo'"}
        },
        {"type": "close"}
    ]
}

ctx = ssl.create_default_context()
req = urllib.request.Request(url, data=json.dumps(delete_body).encode(),
    headers={"Authorization": f"Bearer {TURSO_TOKEN}", "Content-Type": "application/json"}, method="POST")
with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
    result = json.loads(resp.read().decode())
    deleted = result["results"][0].get("response", {}).get("result", {}).get("affected_row_count", 0)
    print(f"Eventos eliminados: {deleted}")

# Now: use the app's own API to create the event properly via Prisma
# First, get admin auth cookie
print("\n=== Autenticando como admin ===")
auth_body = json.dumps({"password": "vzlabike2024"}).encode()
auth_req = urllib.request.Request(
    "https://vzlabike-and-run.vercel.app/api/admin/auth",
    data=auth_body,
    headers={"Content-Type": "application/json"},
    method="POST"
)
try:
    with urllib.request.urlopen(auth_req, context=ctx, timeout=10) as resp:
        auth_result = json.loads(resp.read().decode())
        print(f"Auth: {auth_result.get('status', 'ok')}")
        # Get the cookie
        cookies = resp.headers.get_all("Set-Cookie") or []
        admin_cookie = ""
        for c in cookies:
            if "admin_token" in c:
                admin_cookie = c.split(";")[0]
                break
        print(f"Cookie: {admin_cookie[:40]}...")
except Exception as e:
    print(f"Auth error: {e}")
    admin_cookie = ""

# Now create the event via the app's API (which uses Prisma with correct types)
print("\n=== Creando evento via API (con tipos correctos de Prisma) ===")

# Read images as base64
import base64
def read_b64(filename, mime="image/jpeg"):
    with open(f"/home/z/my-project/public/{filename}", "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")
    return f"data:{mime};base64,{data}"

banner = read_b64("event-la-culata.jpg")
banner_horiz = read_b64("hero-bg.jpg")
shirt_img = read_b64("event-farmaluna.jpg")
sponsor1 = read_b64("logo-uci.png", "image/png")
sponsor2 = read_b64("logo-fva.png", "image/png")
sponsor3 = read_b64("logo-world-athletics.png", "image/png")
prize1 = read_b64("event-campana-admirable.jpg")
prize2 = read_b64("event-triatlon.jpg")

event_payload = {
    "title": "DESAFIO MTB LA CULATA 2026 - Demo",
    "slug": "desafio-mtb-la-culata-2026-demo",
    "description": "Evento de demostracion con todas las funciones del panel admin. Desafio MTB en La Culata, Merida.",
    "date": "2026-12-15T06:00:00.000Z",
    "location": "La Culata, Sierra de Merida, Venezuela",
    "distance": "40K MTB",
    "category": "mtb",
    "sportType": "mtb",
    "imageUrl": banner,
    "bannerImage": banner,
    "bannerHorizontalUrl": banner_horiz,
    "bannerVerticalUrl": None,
    "hasShirtOption": "OPTIONAL",
    "shirtPrice": 20,
    "hasShirt": True,
    "shirtImage": shirt_img,
    "kitInfoDetails": "El kit incluye: Medalla conmemorativa, Numero de competidor, Chip de cronometraje RFID, Franela oficial del evento (opcional), Hidratacion en puntos de control, Bolso portanumeros, Stickers identificativos.",
    "price": 55,
    "priceBs": 0,
    "maxParticipants": 300,
    "requiresFederationLicense": False,
    "ageCalcMode": "event_date",
    "categoryInterval": "10",
    "status": "upcoming",
    "featured": True,
    "organizer": "VzlaBike and Run - Federacion Venezolana de Ciclismo",
    "prizes": "PREMIOS EN EFECTIVO (USD):\n\nMasculino Elite:\n1er lugar: $500\n2do lugar: $300\n3er lugar: $200\n\nFemenino Sport:\n1er lugar: $400\n2do lugar: $250\n3er lugar: $150\n\nMaster A/B/C: $200 cada categoria\nE-Bikes: $300\nDupla Familiar: 2 franelas + medallas\n\nTodos los finalistas reciben medalla de participacion.",
    "prizesImages": json.dumps([prize1, prize2]),
    "rules": "REGLAMENTO:\n1. Casco OBLIGATORIO\n2. Bicicleta con frenos operativos\n3. Edad minima: 15 anos\n4. Respetar el medio ambiente\n5. Cronometraje electronico con chip RFID\n6. Sin chip no hay resultado\n7. Fraude = descalificacion\n8. Retiro de kit: dia anterior, 9am-5pm",
    "rulesFile": "",
    "kitInfo": "Kit basico + franela opcional",
    "sponsors": "Patrocinadores oficiales",
    "sponsorsLogos": json.dumps([
        {"logo": sponsor1, "name": "UCI - Union Cycliste Internationale", "url": "https://www.uci.org"},
        {"logo": sponsor2, "name": "Federacion Venezolana de Ciclismo", "url": ""},
        {"logo": sponsor3, "name": "World Athletics", "url": "https://www.worldathletics.org"}
    ]),
    "categories": "",
}

create_req = urllib.request.Request(
    "https://vzlabike-and-run.vercel.app/api/events",
    data=json.dumps(event_payload).encode(),
    headers={
        "Content-Type": "application/json",
        "Cookie": admin_cookie,
    },
    method="POST"
)

try:
    with urllib.request.urlopen(create_req, context=ctx, timeout=60) as resp:
        result = json.loads(resp.read().decode())
        print(f"✅ Evento creado!")
        print(f"  ID: {result.get('id')}")
        print(f"  Titulo: {result.get('title')}")
        print(f"  Slug: {result.get('slug')}")
except urllib.error.HTTPError as e:
    error_body = e.read().decode()
    print(f"❌ Error HTTP {e.code}: {error_body[:500]}")
except Exception as e:
    print(f"❌ Error: {e}")
