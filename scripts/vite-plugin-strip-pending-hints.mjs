// En el build, las pistas internas de los marcadores `pending('P-<n>', 'pista', 'etiqueta')` no viajan en el JS público:
// solo quedan el id, el estado y la etiqueta pública. Node (prerender, compuertas, pruebas) sigue viendo las pistas.
const CALL = /(\bpending\(\s*(['"])P-\d+\2\s*,\s*)(['"])((?:\\.|(?!\3)[^\\])*)\3/g

export const stripPendingHints = (code) => code.replace(CALL, (_m, head) => `${head}''`)

export default function stripPendingHintsPlugin() {
  return {
    name: 'strip-pending-hints',
    apply: 'build',
    enforce: 'pre',
    transform(code, id) {
      if (!/src[\\/]content[\\/]site\.js$/.test(id.split('?')[0])) return null
      return { code: stripPendingHints(code), map: null }
    },
  }
}
