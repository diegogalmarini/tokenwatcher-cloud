// dashboard/tokenwatcher-app/src/app/page.tsx (NUEVA HOME PAGE)
"use client";

import Link from 'next/link';
import Button from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar'; // <-- AÑADIDO Navbar
import Footer from '@/components/layout/Footer'; // <-- AÑADIDO Footer

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar /> {/* <-- Navbar aquí */}

      <main className="flex-grow"> {/* Contenedor principal para el contenido de la página */}
        {/* Sección Hero */}
        <section className="text-center py-20 md:py-32 mt-16"> {/* mt-16 para dejar espacio al Navbar fijo */}
          <div className="container mx-auto max-w-3xl px-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 dark:text-gray-100">
              Real-Time ERC-20 Event Monitoring, Simplified.
            </h1>
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-10">
              Gain immediate on-chain visibility. Receive instant, configurable alerts
              for significant ERC-20 token transfers on Ethereum, Polygon, and Arbitrum—no
              complex infrastructure required.
            </p>
            <Link href="/register" legacyBehavior>
              <Button
                intent="default"
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                Get Started for Free
              </Button>
            </Link>
          </div>
        </section>

        <section className="py-16 w-full">
          <div className="container mx-auto max-w-4xl text-center px-4">
            <div className="bg-gray-200 dark:bg-gray-700 h-64 md:h-96 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">
                [Placeholder for Product Visual / Short Demo Video]
              </p>
            </div>
          </div>
        </section>

        {/* Aquí irían las otras secciones: Características, Cómo Funciona, etc. */}
        {/* <FeaturesSection /> */}
        {/* <HowItWorksSection /> */}
        {/* <CallToActionSection /> */}
      </main>

      <Footer /> {/* <-- Footer aquí */}
    </div>
  );
}