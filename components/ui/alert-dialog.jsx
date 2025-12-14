// -*- coding: utf-8 -*-
/**
 * AlertDialog 组件
 * 
 * 基于 Radix UI AlertDialog 的封装，用于需要用户确认的破坏性操作
 * 与普通 Dialog 不同，AlertDialog 不能通过点击外部区域关闭
 */
"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

/**
 * AlertDialog 根组件
 */
function AlertDialog({ ...props }) {
  return <AlertDialogPrimitive.Root {...props} />
}

/**
 * AlertDialog 触发器
 */
function AlertDialogTrigger({ ...props }) {
  return <AlertDialogPrimitive.Trigger {...props} />
}

/**
 * AlertDialog Portal
 */
function AlertDialogPortal({ ...props }) {
  return <AlertDialogPrimitive.Portal {...props} />
}

/**
 * AlertDialog 遮罩层
 * @param {Object} props
 * @param {string} [props.className]
 */
function AlertDialogOverlay({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

/**
 * AlertDialog 内容区域
 * @param {Object} props
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
function AlertDialogContent({ className, children, ...props }) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className
        )}
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPortal>
  )
}

/**
 * AlertDialog 头部区域
 * @param {Object} props
 * @param {string} [props.className]
 */
function AlertDialogHeader({ className, ...props }) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-2 text-center sm:text-left",
        className
      )}
      {...props}
    />
  )
}

/**
 * AlertDialog 底部按钮区域
 * @param {Object} props
 * @param {string} [props.className]
 */
function AlertDialogFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )}
      {...props}
    />
  )
}

/**
 * AlertDialog 标题
 * @param {Object} props
 * @param {string} [props.className]
 */
function AlertDialogTitle({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Title
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  )
}

/**
 * AlertDialog 描述文本
 * @param {Object} props
 * @param {string} [props.className]
 */
function AlertDialogDescription({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Description
      className={cn("text-sm text-slate-500", className)}
      {...props}
    />
  )
}

/**
 * AlertDialog 确认操作按钮
 * @param {Object} props
 * @param {string} [props.className]
 */
function AlertDialogAction({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(
        buttonVariants(),
        "mt-2 sm:mt-0",
        className
      )}
      {...props}
    />
  )
}

/**
 * AlertDialog 取消按钮
 * @param {Object} props
 * @param {string} [props.className]
 */
function AlertDialogCancel({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(
        buttonVariants({ variant: "outline" }),
        "mt-2 sm:mt-0",
        className
      )}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
