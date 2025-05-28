// dashboard/tokenwatcher-app/src/components/layout/Footer.tsx
"use client";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="w-full bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          &copy; {currentYear} TokenWatcher. All rights reserved.
        </p>
        {/* Futuro: Enlaces a Política de Privacidad, Términos de Servicio */}
        {/* <div className="mt-2 space-x-4">
          <a href="/privacy" className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Privacy Policy</a>
          <a href="/terms" className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Terms of Service</a>
        </div> */}
      </div>
    </footer>
  );
}