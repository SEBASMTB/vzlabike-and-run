/**
 * Datos de Venezuela — Estados y Clubes/Teams deportivos
 * Usado en el formulario de inscripción
 */

// ============================================================
// Estados de Venezuela (24 estados + Distrito Capital)
// ============================================================

export interface EstadoVE {
  nombre: string;
  capital: string;
  iso: string;
}

export const ESTADOS_VENEZUELA: EstadoVE[] = [
  { nombre: "Distrito Capital", capital: "Caracas", iso: "VE-A" },
  { nombre: "Amazonas", capital: "Puerto Ayacucho", iso: "VE-Z" },
  { nombre: "Anzoátegui", capital: "Barcelona", iso: "VE-B" },
  { nombre: "Apure", capital: "San Fernando de Apure", iso: "VE-C" },
  { nombre: "Aragua", capital: "Maracay", iso: "VE-D" },
  { nombre: "Barinas", capital: "Barinas", iso: "VE-E" },
  { nombre: "Bolívar", capital: "Ciudad Bolívar", iso: "VE-F" },
  { nombre: "Carabobo", capital: "Valencia", iso: "VE-G" },
  { nombre: "Cojedes", capital: "San Carlos", iso: "VE-H" },
  { nombre: "Delta Amacuro", capital: "Tucupita", iso: "VE-I" },
  { nombre: "Falcón", capital: "Coro", iso: "VE-J" },
  { nombre: "Guárico", capital: "San Juan de los Morros", iso: "VE-K" },
  { nombre: "Lara", capital: "Barquisimeto", iso: "VE-L" },
  { nombre: "Mérida", capital: "Mérida", iso: "VE-M" },
  { nombre: "Miranda", capital: "Los Teques", iso: "VE-N" },
  { nombre: "Monagas", capital: "Maturín", iso: "VE-O" },
  { nombre: "Nueva Esparta", capital: "La Asunción", iso: "VE-P" },
  { nombre: "Portuguesa", capital: "Guanare", iso: "VE-R" },
  { nombre: "Sucre", capital: "Cumaná", iso: "VE-S" },
  { nombre: "Táchira", capital: "San Cristóbal", iso: "VE-T" },
  { nombre: "Trujillo", capital: "Trujillo", iso: "VE-U" },
  { nombre: "Vargas (La Guaira)", capital: "La Guaira", iso: "VE-X" },
  { nombre: "Yaracuy", capital: "San Felipe", iso: "VE-Y" },
  { nombre: "Zulia", capital: "Maracaibo", iso: "VE-V" },
];

// ============================================================
// Parentescos para contacto de emergencia
// ============================================================

export const PARENTESCOS = [
  "Esposo/a",
  "Esposa/o",
  "Padre",
  "Madre",
  "Hijo/a",
  "Hermano/a",
  "Tío/a",
  "Primo/a",
  "Familiar",
  "Amigo/a",
  "Sobrino/a",
  "Abuelo/a",
  "Otro",
] as const;

// ============================================================
// Clubes y Teams deportivos de Venezuela
// ============================================================

export interface ClubDeportivo {
  nombre: string;
  tipo: "ciclismo" | "atletismo" | "multi";
  estado?: string;
}

