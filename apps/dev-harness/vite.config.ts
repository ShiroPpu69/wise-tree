import {defineConfig} from 'vite';import {resolve} from 'node:path';
export default defineConfig({root:import.meta.dirname,publicDir:false,server:{host:'127.0.0.1',port:5182,strictPort:true,fs:{allow:[resolve(import.meta.dirname,'../..')]}},build:{outDir:'../../private/dev-harness-dist',emptyOutDir:false}});
