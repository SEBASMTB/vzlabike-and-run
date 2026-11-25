#!/bin/bash
# E2E producción: notificaciones al aprobar (correo + WhatsApp + PII)
set -e
BASE="https://vzlabike-and-run.vercel.app"
EVENT_ID="cmwvd2cpz0000l507ma6b9a3y"
SLUG="la-ruta-de-la-campana-admirable"
JAR="/tmp/admin-cookies.txt"

curl -s -c "$JAR" -X POST "$BASE/api/admin/auth" -H "Content-Type: application/json" -d '{"password":"vzlabike2024"}' > /dev/null
echo "auth OK"

echo "── 1. Inscripción rápida CON email y teléfono (Élite M) ──"
RES=$(curl -s -b "$JAR" -X POST "$BASE/api/admin/registrations/quick" -H "Content-Type: application/json" -d '{
  "eventId":"'"$EVENT_ID"'", "firstName":"TEST-NOTIF", "lastName":"E2E-TEMPORAL",
  "idNumber":"E2E999003", "gender":"M", "dateOfBirth":"1998-05-10",
  "phone":"04141234567", "email":"correo-test@ejemplo.com",
  "categoryId":"cmwvd34k70006kz08v4mdvyvc", "paymentMethod":"efectivo", "totalAmount":0 }')
echo "$RES" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print('  bib:', d.get('bibNumber'), '| caja:', d.get('bibBoxLabel'))
print('  emailSent:', d.get('emailSent'), '| emailSkipped:', d.get('emailSkipped'), '| motivo:', d.get('emailError'))
print('  (esperado: emailSent=false, emailSkipped=true — RESEND_API_KEY aun no configurada en Vercel)')
assert d.get('bibNumber') is not None, 'FALLO: sin dorsal'
assert d.get('emailSkipped') == True, 'FALLO: email no fue marcado como skipped'
print('  OK: flujo funciona y no se bloquea sin API key')
"

echo "── 2. Consulta pública mi-inscripcion: SOLO datos seguros ──"
curl -s "$BASE/api/events/$SLUG/mi-inscripcion?cedula=E2E999003" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print('  claves devueltas:', sorted(d.keys()))
prohibidos={'email','phone','telefono','paymentRef','referencia','dateOfBirth','emergencyContact','emergencyPhone','idNumber'}
filtrados=prohibidos & set(d.keys())
assert not filtrados, f'FALLO PII: {filtrados}'
assert d.get('bibNumber') is not None and d.get('bibBoxLabel'), 'FALLO: falta dorsal/caja'
print('  OK: sin PII - solo nombre/categoria/estado/dorsal/caja/talla')
"

echo "── 3. Aprobación PATCH de un PENDING dispara campo de correo ──"
# Crear un PENDING real vía API admin (PATCH desde quick no aplica aquí; usar el flujo PATCH):
# tomar la inscripción de prueba creada y devolverla a PENDING para probar PATCH→APPROVED
ID=$(echo "$RES" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))")
curl -s -b "$JAR" -X PATCH "$BASE/api/admin/registrations/$ID" -H "Content-Type: application/json" -d '{"status":"PENDING"}' > /dev/null
RES2=$(curl -s -b "$JAR" -X PATCH "$BASE/api/admin/registrations/$ID" -H "Content-Type: application/json" -d '{"status":"APPROVED"}')
echo "$RES2" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print('  re-aprobada: bib', d.get('bibNumber'), '| emailSent:', d.get('emailSent'), '| emailSentTo:', d.get('emailSentTo'), '| skip:', d.get('emailSkipped'))
assert d.get('bibNumber') is not None, 'FALLO: PATCH no asigno dorsal'
print('  OK: PATCH APPROVED asigna dorsal y reporta estado del correo')
"

echo "── 4. Limpiar dato de prueba ──"
curl -s -b "$JAR" -X DELETE "$BASE/api/admin/registrations/$ID" > /dev/null && echo "  test NOTIF eliminado"

echo "── 5. Estado final real ──"
curl -s -b "$JAR" "$BASE/api/admin/registrations?eventId=$EVENT_ID&limit=50&status=todos" | python3 -c "
import json,sys
d=json.load(sys.stdin)
for r in d.get('registrations',[]):
    print(f\"  bib={r.get('bibNumber')} {r.get('status'):9s} {r.get('firstName','')} {r.get('lastName','')}\")"
echo "── LISTO ──"
