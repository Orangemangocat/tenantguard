/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  compilerOptions: {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
  },
};

export default nextConfig;