export const CLUBES_VENEZUELA: ClubDeportivo[] = [
  // === Ciclismo ===
  { nombre: "Club Ciclista Caracas", tipo: "ciclismo", estado: "Distrito Capital" },
  { nombre: "Pedalea Venezuela", tipo: "ciclismo", estado: "Miranda" },
  { nombre: "Club MTB Mérida", tipo: "ciclismo", estado: "Mérida" },
  { nombre: "Cicloactivos Maracay", tipo: "ciclismo", estado: "Aragua" },
  { nombre: "Bicimaracaibo", tipo: "ciclismo", estado: "Zulia" },
  { nombre: "Club Ciclista Valencia", tipo: "ciclismo", estado: "Carabobo" },
  { nombre: "Rueda Libre Táchira", tipo: "ciclismo", estado: "Táchira" },
  { nombre: "Mountain Bike Lara", tipo: "ciclismo", estado: "Lara" },
  { nombre: "Ciclistas de Anzoátegui", tipo: "ciclismo", estado: "Anzoátegui" },
  { nombre: "Pedalea Bolívar", tipo: "ciclismo", estado: "Bolívar" },
  { nombre: "Club Ciclista Portuguesa", tipo: "ciclismo", estado: "Portuguesa" },
  { nombre: "BiciGuaira", tipo: "ciclismo", estado: "Vargas (La Guaira)" },
  { nombre: "CicloFalcón", tipo: "ciclismo", estado: "Falcón" },
  { nombre: "Mountain Riders Sucre", tipo: "ciclismo", estado: "Sucre" },
  { nombre: "BiciTrujillo", tipo: "ciclismo", estado: "Trujillo" },
  { nombre: "Rueda Yaracuy", tipo: "ciclismo", estado: "Yaracuy" },
  { nombre: "CicloNueva Esparta", tipo: "ciclismo", estado: "Nueva Esparta" },
  { nombre: "BiciBarinas", tipo: "ciclismo", estado: "Barinas" },
  { nombre: "Pedalea Cojedes", tipo: "ciclismo", estado: "Cojedes" },
  { nombre: "Club Ciclista Guárico", tipo: "ciclismo", estado: "Guárico" },
  { nombre: "BiciMonagas", tipo: "ciclismo", estado: "Monagas" },
  { nombre: "Rueda Delta", tipo: "ciclismo", estado: "Delta Amacuro" },
  { nombre: "Pedalea Amazonas", tipo: "ciclismo", estado: "Amazonas" },
  { nombre: "CicloApure", tipo: "ciclismo", estado: "Apure" },
  { nombre: "BiciMiranda", tipo: "ciclismo", estado: "Miranda" },

  // === Atletismo / Carreras ===
  { nombre: "Club de Corredores Caracas", tipo: "atletismo", estado: "Distrito Capital" },
  { nombre: "Runners Venezuela", tipo: "atletismo" },
  { nombre: "Maracay Runners", tipo: "atletismo", estado: "Aragua" },
  { nombre: "Valencia Running Club", tipo: "atletismo", estado: "Carabobo" },
  { nombre: "Maracaibo Runners", tipo: "atletismo", estado: "Zulia" },
  { nombre: "Mérida Trail Runners", tipo: "atletismo", estado: "Mérida" },
  { nombre: "Barquisimeto Corre", tipo: "atletismo", estado: "Lara" },
  { nombre: "Corredores del Táchira", tipo: "atletismo", estado: "Táchira" },
  { nombre: "Anzoátegui Runners", tipo: "atletismo", estado: "Anzoátegui" },
  { nombre: "Runners Bolívar", tipo: "atletismo", estado: "Bolívar" },
  { nombre: "Corredores Miranda", tipo: "atletismo", estado: "Miranda" },
  { nombre: "Sucre Running", tipo: "atletismo", estado: "Sucre" },
  { nombre: "Portuguesa Corre", tipo: "atletismo", estado: "Portuguesa" },
  { nombre: "Falcón Runners", tipo: "atletismo", estado: "Falcón" },
  { nombre: "Yaracuy Running", tipo: "atletismo", estado: "Yaracuy" },

  // === Multi-deporte ===
  { nombre: "VzlaBike and Run Team", tipo: "multi" },
  { nombre: "Team Venezuela Triatlón", tipo: "multi" },
  { nombre: "Deportistas Activos VE", tipo: "multi" },
  { nombre: "Federación Venezolana de Ciclismo", tipo: "ciclismo" },
  { nombre: "Federación Venezolana de Atletismo", tipo: "atletismo" },
];

// Opciones especiales del selector
export const CLUB_OPCIONES_ESPECIALES = [
  "Otro club (especificar)",
  "No encuentro mi club",
  "Sin club / Independiente",
] as const;

// ============================================================
// Tallas de franela
// ============================================================

export const TALLAS_FRANELA = [
  { value: "XS", label: "XS — Extra Small" },
  { value: "S", label: "S — Small" },
  { value: "M", label: "M — Medium" },
  { value: "L", label: "L — Large" },
  { value: "XL", label: "XL — Extra Large" },
  { value: "XXL", label: "XXL — Double Extra Large" },
] as const;

// ============================================================
// Métodos de pago
// ============================================================

export interface MetodoPago {
  id: string;
  label: string;
  descripcion: string;
  moneda: "USD" | "Bs" | "ambos";
  requiereReferencia: boolean;
  requiereComprobante: boolean;
}

export const METODOS_PAGO: MetodoPago[] = [
  {
    id: "transferencia",
    label: "Transferencia Bancaria Nacional (Bs)",
    descripcion: "Transferencia en Bolívares a cuenta bancaria venezolana",
    moneda: "Bs",
    requiereReferencia: true,
    requiereComprobante: true,
  },
  {
    id: "movil",
    label: "Pago Móvil (Bs)",
    descripcion: "Pago móvil en Bolívares",
    moneda: "Bs",
    requiereReferencia: true,
    requiereComprobante: false,
  },
  {
    id: "divisas",
    label: "Depósito en Divisas (USD)",
    descripcion: "Depósito en dólares en cuenta extranjera",
    moneda: "USD",
    requiereReferencia: true,
    requiereComprobante: true,
  },
  {
    id: "zelle",
    label: "Zelle (USD)",
    descripcion: "Transferencia vía Zelle en dólares",
    moneda: "USD",
    requiereReferencia: true,
    requiereComprobante: false,
  },
];
