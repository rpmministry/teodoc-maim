import { readFileSync } from 'node:fs';

function leerEnv(ruta: string): Record<string, string> {
  const env: Record<string, string> = {};
  try {
    for (const linea of readFileSync(ruta, 'utf8').split(/\r?\n/)) {
      const coincidencia = linea.match(/^([A-Z0-9_]+)=(.*)$/);
      if (coincidencia) env[coincidencia[1]] = coincidencia[2].trim().replace(/^['"]|['"]$/g, '');
    }
  } catch {}
  return env;
}

const env = { ...leerEnv('.env.local'), ...process.env };
const apiKey = env.BIBLE_API_KEY?.trim();
if (!apiKey) {
  console.log('Falta BIBLE_API_KEY.');
  console.log('Consigue una clave en https://scripture.api.bible/ y agrégala a .env.local.');
  process.exit(1);
}
const base = (env.BIBLE_API_BASE || 'https://api.scripture.api.bible/v1').replace(/\/$/, '');
const respuesta = await fetch(`${base}/bibles?language=spa&include-full-details=true`, {
  headers: { 'api-key': apiKey },
});
if (!respuesta.ok) {
  console.log(`API.Bible respondió HTTP ${respuesta.status}. Revisa la clave y sus permisos.`);
  process.exit(1);
}
const datos = await respuesta.json() as { data?: Array<{ id?: string; name?: string; abbreviation?: string; copyright?: string; description?: string }> };
const biblias = datos.data || [];
const rvc = biblias.filter((biblia) => /reina.{0,40}contempor|rvc/i.test(`${biblia.name} ${biblia.abbreviation} ${biblia.description}`));
if (rvc.length) {
  console.log('Candidatas de Reina Valera Contemporánea:');
  for (const biblia of rvc) console.log(`- ${biblia.name} | id=${biblia.id} | abbr=${biblia.abbreviation}`);
} else {
  console.log('No apareció RVC en las biblias españolas disponibles para esta clave.');
  console.log('Revisa si tu cuenta tiene licencia para RVC. Biblias españolas disponibles:');
  for (const biblia of biblias.slice(0, 30)) console.log(`- ${biblia.name} | id=${biblia.id} | abbr=${biblia.abbreviation}`);
}
