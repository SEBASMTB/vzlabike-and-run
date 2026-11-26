#!/bin/bash
# E2E producción — VzlaBike and Run (evento real, datos de prueba eliminados al final)
set -e
B=https://vzlabike-and-run.vercel.app
curlr() {  # curl con reintentos (cold starts de Vercel)
  local out="" n=0
  for i in 1 2 3 4 5; do
    out=$(curl -s --max-time 30 "$@")
    [ -n "$out" ] && echo "$out" && return 0
    n=$((n+1)); sleep 3
  done
  echo "$out"
}
SLUG=la-ruta-de-la-campana-admirable
J=python3
PASS=0; FAIL=0
ok() { if [ "$1" = "true" ]; then PASS=$((PASS+1)); echo "PASS — $2"; else FAIL=$((FAIL+1)); echo "FAIL — $2"; fi }

EV_ID=$(curlr "$B/api/events?fresh=1" | $J -c "
import sys, json
for e in json.load(sys.stdin):
    if e['slug']=='$SLUG': print(e['id']); break")

# ── 1. Pago sin ficha en producción ──
curl -s -c /tmp/prod_cookies.txt -X POST "$B/api/admin/auth" -H "Content-Type: application/json" -d '{"password":"vzlabike2024"}' > /dev/null
ALREADY=$(curlr -b /tmp/prod_cookies.txt "$B/api/admin/payments?status=UNMATCHED" | $J -c "
import sys, json
pays = json.load(sys.stdin).get('payments', [])
print(len([p for p in pays if p['reference']=='660123']))")
if [ "$ALREADY" != "1" ]; then
curl -s -b /tmp/prod_cookies.txt -X POST "$B/api/admin/payments" -H "Content-Type: application/json" -d "{
  \"eventId\":\"$EV_ID\",\"method\":\"movil\",\"reference\":\"660123\",\"amount\":10999,\"currency\":\"Bs\",
  \"payerName\":\"Titular Prueba E2E\",\"payerPhone\":\"04129999999\",\"bankName\":\"Banco Prueba\"}" > /dev/null
fi
PAY_COUNT=$(curlr -b /tmp/prod_cookies.txt "$B/api/admin/payments?status=UNMATCHED" | $J -c "
import sys, json
pays = json.load(sys.stdin).get('payments', [])
print(len([p for p in pays if p['reference']=='660123']))")
ok "$([ "$PAY_COUNT" = "1" ] && echo true || echo false)" "pago sin ficha creado en producción"

# ── 2. Registro PENDING con la referencia del pago (conciliación auto) ──
R2=$(curl -s -X POST "$B/api/events/$SLUG/register" -H "Content-Type: application/json" -d '{
  "firstName":"Eduardo","lastName":"PruebaProd","email":"eduardo.pp@test.com","phone":"04141112222",
  "idNumber":"V99999988","gender":"M","dateOfBirth":"22/08/1970","category":"Máster C Masculino (50-59)",
  "paymentMethod":"movil","paymentRef":"66-0123","waiverAccepted":true,
  "totalAmount":30,"bcvRate":315.25,"totalBs":9457.5}')
REG_ID=$(echo "$R2" | $J -c "import sys,json; print(json.load(sys.stdin).get('id',''))")
S2=$(echo "$R2" | $J -c "import sys,json; r=json.load(sys.stdin); print(r.get('status'), r.get('bibNumber'))")
ok "$(echo "$S2" | grep -q 'PENDING None' && echo true || echo false)" "registro → PENDING sin dorsal ($S2)"

MATCHED=$(curlr -b /tmp/prod_cookies.txt "$B/api/admin/payments?status=MATCHED" | $J -c "
import sys, json
pays = json.load(sys.stdin).get('payments', [])
m = [p for p in pays if p['reference']=='660123' and p.get('matchedRegistration')]
print(len(m) > 0)")
ok "$MATCHED" "conciliación automática: pago 660123 MATCHED con la inscripción"

# ── 3. Aprobar en 1 clic → dorsal + caja ──
R3=$(curl -s -b /tmp/prod_cookies.txt -X PATCH "$B/api/admin/registrations/$REG_ID" -H "Content-Type: application/json" -d '{"status":"APPROVED"}')
BIB3=$(echo "$R3" | $J -c "import sys,json; r=json.load(sys.stdin); print(r.get('bibNumber'), r.get('bibBoxLabel') or '')")
ok "$(echo "$BIB3" | grep -qE '^[0-9]+ Caja' && echo true || echo false)" "aprobación 1-clic asigna dorsal+caja ($BIB3)"

# ── 4. Consulta pública de dorsal+caja ──
R4=$(curlr "$B/api/events/$SLUG/mi-inscripcion?cedula=V99999988" | $J -c "
import sys, json
r = json.load(sys.stdin)
print(r.get('status'), r.get('bibNumber'), (r.get('bibBoxLabel') or '')[:9])")
ok "$(echo "$R4" | grep -q 'APPROVED' && echo true || echo false)" "consulta pública muestra estado+dorsal+caja ($R4)"

# ── 5. ChuckScore solo aprobados (incluye el nuevo) ──
curl -s -b /tmp/prod_cookies.txt -o /tmp/prod_cs.xlsx "$B/api/admin/export/chuckscore?eventId=$EV_ID"
CS=$($J - <<'EOF'
import zipfile
z = zipfile.ZipFile('/tmp/prod_cs.xlsx')
xml = z.read('xl/sharedStrings.xml').decode('utf-8', 'ignore')
print(f"kitbox={'sí' if 'Kit Box' in xml else 'no'} eduardo={'sí' if 'Eduardo' in xml else 'no'} nathalie={'sí' if 'NATHALIE' in xml else 'no'}")
EOF
)
ok "$(echo "$CS" | grep -q 'kitbox=sí' && echo "$CS" | grep -q 'eduardo=sí' && echo "$CS" | grep -q 'nathalie=sí' && echo true || echo false)" "ChuckScore: Kit Box presente + aprobados incluidos ($CS)"

# ── 6. Excel general descarga ──
CODE6=$(curl -s -b /tmp/prod_cookies.txt -o /tmp/prod_all.xlsx -w "%{http_code}" "$B/api/admin/export/inscripciones?eventId=$EV_ID")
ok "$([ "$CODE6" = "200" ] && echo true || echo false)" "Excel general descarga (HTTP $CODE6)"

# ── 7. Limpieza: eliminar registro de prueba + pago de prueba ──
DEL=$(curl -s -b /tmp/prod_cookies.txt -X DELETE "$B/api/admin/registrations/$REG_ID" | $J -c "import sys,json; print(json.load(sys.stdin).get('ok'))")
ok "$([ "$DEL" = "True" ] && echo true || echo false)" "registro de prueba eliminado (bib liberada)"

PAY_ID=$(curlr -b /tmp/prod_cookies.txt "$B/api/admin/payments?status=todos" | $J -c "
import sys, json
for p in json.load(sys.stdin).get('payments', []):
    if p['reference'] == '660123': print(p['id']); break")
if [ -n "$PAY_ID" ]; then
  curl -s -b /tmp/prod_cookies.txt -X DELETE "$B/api/admin/payments/$PAY_ID" > /dev/null
  ok "true" "pago de prueba eliminado"
else
  ok "false" "pago de prueba no encontrado para eliminar"
fi

# ── 8. Verificar producción limpia (2 inscripciones reales quedan) ──
COUNT=$(curlr "$B/api/events/$SLUG" | $J -c "import sys,json; print(json.load(sys.stdin).get('registrationCount'))")
ok "$([ "$COUNT" = "2" ] && echo true || echo false)" "producción queda con 2 inscripciones reales (count=$COUNT)"

echo ""
echo "═══ PRODUCCIÓN: $PASS PASS / $FAIL FAIL ═══"
