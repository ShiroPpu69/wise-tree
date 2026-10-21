import {createRoot} from 'react-dom/client';
import {App} from './App.tsx';
createRoot(document.getElementById('root')!).render(<App/>);
if(import.meta.env.PROD&&!window.wisdomDesktop&&'serviceWorker' in navigator)void navigator.serviceWorker.register(import.meta.env.BASE_URL+'sw.js').catch(()=>{/* Storage/caching may be disabled. The game still runs in the loaded page. */});
