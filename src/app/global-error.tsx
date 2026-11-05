"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg
                className="size-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error de la aplicación
            </h2>
            <p className="text-gray-600 mb-6">
              Ocurrió un error crítico. Por favor, recarga la página.
            </p>
            <button
              onClick={() => reset()}
              className="bg-red-500 text-white border-0 px-6 py-3 rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              Recargar página
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
