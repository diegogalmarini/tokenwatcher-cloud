// CAMBIO: Versión revisada y mejorada
// src/components/layout/DocsNav.tsx
"use client";

import React from "react";

// ------------------------------------------
// Tipos
// ------------------------------------------
interface Section {
  id: string;
  title: string;
  level: number; // 1 = capítulo principal, 2+ = subsecciones
}

interface DocsNavProps {
  sections: Section[];
  activeSection: string;
}

// ------------------------------------------
// Utilidades
// ------------------------------------------
/**
 * Devuelve la clase de indentación adecuada según el nivel de la sección.
 *  pl‑2  -> Capítulos (nivel 1)
 *  pl‑6  -> Subcapítulos (nivel 2)
 *  pl‑10 -> Sub‑subcapítulos (nivel 3)
 *  pl‑14 -> ≤ nivel 4  (máximo)
 */
function indentClass(level: number): string {
  const map = ["pl-2", "pl-6", "pl-10", "pl-14"];
  return map[Math.min(level - 1, map.length - 1)];
}

// ------------------------------------------
// Componente DocsNav
// ------------------------------------------
export default function DocsNav({ sections, activeSection }: DocsNavProps) {
  return (
    <nav
      aria-label="Table of contents" // Accesibilidad
      className="sticky top-24 w-full"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        On this page
      </h3>

      <ul className="space-y-2">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={activeSection === section.id ? "location" : undefined}
              className={[
                "block transition-colors duration-200 text-sm font-medium border-l-2",
                indentClass(section.level),
                activeSection === section.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white",
              ].join(" ")}
            >
              {section.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
