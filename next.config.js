/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config) => {
        // Allow importing audio worklet files
        config.module.rules.push({
            test: /\.worklet\.js$/,
            type: 'asset/resource',
        });
        return config;
    },
};

module.exports = nextConfig;
