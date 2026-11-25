#!/bin/bash
# ============================================================
# APLICACIÓN EN PRODUCCIÓN: lotes de dorsales ordenados
# Élite → Juvenil → menor a mayor edad, +10 reserva por categoría
# Evento: LA RUTA DE LA CAMPAÑA ADMIRABLE
# Re-aprueba las 3 inscripciones mal asignadas (1,2,3) y hace
# el E2E Élite vs Máster C. Limpia sus datos de prueba al final.
# ============================================================
set -e
BASE="https://vzlabike-and-run.vercel.app"
EVENT_ID="cmwvd2cpz0000l507ma6b9a3y"
SLUG="la-ruta-de-la-campana-admirable"
JAR="/tmp/admin-cookies.txt"

echo "── 0. Esperar deploy nuevo (código con lote implícito) ──"
for i in $(seq 1 30); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/health" || true)
  if [ "$CODE" = "200" ]; then echo "health OK"; break; fi
  sleep 10
done

curl -s -c "$JAR" -X POST "$BASE/api/admin/auth" -H "Content-Type: application/json" -d '{"password":"vzlabike2024"}' > /dev/null
echo "auth OK"

echo "── 1. Cargar categorías actuales con precios ──"
curl -s -b "$JAR" "$BASE/api/admin/events/$EVENT_ID/categories" > /tmp/cats.json
python3 << 'EOF'
import json
cats = json.load(open('/tmp/cats.json'))
print(f"categorias actuales: {len(cats)}")
# Guardar payload con datos intactos (precios, distancias) para el upsert
out = []
for c in cats:
    out.append({
        "name": c["name"], "minAge": c["minAge"], "maxAge": c["maxAge"],
        "gender": c["gender"],
        "distanceKm": c.get("distanceKm"), "price": c.get("price"),
    })
json.dump(out, open('/tmp/cats-payload.json','w'))
EOF

echo "── 2. Calcular lotes (mismo algoritmo: base 31 + reserva 10 = 41) ──"
python3 << 'EOF'
import json
cats = json.load(open('/tmp/cats.json'))
def prio(c):
    n = (c.get("name") or "").upper()
    if "ÉLITE" in n or "ELITE" in n: return 0
    if "JUVENIL" in n or "JUNIOR" in n: return 1
    return 2 + min(c.get("minAge") or 99, 80) / 100
