export type SpinnerProps = {
    color?: string
    width?: string | number
    height?: string | number
    viewBox?: string
}

function toCssSize(value: string | number): string {
    if (typeof value === "number") {
        return `${value * 0.25}rem`;
    }

    return value;
}

export const Spinner = ({
    color = 'text-indigo-600',
    height = 8,
    width = 8,
    viewBox = "0 0 24 24"
}: SpinnerProps) => {
    return (
        <svg
            className={`animate-spin ${color}`}
            style={{
                width: toCssSize(width),
                height: toCssSize(height),
            }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox={viewBox}
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
            />
        </svg>
    )
}