/**
 * GET  /api/auth/me  — Datos de la sesión + ficha del Runner vinculado.
 * PATCH /api/auth/me — Actualiza la ficha (personal, médica, emergencia)
 *                      y vincula un Runner por cédula si aún no hay ninguno.
 *
 * PRIVACIDAD: devuelve EXCLUSIVAMENTE los datos del usuario autenticado.
 * Si no hay sesión responde 401. Nunca expone datos de otros corredores.
 */
import { NextRequest, NextResponse } from "next/server";
import { db, getDb } from "@/lib/db";
import { getSessionUser, normalizeCedula } from "@/lib/user-auth";

// Campos seleccionables de la ficha Runner (son los del propio usuario,
// mostrados en Mi Perfil y reutilizados para auto-completar inscripciones)
const RUNNER_SELECT = {
  id: true,
  cedula: true,
  nombres: true,
  apellidos: true,
  fechaNacimiento: true,
  genero: true,
  email: true,
  telefono: true,
  pais: true,
  estado: true,
  ciudad: true,
  direccion: true,
  team: true,
  tallaFranela: true,
  licenciaFederativa: true,
  grupoSanguineo: true,
  alergiasCondiciones: true,
  contactoEmergenciaNombre: true,
  contactoEmergenciaTelefono: true,
  contactoEmergenciaParentesco: true,
} as const;

export async function GET(request: NextRequest) {
  const session = await getSessionUser(request);
  if (!session) {
    return NextResponse.json({ user: null, runner: null }, { status: 401 });
  }

  const runner = session.runnerId
    ? await db.runner.findUnique({
        where: { id: session.runnerId },
        select: RUNNER_SELECT,
      })
    : null;

  return NextResponse.json({
    user: {
      id: session.id,
      email: session.email,
      nombre: session.nombre,
      role: session.role,
    },
    runner,
    linked: Boolean(runner),
  });
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json(
        { error: "Debes iniciar sesión" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
    }

    // ── Vinculación de Runner por cédula (si la cuenta aún no tiene) ──
    if (typeof body.cedula === "string" && body.cedula.trim() && !session.runnerId) {
      const cedula = normalizeCedula(body.cedula);
      if (cedula.length >= 5) {
        const runner = await db.runner.findUnique({ where: { cedula } });
        if (!runner) {
          return NextResponse.json(
            {
              error:
                "No encontramos esa cédula en nuestro histórico. Verifica el número o completa tu ficha y el organizador podrá vincularla más adelante.",
            },
            { status: 404 }
          );
        }
        const taken = await db.user.findFirst({
          where: { runnerId: runner.id, NOT: { id: session.id } },
        });
        if (taken) {
          return NextResponse.json(
            { error: "Esta cédula ya está vinculada a otra cuenta" },
            { status: 409 }
          );
        }
        await db.user.update({
          where: { id: session.id },
          data: { runnerId: runner.id },
        });
        session.runnerId = runner.id;
      }
    }

    // ── Nombre a mostrar de la cuenta ──
    if (typeof body.nombre === "string" && body.nombre.trim()) {
      await db.user.update({
        where: { id: session.id },
        data: { nombre: body.nombre.trim().slice(0, 120) },
      });
    }

    // ── Actualización de la ficha Runner ──
    const clean = (v: unknown, max = 160) =>
      typeof v === "string" ? v.trim().slice(0, max) : undefined;

    const runnerData: Record<string, string> = {};
    const nombres = clean(body.nombres, 80);
    const apellidos = clean(body.apellidos, 80);
    const telefono = clean(body.telefono, 40);
    const estado = clean(body.estado, 60);
    const ciudad = clean(body.ciudad, 80);
    const direccion = clean(body.direccion, 240);
    const team = clean(body.team, 120);
    const tallaFranela = clean(body.tallaFranela, 8);
    const grupoSanguineo = clean(body.grupoSanguineo, 8);
    const alergiasCondiciones = clean(body.alergiasCondiciones, 400);
    const contactoEmergenciaNombre = clean(body.contactoEmergenciaNombre, 120);
    const contactoEmergenciaTelefono = clean(body.contactoEmergenciaTelefono, 40);
    const contactoEmergenciaParentesco = clean(body.contactoEmergenciaParentesco, 60);
    const genero = clean(body.genero, 1);
    const fechaNacimiento = clean(body.fechaNacimiento, 10);

    if (nombres) runnerData.nombres = nombres;
    if (apellidos) runnerData.apellidos = apellidos;
    if (telefono !== undefined) runnerData.telefono = telefono;
    if (estado !== undefined) runnerData.estado = estado;
    if (ciudad !== undefined) runnerData.ciudad = ciudad;
    if (direccion !== undefined) runnerData.direccion = direccion;
    if (team !== undefined) runnerData.team = team;
    if (tallaFranela !== undefined) runnerData.tallaFranela = tallaFranela;
    if (grupoSanguineo !== undefined) runnerData.grupoSanguineo = grupoSanguineo;
    if (alergiasCondiciones !== undefined)
      runnerData.alergiasCondiciones = alergiasCondiciones;
    if (contactoEmergenciaNombre !== undefined)
      runnerData.contactoEmergenciaNombre = contactoEmergenciaNombre;
    if (contactoEmergenciaTelefono !== undefined)
      runnerData.contactoEmergenciaTelefono = contactoEmergenciaTelefono;
    if (contactoEmergenciaParentesco !== undefined)
      runnerData.contactoEmergenciaParentesco = contactoEmergenciaParentesco;
    if (genero === "M" || genero === "F") runnerData.genero = genero;
    if (fechaNacimiento && /^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)) {
      // Prisma espera un Date real para el campo DateTime; mediodía UTC para
      // evitar corrimientos de zona horaria al guardar.
      (runnerData as Record<string, unknown>).fechaNacimiento = new Date(
        `${fechaNacimiento}T12:00:00.000Z`
      );
    }

    let runner = null;
    if (session.runnerId && Object.keys(runnerData).length > 0) {
      runner = await db.runner.update({
        where: { id: session.runnerId },
        data: runnerData,
        select: RUNNER_SELECT,
      });
    } else if (session.runnerId) {
      runner = await db.runner.findUnique({
        where: { id: session.runnerId },
        select: RUNNER_SELECT,
      });
    }

    const user = await db.user.findUnique({
      where: { id: session.id },
      select: { id: true, email: true, nombre: true, role: true, runnerId: true },
    });

    return NextResponse.json({ ok: true, user, runner, linked: Boolean(runner) });
  } catch (err) {
    console.error("[auth/me PATCH]", err);
    return NextResponse.json(
      { error: "No pudimos guardar los cambios" },
      { status: 500 }
    );
  }
}
