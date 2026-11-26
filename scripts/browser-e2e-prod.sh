#!/bin/bash
# Verificación visual en PRODUCCIÓN: banner prefill + categoría bloqueada
set -e
cd /home/z/my-project
AB="agent-browser"
$AB close >/dev/null 2>&1 || true
$AB set viewport 1280 900
$AB open "https://vzlabike-and-run.vercel.app/eventos/la-ruta-de-la-campana-admirable/inscribirse"
$AB wait --load networkidle || true
sleep 4

# Escribir la cédula de NATHALIE (ya inscrita en este evento pero el prefill es solo UI)
$AB eval "(() => {
const el = document.getElementById('cedula');
const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
setter.call(el,'9479255');
el.dispatchEvent(new Event('input',{bubbles:true}));
return 'ok';
})()"
sleep 3
echo "--- banner:"
$AB get text ".bg-emerald-50" || echo "(sin banner)"
$AB eval "(() => {
const el = document.getElementById('fechaNacimiento');
const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
setter.call(el,'31/08/1969'.length ? '1969-08-31' : '');
el.dispatchEvent(new Event('input',{bubbles:true}));
return 'dob ok';
})()"
# género F (NATHALIE viene precargada; asegurar)
sleep 1
$AB eval "(() => {
const btns = Array.from(document.querySelectorAll('[role=combobox]'));
const gen = btns.find(b => b.closest('div')?.querySelector('label')?.textContent?.includes('Género'));
(gen || btns[0]).click();
return 'open';
})()"
sleep 1
$AB eval "(() => {
const opts = Array.from(document.querySelectorAll('[role=option]'));
const f = opts.find(o => o.textContent.trim() === 'Femenino');
if (f) f.click();
return 'F ok';
})()"
sleep 1.5
$AB screenshot scripts/shots/prod-step1.png
$AB eval "(() => {
const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Siguiente'));
btn?.click(); return 'next';
})()"
sleep 1
$AB eval "(() => {
const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Siguiente'));
btn?.click(); return 'next2';
})()"
sleep 2
echo "--- paso 3:"
$AB eval "(() => {
const card = document.querySelector('[data-slot=card]');
return (card?.innerText || '').slice(0, 500);
})()"
$AB screenshot scripts/shots/prod-step3.png
$AB close
