import typescript from 'rollup-plugin-typescript2'
export default {
    input: 'lib/FileUpload.ts',
    // input: 'lib/index.ts',
    output: {
        file: './examples/client/index.js',
        format: 'umd',
        sourcemap: true,
        name: 'FileUpload'
    },
    plugins: [
        typescript({
            tsconfig: './tsconfig.dev.json',
            removeComments: true,
            useTsconfigDeclarationDir: true,
        }),
    ]
};