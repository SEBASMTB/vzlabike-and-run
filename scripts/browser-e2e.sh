#!/bin/bash
# E2E visual del wizard: prefill por cédula → categoría bloqueada → recibo completo
set -e
cd /home/z/my-project

mkdir -p scripts/shots

# 1. Servidor
setsid nohup bun run dev > /tmp/devserver.log 2>&1 < /dev/null &
for i in $(seq 1 30); do
  sleep 2
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || true)
  [ "$code" = "200" ] && break
done
echo "health: $code"

# 2. Evento de prueba (franela opcional, sin categorías → fallback estándar)
TOKEN=$(node -e 'const now=Math.floor(Date.now()/1000);const p={sub:"admin",role:"admin",iat:now,exp:now+3600};console.log("vzlabike-admin-secret-key."+Buffer.from(JSON.stringify(p)).toString("base64url"))')
curl -s -X POST http://localhost:3000/api/events -H "Content-Type: application/json" \
  -H "Cookie: admin_token=$TOKEN" \
  -d '{"title":"TEST RECIBO COMPLETO","slug":"test-recibo-completo","sportType":"running","date":"2027-04-10","location":"Valencia, Carabobo","distance":"21K","category":"running","price":30,"hasShirt":true,"hasShirtOption":"OPTIONAL","shirtPrice":5,"maxParticipants":200}' -o /dev/null -w "evento: %{http_code}\n"

AB="agent-browser"
$AB close >/dev/null 2>&1 || true
$AB set viewport 1280 900
$AB open http://localhost:3000/eventos/test-recibo-completo/inscribirse
$AB wait --load networkidle || true
sleep 3

# 3. Paso 1: escribir cédula de corredor existente (V-18456789) → banner + prefill
$AB eval "
const el = document.getElementById('cedula');
const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
setter.call(el,'V-18456789');
el.dispatchEvent(new Event('input',{bubbles:true}));
'ok'"
sleep 3
echo "--- banner prefill:"
$AB get text "[data-slot=card] .bg-emerald-50" || true
$AB screenshot scripts/shots/step1-prefill.png

# fecha de nacimiento (para edad + categoría)
$AB eval "
const el = document.getElementById('fechaNacimiento');
const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
setter.call(el,'1990-06-15');
el.dispatchEvent(new Event('input',{bubbles:true}));
'ok'"

# género M vía select de shadcn (combobox)
$AB eval "
const btns = Array.from(document.querySelectorAll('[role=combobox]'));
const gen = btns.find(b => b.closest('div')?.querySelector('label')?.textContent?.includes('Género'));
(gen || btns[0]).click();
'ok'"
sleep 1
$AB eval "
const opts = Array.from(document.querySelectorAll('[role=option]'));
const m = opts.find(o => o.textContent.trim() === 'Masculino');
if (m) m.click();
opts.map(o=>o.textContent.trim()).join('|')"
sleep 1

# nombres/apellidos deben venir prellenados del lookup
echo "--- nombres prellenados:"
$AB eval "document.getElementById('nombres').value + ' ' + document.getElementById('apellidos').value + ' | email: ' + document.getElementById('email').value"
$AB screenshot scripts/shots/step1-lleno.png

# 4. Avanzar a paso 3 y ver categoría bloqueada
$AB find text "Siguiente" click
sleep 1
$AB find text "Siguiente" click
sleep 1.5
echo "--- textos del paso 3:"
$AB eval "
const card = document.querySelector('[data-slot=card]');
(card?.innerText || '').slice(0, 700)"
$AB screenshot scripts/shots/step3-categoria.png
