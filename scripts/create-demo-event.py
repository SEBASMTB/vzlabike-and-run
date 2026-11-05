#!/usr/bin/env python3
"""
Crea un evento de demostración con todas las funciones del panel admin.
Conecta directamente a Turso y crea el evento con imágenes, sponsors, premios, etc.
"""
import json
import base64
import os
import sys
import urllib.request

# Turso credentials
TURSO_URL = "libsql://vzlabikeandrun-vbrresult.aws-us-west-2.turso.io"
TURSO_TOKEN = os.environ.get("TURSO_AUTH_TOKEN", "")

# Read .env file
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            if "=" in line and not line.strip().startswith("#"):
                key, val = line.strip().split("=", 1)
                if key == "TURSO_AUTH_TOKEN":
                    TURSO_TOKEN = val

if not TURSO_TOKEN:
    print("ERROR: TURSO_AUTH_TOKEN no encontrado en .env")
    sys.exit(1)

# Try to use libsql client
try:
    sys.path.insert(0, "/home/z/my-project/node_modules/@libsql/client/lib-cjs")
except:
    pass

# Use the HTTP API directly via Turso REST API
import http.client
import ssl

PUBLIC_DIR = "/home/z/my-project/public"

def read_b64(filename, mime="image/jpeg"):
    """Read a file and return as data URL"""
    filepath = os.path.join(PUBLIC_DIR, filename)
    with open(filepath, "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")
    return f"data:{mime};base64,{data}"

# Prepare images
banner = read_b64("event-la-culata.jpg", "image/jpeg")
banner_horiz = read_b64("hero-bg.jpg", "image/jpeg")
shirt_img = read_b64("event-farmaluna.jpg", "image/jpeg")

sponsor1 = read_b64("logo-uci.png", "image/png")
sponsor2 = read_b64("logo-fva.png", "image/png")
sponsor3 = read_b64("logo-world-athletics.png", "image/png")

prize1 = read_b64("event-campana-admirable.jpg", "image/jpeg")
prize2 = read_b64("event-triatlon.jpg", "image/jpeg")

# Build the event data
import time, random
event_id = f"evt-demo-{int(time.time())}-{random.randint(1000,9999)}"

event_data = {
    "id": event_id,
    "title": "DESAFIO MTB LA CULATA 2026 - Evento Demo",
    "slug": "desafio-mtb-la-culata-2026-demo",
    "description": "Evento de demostracion con todas las funciones del panel admin activadas. Desafio MTB en las montanas de La Culata, Merida. Un reto para ciclistas de montana con recorridos tecnicos y paisajes espectaculares en plena serrania venezolana.",
    "date": "2026-12-15T06:00:00.000Z",
    "location": "La Culata, Sierra de Merida, Venezuela",
    "distance": "40K MTB",
    "category": "mtb",
    "sportType": "mtb",
    "imageUrl": banner,
    "bannerImage": banner,
    "bannerHorizontalUrl": banner_horiz,
    "bannerVerticalUrl": "",
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
    "prizes": """PREMIOS EN EFECTIVO (USD):

Masculino Elite:
1er lugar: $500
2do lugar: $300
3er lugar: $200

Femenino Sport:
1er lugar: $400
2do lugar: $250
3er lugar: $150

Master A/B/C:
1er lugar: $200 cada categoria

E-Bikes:
1er lugar: $300

Dupla Familiar:
1er lugar: 2 franelas + medallas

Todos los finalistas reciben medalla de participacion.""",
    "prizesImages": json.dumps([prize1, prize2]),
    "rules": """REGLAMENTO DEL EVENTO:

1. El uso de casco es OBLIGATORIO durante toda la carrera.
2. La bicicleta debe cumplir con normas de seguridad (frenos operativos, etc).
3. Edad minima: 15 anos (con autorizacion de representante legal).
4. Los corredores deben respetar el medio ambiente (no dejar basura).
5. El cronometraje es electronico con chip RFID - sin chip no hay resultado.
6. Cualquier acto de fraude descalifica al participante.
7. El organizador se reserva el derecho de modificar el recorrido por seguridad.
8. Retiro de kit: Dia anterior al evento, 9am-5pm.""",
    "rulesFile": "",
    "kitInfo": "Kit basico + franela opcional",
    "sponsors": "Patrocinadores oficiales del evento",
    "sponsorsLogos": json.dumps([
        {"logo": sponsor1, "name": "UCI - Union Cycliste Internationale", "url": "https://www.uci.org"},
        {"logo": sponsor2, "name": "Federacion Venezolana de Ciclismo", "url": ""},
        {"logo": sponsor3, "name": "World Athletics", "url": "https://www.worldathletics.org"}
    ]),
    "categories": "",
    "createdAt": "2026-11-05T20:00:00.000Z",
    "updatedAt": "2026-11-05T20:00:00.000Z",
}

