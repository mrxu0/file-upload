import typescript from 'rollup-plugin-typescript2'
export default {
    input: 'lib/FileUpload.ts',
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