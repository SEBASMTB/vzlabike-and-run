#!/bin/bash
# E2E producción: correo automático al RECHAZAR inscripción
# - Rechazo PATCH con motivo obligatorio → emailSent en respuesta
# - Rechazo masivo (bulk) → emailsSent
# - Consulta pública mi-inscripcion → REJECTED + motivo visible + sin PII
# - Limpieza: elimina las inscripciones de prueba
set -e
BASE="https://vzlabike-and-run.vercel.app"
EVENT_ID="cmwvd2cpz0000l507ma6b9a3y"
SLUG="la-ruta-de-la-campana-admirable"
JAR="/tmp/admin-cookies-reject.txt"
MOTIVO="Comprobante de prueba ilegible - E2E rechazo"

curl -s -c "$JAR" -X POST "$BASE/api/admin/auth" -H "Content-Type: application/json" -d '{"password":"vzlabike2024"}' > /dev/null
echo "auth OK"

echo "── 1. Inscripción rápida de prueba (CON email y teléfono) ──"
RES=$(curl -s -b "$JAR" -X POST "$BASE/api/admin/registrations/quick" -H "Content-Type: application/json" -d '{
  "eventId":"'"$EVENT_ID"'", "firstName":"TEST-RECHAZO", "lastName":"E2E-TEMPORAL",
  "idNumber":"E2E999004", "gender":"M", "dateOfBirth":"1995-03-15",
  "phone":"04141234568", "email":"correo-test-rechazo@ejemplo.com",
  "categoryId":"cmwvd34k70006kz08v4mdvyvc", "paymentMethod":"efectivo", "totalAmount":0 }')
ID=$(echo "$RES" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))")
echo "  id=$ID"
[ -n "$ID" ] || { echo "FALLO: no se creo la inscripcion de prueba"; exit 1; }

echo "── 2. Esperar a que el nuevo deploy este activo (emailSent en rechazo) ──"
OK=0
for i in 1 2 3 4 5 6 7 8; do
  R=$(curl -s -b "$JAR" -X PATCH "$BASE/api/admin/registrations/$ID" \
    -H "Content-Type: application/json" \
    -d '{"status":"REJECTED","rejectReason":"'"$MOTIVO"'"}')
  HAS=$(echo "$R" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print('1' if 'emailSent' in d or d.get('status')=='REJECTED' and d.get('rejectReason') else '0')")
  EMAIL_SENT=$(echo "$R" | python3 -c "import json,sys; d=json.load(sys.stdin); print(1 if d.get('emailSent') else 0)" 2>/dev/null || echo 0)
  SKIPPED=$(echo "$R" | python3 -c "import json,sys; d=json.load(sys.stdin); print(1 if d.get('emailSkipped') else 0)" 2>/dev/null || echo 0)
  REASON=$(echo "$R" | python3 -c "import json,sys; print(json.load(sys.stdin).get('rejectReason',''))" 2>/dev/null || echo "")
  if [ "$HAS" = "1" ] && { [ "$EMAIL_SENT" = "1" ] || [ "$SKIPPED" = "1" ]; }; then
    OK=1
    echo "  intento $i: REJECTED con motivo: $REASON"
    if [ "$EMAIL_SENT" = "1" ]; then
      echo "  CORREO DE RECHAZO ENVIADO (RESEND_API_KEY activa en Vercel)"
    else
      echo "  correo omitido (emailSkipped) - RESEND_API_KEY NO configurada en Vercel"
      echo "  motivo del skip: $(echo "$R" | python3 -c "import json,sys; print(json.load(sys.stdin).get('emailError',''))")"
    fi
    break
  fi
  echo "  intento $i: deploy aun viejo, reintento en 45s..."
  # devolver a APPROVED para poder repetir la transicion
  curl -s -b "$JAR" -X PATCH "$BASE/api/admin/registrations/$ID" -H "Content-Type: application/json" -d '{"status":"APPROVED"}' > /dev/null
  sleep 45
done
[ "$OK" = "1" ] || { echo "FALLO: el deploy no activo el correo de rechazo a tiempo"; exit 1; }

echo "── 3. Consulta publica mi-inscripcion: REJECTED + motivo, sin PII ──"
curl -s "$BASE/api/events/$SLUG/mi-inscripcion?cedula=E2E999004" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print('  claves:', sorted(d.keys()))
prohibidos={'email','phone','telefono','paymentRef','referencia','dateOfBirth','emergencyContact','emergencyPhone','idNumber'}
filtrados=prohibidos & set(d.keys())
assert not filtrados, f'FALLO PII: {filtrados}'
assert d.get('status')=='REJECTED', 'FALLO: estado no es REJECTED'
assert d.get('rejectReason')=='$MOTIVO', f'FALLO: motivo no visible ({d.get(\"rejectReason\")})'
assert d.get('bibNumber') is None, 'FALLO: dorsal deberia estar liberado'
print('  OK: REJECTED + motivo visible para el corredor + sin PII + dorsal liberado')
"

echo "── 4. Rechazo MASIVO (bulk) con emailsSent ──"
RES2=$(curl -s -b "$JAR" -X POST "$BASE/api/admin/registrations/quick" -H "Content-Type: application/json" -d '{
  "eventId":"'"$EVENT_ID"'", "firstName":"TEST-RECHAZO-BULK", "lastName":"E2E-TEMPORAL",
  "idNumber":"E2E999005", "gender":"F", "dateOfBirth":"1993-07-20",
  "phone":"04141234569", "email":"correo-test-bulk@ejemplo.com",
  "categoryId":"cmwvd34k70006kz08v4mdvyvc", "paymentMethod":"efectivo", "totalAmount":0 }')
ID2=$(echo "$RES2" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))")
BULK=$(curl -s -b "$JAR" -X POST "$BASE/api/admin/registrations/bulk" -H "Content-Type: application/json" \
  -d '{"action":"reject","ids":["'"$ID2"'"],"reason":"'"$MOTIVO"'"}')
echo "$BULK" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print('  bulk:', d)
assert d.get('ok')==1 and d.get('fail')==0, 'FALLO: bulk no proceso la inscripcion'
assert 'emailsSent' in d, 'FALLO: bulk no reporta emailsSent'
print('  OK: bulk rechaza y reporta emailsSent =', d.get('emailsSent'))
"

echo "── 5. Limpiar datos de prueba ──"
curl -s -b "$JAR" -X DELETE "$BASE/api/admin/registrations/$ID" > /dev/null && echo "  test RECHAZO eliminado"
curl -s -b "$JAR" -X DELETE "$BASE/api/admin/registrations/$ID2" > /dev/null && echo "  test BULK eliminado"

echo "── 6. Estado final real del evento ──"
curl -s -b "$JAR" "$BASE/api/admin/registrations?eventId=$EVENT_ID&limit=50&status=todos" | python3 -c "
import json,sys
d=json.load(sys.stdin)
regs=d.get('registrations',[])
test=[r for r in regs if 'TEST' in (r.get('firstName') or '') or 'E2E' in (r.get('lastName') or '')]
print('  inscripciones totales:', len(regs), '| restos de prueba:', len(test))
for r in test: print('  RESTO:', r.get('id'), r.get('firstName'), r.get('lastName'))
print('  LIMPIO' if not test else '  ATENCION: quedan datos de prueba')
"
echo "── LISTO ──"
