#!/bin/bash
# Inspección de producción: categorías + dorsales del evento CAMPAÑA ADMIRABLE
BASE="https://vzlabike-and-run.vercel.app"
SLUG="la-ruta-de-la-campana-admirable"
JAR="/tmp/admin-cookies.txt"

curl -s -c "$JAR" -X POST "$BASE/api/admin/auth" \
  -H "Content-Type: application/json" \
  -d '{"password":"vzlabike2024"}' > /tmp/auth.json
echo "AUTH: $(cat /tmp/auth.json)"

echo "── CATEGORÍAS DEL EVENTO ──"
curl -s -b "$JAR" "$BASE/api/events/$SLUG" | python3 -c "
import json,sys
d=json.load(sys.stdin)
ev=d.get('event',d)
print('maxParticipants:', ev.get('maxParticipants'))
print('bibBoxSize:', ev.get('bibBoxSize'))
cats=ev.get('categories',[])
for c in cats:
    print(f\"  {c.get('name','?'):28s} M/F={c.get('gender','?'):5s} edad={c.get('minAge','?')}-{c.get('maxAge','?')}  lote={c.get('bibStart')}-{c.get('bibEnd')}\")
"

echo "── INSCRIPCIONES CON DORSAL ──"
curl -s -b "$JAR" "$BASE/api/admin/registrations?eventId=$SLUG" > /tmp/regs.json
python3 -c "
import json
d=json.load(open('/tmp/regs.json'))
regs=d.get('registrations',d if isinstance(d,list) else [])
for r in regs:
    if r.get('bibNumber') is not None:
        print(f\"  bib={r['bibNumber']:4d}  {r.get('firstName','')} {r.get('lastName',''):30s} cat={r.get('category') or r.get('categoryName','?')}  estado={r.get('status')}\")
print('total regs:', len(regs))
"
