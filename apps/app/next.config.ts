import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        optimizePackageImports: [
            "lucide-react",
            "react-icons",
            "@mui/material",
            "@mui/x-charts",
            "@mui/x-date-pickers",
            "@radix-ui/react-accordion",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-dialog",
            "@radix-ui/react-hover-card",
            "@radix-ui/react-label",
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "recharts",
            "date-fns",
            "dayjs",
        ],
    },
};

export default nextConfig;
