import type { SVGProps } from "react";

export function AppLogo(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path
                d="M12 2L2 19H22L12 2ZM12 6L18.5 17H5.5L12 6Z"
                className="fill-current"
            />
        </svg>
    );
}
