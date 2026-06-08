import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        // Barrel packages whose deep modules should be resolved individually so
        // a single named import does not pull the whole library into the route
        // graph (a major Turbopack cold-compile cost on heavy pages).
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
            "@radix-ui/react-slider",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "@radix-ui/react-tabs",
            "@reduxjs/toolkit",
            "react-redux",
            "date-fns",
            "dayjs",
        ],
    },
};

export default nextConfig;
