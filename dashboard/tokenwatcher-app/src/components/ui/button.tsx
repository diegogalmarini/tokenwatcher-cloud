// src/components/ui/button.tsx
"use client"

import * as React from "react"
import { cva, VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
  {
    variants: {
      intent: {
        default: "bg-blue-600 text-white border-transparent hover:bg-blue-700 focus:ring-blue-500",
        destructive: "bg-red-600 text-white border-transparent hover:bg-red-700 focus:ring-red-500",
        // --- ESTILOS MEJORADOS PARA 'SECONDARY' ---
        secondary: "bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-700 hover:text-white hover:border-transparent focus:ring-gray-500 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-200 dark:hover:text-gray-800 dark:hover:border-transparent",
      },
      size: {
        sm: "px-2.5 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base border-2", // Añadido border-2 para un grosor consistente
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
      className={cn(buttonVariants({ intent, size, className }))}
      ref={ref}
      {...props}
    />
  )
)
Button.displayName = "Button"

export default Button