# orden estable: el array viene de la BD (gender asc, minAge asc)
order = sorted(range(len(cats)), key=lambda i: prio(cats[i]))
base = max(1, 500 // len(cats)); block = base + 10
cursor = 1
lots = {}
for i in order:
    lots[cats[i]["id"]] = (cursor, cursor + block - 1)
    print(f"  {cats[i]['name']:44s} {cats[i]['gender']:5s} lote {cursor}–{cursor+block-1}")
    cursor += block
# Añadir bibStart/bibEnd al payload conservando identidad (upsert preserva IDs)
payload = json.load(open('/tmp/cats-payload.json'))
for p in payload:
    key = None
    for cid,(s,e) in lots.items():
        pass
# mapear por identidad nombre|genero|min|max
lot_by_identity = {}
idmap = {c["id"]: c for c in cats}
for cid,(s,e) in lots.items():
    c = idmap[cid]
    lot_by_identity[f'{c["name"].strip().upper()}|{c["gender"]}|{c["minAge"]}|{c["maxAge"]}'] = (s,e)
for p in payload:
    key = f'{p["name"].strip().upper()}|{p["gender"]}|{p["minAge"]}|{p["maxAge"]}'
    s,e = lot_by_identity[key]
    p["bibStart"], p["bibEnd"] = s, e
json.dump({"categories": payload}, open('/tmp/bulk-payload.json','w'))
print("payload bulk listo con lotes")
EOF

echo "── 3. Aplicar lotes (bulk upsert, conserva IDs de inscripciones) ──"
curl -s -b "$JAR" -X POST "$BASE/api/admin/events/$EVENT_ID/categories/bulk" \
  -H "Content-Type: application/json" \
  --data @/tmp/bulk-payload.json | python3 -c "import json,sys; d=json.load(sys.stdin); print('upsert:', d.get('updated'), 'creados:', d.get('created'), 'eliminados:', d.get('removed'), 'total:', d.get('count'))"

echo "── 4. Re-aprobar las 3 inscripciones mal asignadas ──"
# PENDING libera el dorsal; APPROVED reasigna dentro del lote correcto
for REG in "cmww98nl20002jt08u88novsg:FELIPI(MasterD)" "cmww30ksc0005jh083tutcmpw:NATHALIE(MasterB-F)" "cmww2wu0o0002jh084mw9no9d:FUNDACION(MasterC)"; do
  ID="${REG%%:*}"; NAME="${REG##*:}"
  curl -s -b "$JAR" -X PATCH "$BASE/api/admin/registrations/$ID" -H "Content-Type: application/json" -d '{"status":"PENDING"}' > /dev/null
  RES=$(curl -s -b "$JAR" -X PATCH "$BASE/api/admin/registrations/$ID" -H "Content-Type: application/json" -d '{"status":"APPROVED"}')
  echo "$NAME → $(echo $RES | python3 -c "import json,sys; d=json.load(sys.stdin); print('bib', d.get('bibNumber'), d.get('bibBoxLabel',''), d.get('bibWarning') or '')")"
done

echo "── 5. E2E: inscripción rápida ÉLITE vs MÁSTER C (datos de prueba) ──"
R1=$(curl -s -b "$JAR" -X POST "$BASE/api/admin/registrations/quick" -H "Content-Type: application/json" -d '{
  "eventId":"'"$EVENT_ID"'", "firstName":"TEST-ELITE", "lastName":"E2E-TEMPORAL",
  "idNumber":"E2E999001", "gender":"M", "dateOfBirth":"1998-05-10",
  "categoryId":"cmwvd34k70006kz08v4mdvyvc", "paymentMethod":"efectivo", "totalAmount":0 }')
B1=$(echo "$R1" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('bibNumber'), d.get('bibBoxLabel',''), d.get('id',''))")
echo "Élite M → bib $B1 (esperado: 1, dentro de 1–41)"

R2=$(curl -s -b "$JAR" -X POST "$BASE/api/admin/registrations/quick" -H "Content-Type: application/json" -d '{
  "eventId":"'"$EVENT_ID"'", "firstName":"TEST-MASTER-C", "lastName":"E2E-TEMPORAL",
  "idNumber":"E2E999002", "gender":"M", "dateOfBirth":"1965-03-20",
  "categoryId":"cmwvd34k7000akz08u56zhdqc", "paymentMethod":"efectivo", "totalAmount":0 }')
B2=$(echo "$R2" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('bibNumber'), d.get('bibBoxLabel',''), d.get('id',''))")
echo "Máster C → bib $B2 (esperado: dentro de 575–615, JAMÁS el #1)"

echo "── 6. Limpiar datos de prueba E2E ──"
ID1=$(echo "$R1" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))")
ID2=$(echo "$R2" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))")
curl -s -b "$JAR" -X DELETE "$BASE/api/admin/registrations/$ID1" > /dev/null && echo "test Élite eliminado"
curl -s -b "$JAR" -X DELETE "$BASE/api/admin/registrations/$ID2" > /dev/null && echo "test Máster C eliminado"

echo "── 7. Estado final ──"
curl -s -b "$JAR" "$BASE/api/admin/registrations?eventId=$EVENT_ID&limit=50&status=todos" | python3 -c "
import json,sys
d=json.load(sys.stdin)
for r in d.get('registrations',[]):
    print(f\"  bib={r.get('bibNumber')} {r.get('status'):9s} {r.get('firstName','')} {r.get('lastName','')} | {r.get('category','')}\")"
echo "── LISTO ──"
