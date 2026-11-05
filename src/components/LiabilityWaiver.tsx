"use client";

import { useState, useMemo } from "react";
import { FileText, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

interface LiabilityWaiverProps {
  eventTitle: string;
  eventDate: string;
  organizer: string;
  onAccept: (accepted: boolean) => void;
  accepted: boolean;
}

function generateWaiverText(eventTitle: string, eventDate: string, organizer: string): string {
  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString("es-VE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).toUpperCase()
    : "FECHA POR DEFINIR";

  const title = eventTitle.toUpperCase() || "EVENTO DEPORTIVO";
  const org = organizer.toUpperCase() || "VZLABIKE AND RUN®";

  return `DECLARACIÓN DE LIBERACIÓN DE RESPONSABILIDAD

Declaro de manera libre, espontánea y voluntaria que:

1. He decidido participar en la "${title} EL ${formattedDate}", organizada por ${org} (en adelante, "los Organizadores").

2. La inscripción a la Carrera únicamente me da el derecho de participar en la misma.

3. Estoy en perfectas condiciones físicas, mentales, de salud y que no padezco ninguna enfermedad, lesión y/o incapacidad y/o condición que me inhabilite para participar en la Carrera ni que haga aconsejable no participar en la misma.

4. Estoy adecuadamente informado(a) de que debo estar entrenado(a) para participar en la misma y realizar un esfuerzo físico.

5. Estoy enterado de las recomendaciones deportivas y médicas que debo adoptar para participar apropiadamente en la Carrera, teniendo en cuenta mi condición física y circunstancias personales.

6. Conozco, asumo y acepto todos los riesgos asociados con mi participación en la Carrera incluyendo, pero no limitados a caídas y accidentes, enfermedades e incluso lesiones o fallecimiento, generadas entre otras razones, por mis antecedentes médicos o clínicos, y en general todo el riesgo que declaro conocido y valorado por mí, en razón a que la actividad durante el desarrollo de la Carrera se encontrará bajo mi control y ejecución exclusiva como participante. Como consecuencia de lo anterior, en mi nombre y en el de cualquier persona que actúe en mi representación, libero a los Organizadores de la Carrera, patrocinadores y/o representantes y sucesores, de todo reclamo o responsabilidad de cualquier tipo que surja como consecuencia de mi participación en este evento. Así mismo exonero de responsabilidad a los Organizadores, patrocinadores y/o sus representantes.

7. Igualmente declaro que conozco y he leído el presente reglamento de la Carrera, el cual también está publicado en cualquiera de los lugares de inscripción (virtual) en el siguiente sitio web: www.vzlabikeandrun.com y declaro que entiendo que sin excepción alguna está prohibido por parte de los inscritos a la carrera, la realización de actividades publicitarias, promocionales y de marcas diferentes a las organizadas por los patrocinadores oficiales del evento y autorizadas por la Organización de la Carrera.

"${title} EL ${formattedDate}", organizada por ${org} (en adelante, "la Carrera") es un evento privado y por tal razón se reserva el derecho de admisión y permanencia de las personas que no cumplan con esta condición.

Autorizo a los Organizadores y patrocinadores de "${title} EL ${formattedDate}", organizada por ${org} (en adelante, "la Carrera") para usar fotografías, películas, videos, grabaciones y cualquier otro medio por el cual se haya registrado la Carrera en los que se encuentre mi imagen, para cualquier uso legítimo de los mismos que esté relacionado con la Carrera (incluyendo usos publicitarios, sin compensación u obligación económica alguna), sin que haya lugar a ningún pago por este concepto.`;
}

export function LiabilityWaiver({
  eventTitle,
  eventDate,
  organizer,
  onAccept,
  accepted,
}: LiabilityWaiverProps) {
  const [expanded, setExpanded] = useState(false);

  const waiverText = useMemo(
    () => generateWaiverText(eventTitle, eventDate, organizer),
    [eventTitle, eventDate, organizer]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="size-5 text-red-500" />
        <h4 className="font-semibold text-sm text-foreground">
          Declaración de Liberación de Responsabilidad
        </h4>
      </div>

      <div className="border border-gray-300 rounded-lg overflow-hidden">
        {/* Collapsible waiver text */}
        <div
          className={`transition-all duration-300 ${
            expanded ? "max-h-[400px]" : "max-h-[120px]"
          } overflow-y-auto`}
        >
          <div className="p-4 bg-gray-50 text-xs leading-relaxed text-gray-700 whitespace-pre-line">
            {waiverText}
          </div>
        </div>

        {/* Expand/collapse toggle */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 px-4 py-2 bg-gray-100 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors border-t"
        >
          {expanded ? (
            <>
              <ChevronUp className="size-3" />
              Reducir texto
            </>
          ) : (
            <>
              <ChevronDown className="size-3" />
              Leer declaración completa
            </>
          )}
        </button>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          Debes leer y aceptar esta declaración antes de inscribirte. Al aceptar,
          reconoces los riesgos asociados con tu participación en el evento.
        </p>
      </div>

      {/* Accept checkbox */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => onAccept(e.target.checked)}
          className="mt-1 size-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
        />
        <span className="text-sm text-foreground group-hover:text-red-600 transition-colors">
          He leído, entiendo y acepto la{" "}
          <strong>Declaración de Liberación de Responsabilidad</strong> del
          evento <strong>{eventTitle}</strong>. Asumo toda responsabilidad sobre
          mi participación.
        </span>
      </label>
    </div>
  );
}

export { generateWaiverText };
