import { ButtonHTMLAttributes, DetailedHTMLProps, ReactNode } from "react";

type CustomButtonType = {
    isBlack: boolean;
    children: ReactNode;
} & DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
>;

export function CustomButton({
    isBlack,
    children,
    ...props
}: CustomButtonType) {
    return (
        <button
            {...props}
            aria-disabled={props.disabled}
            className={`flex items-center shrink-0 px-2 md:px-4 py-2 rounded-md h-9 shadow-sm ${
                isBlack
                    ? "button-shadow"
                    : "bg-white border border-zinc-200 md:hover:text-zinc-900 md:hover:bg-zinc-100"
            } rounded-lg ${
                props.disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}>
            <div
                className={`text-sm ${
                    isBlack ? "text-primary" : "text-[#4a4340]"
                }`}>
                {children}
            </div>
        </button>
    );
}
