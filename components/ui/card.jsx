import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * @param {Object} props
 * @param {string} [props.className]
 */
function Card({ className, ...props }) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

/**
 * @param {Object} props
 * @param {string} [props.className]
 */
function CardHeader({ className, ...props }) {
  return (
    <div
      data-slot="card-header"
      style={{border:"none"}}
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start  has-[data-slot=card-action]:grid-cols-[1fr_auto]",
        className
      )}
      {...props}
    />
  )
}

/**
 * @param {Object} props
 * @param {string} [props.className]
 */
function CardTitle({ className, ...props }) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

/**
 * @param {Object} props
 * @param {string} [props.className]
 */
function CardDescription({ className, ...props }) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

/**
 * @param {Object} props
 * @param {string} [props.className]
 */
function CardAction({ className, ...props }) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

/**
 * @param {Object} props
 * @param {string} [props.className]
 */
function CardContent({ className, ...props }) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-3", className)}
      {...props}
    />
  )
}

/**
 * @param {Object} props
 * @param {string} [props.className]
 */
function CardFooter({ className, ...props }) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}