# Insert via Turso HTTP API
# Turso REST API endpoint: https://<db-url>/v2/pipeline
# Auth: Bearer <token>

db_host = TURSO_URL.replace("libsql://", "")
url = f"https://{db_host}/v2/pipeline"

# Build SQL INSERT
columns = list(event_data.keys())
placeholders = [f":{c}" for c in columns]
col_list = ", ".join(f'"{c}"' for c in columns)
val_list = ", ".join(placeholders)

sql = f'INSERT INTO Event ({col_list}) VALUES ({val_list})'

# Turso pipeline request body
body = {
    "requests": [
        {
            "type": "execute",
            "stmt": {
                "sql": sql,
                "args": [
                    {"type": "text", "value": str(event_data[c]) if event_data[c] is not None else ""}
                    for c in columns
                ]
            }
        },
        {"type": "close"}
    ]
}

print(f"=== Creando evento en Turso ===")
print(f"URL: {TURSO_URL}")
print(f"Titulo: {event_data['title']}")
print(f"Payload: {len(json.dumps(body))} bytes")
print()

# Make the request
req = urllib.request.Request(
    url,
    data=json.dumps(body).encode("utf-8"),
    headers={
        "Authorization": f"Bearer {TURSO_TOKEN}",
        "Content-Type": "application/json",
    },
    method="POST",
)

ctx = ssl.create_default_context()

try:
    with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
        result = json.loads(resp.read().decode("utf-8"))
        print("✅ Evento creado exitosamente!")
        print(f"Respuesta: {json.dumps(result, indent=2)[:500]}")
        
        # Verify
        print("\n=== Verificando ===")
        verify_body = {
            "requests": [
                {
                    "type": "execute",
                    "stmt": {"sql": "SELECT title, slug, sportType, price, featured FROM Event WHERE slug = 'desafio-mtb-la-culata-2026-demo'"}
                },
                {"type": "close"}
            ]
        }
        verify_req = urllib.request.Request(
            url,
            data=json.dumps(verify_body).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {TURSO_TOKEN}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(verify_req, context=ctx, timeout=15) as vresp:
            vresult = json.loads(vresp.read().decode("utf-8"))
            if vresult.get("results") and vresult["results"][0].get("response", {}).get("result", {}).get("rows"):
                rows = vresult["results"][0]["response"]["result"]["rows"]
                for row in rows:
                    vals = [v.get("value", v.get("text", "")) for v in row.get("values", [])]
                    print(f"  Titulo: {vals[0]}")
                    print(f"  Slug: {vals[1]}")
                    print(f"  Deporte: {vals[2]}")
                    print(f"  Precio: ${vals[3]}")
                    print(f"  Destacado: {vals[4]}")
            else:
                print("Evento encontrado pero no se pudo leer")
except urllib.error.HTTPError as e:
    error_body = e.read().decode("utf-8")
    print(f"❌ Error HTTP {e.code}: {error_body[:500]}")
except Exception as e:
    print(f"❌ Error: {e}")
