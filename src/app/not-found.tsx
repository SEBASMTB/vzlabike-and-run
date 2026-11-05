import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-4">
        <div className="text-8xl font-bold gradient-primary bg-clip-text text-transparent mb-4">
          404
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Página no encontrada
        </h1>
        <p className="text-muted-foreground mb-8">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 gradient-primary text-white border-0 px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
