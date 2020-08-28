import typescript from 'rollup-plugin-typescript2'
export default {
    input: 'lib/FileUpload.ts',
    // input: 'lib/index.ts',
    output: {
        file: 'dist/index.js',
        format: 'umd',
        sourcemap: true,
        name: 'FileUpload'
    },
    plugins: [
        typescript({
            tsconfig: 'tsconfig.json',
            removeComments: true,
            useTsconfigDeclarationDir: true,
        }),
    ]
};