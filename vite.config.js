import { defineConfig } from "vite";

export default defineConfig({
    base:"/game-portfolio/",
    build:{
        minify:"terser",
    },
});