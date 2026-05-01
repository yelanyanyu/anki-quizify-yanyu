/* Build: bundles src/*.js into Card Template/_quizify.js */
const esbuild = require('esbuild');

esbuild.buildSync({
    entryPoints: ['src/index.js'],
    bundle: true,
    outfile: 'Card Template/_quizify.js',
    format: 'iife',
    target: 'es5',
    banner: { js: '/* Quizify Nested Reveal — auto-built by esbuild */' },
});
console.log('Built: Card Template/_quizify.js');
