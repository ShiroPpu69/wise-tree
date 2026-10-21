import {rolldown} from 'rolldown';
const bundle=await rolldown({input:'apps/desktop/online-voice-source.cts',platform:'node',external:['bufferutil','utf-8-validate']});
await bundle.write({file:'apps/desktop/online-voice.cjs',format:'cjs',codeSplitting:false});await bundle.close();
console.log('Bundled online voice client; no speech models included.');
