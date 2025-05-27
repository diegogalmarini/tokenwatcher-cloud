// src/components/ui/button.tsx
"use client"

import * as React from "react"
import { cva, VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils" // Asumimos que tienes cn para tailwind-merge

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed", // Añadido disabled styles
  {
    variants: {
      intent: {
        default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
        destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
        // --- NUEVO INTENT AÑADIDO ---
        secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-600",
      },
      size: {
        sm: "px-2.5 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
      },
    },
    defaultVariants: {
      intent: "default",
      size: "md",
    },
  }
)

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ intent, size, className, ...props }, ref) => (
    <button
      // Usamos cn aquí para asegurar que className pueda sobreescribir correctamente si es necesario
      className={cn(buttonVariants({ intent, size, className }))}
      ref={ref}
      {...props}
    />
  )
)
Button.displayName = "Button"

export default Button