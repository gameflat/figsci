import React from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * @typedef {Object} ButtonWithTooltipProps
 * @property {string} tooltipContent
 * @property {React.ReactNode} children
 * @property {boolean} [asChild]
 * @property {string} [className]
 * @property {string} [variant]
 * @property {string} [size]
 * @extends {React.ComponentProps<"button">}
 */

/**
 * @param {ButtonWithTooltipProps} props
 */
export function ButtonWithTooltip({
    tooltipContent,
    children,
    ...buttonProps
}) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button {...buttonProps}>{children}</Button>
                </TooltipTrigger>
                <TooltipContent>{tooltipContent}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

