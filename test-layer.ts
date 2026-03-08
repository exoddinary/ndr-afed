const keywords = ['near', 'within', 'around', 'close to']
const q = 'find wells near the k06-t field within 30 km'.toLowerCase()

const pivotIdx = Math.max(
    q.indexOf('near'),
    q.indexOf('within'),
    q.indexOf('around'),
    q.indexOf('close to')
)

function detectLayerFromQuery(query: string, fallback: string = 'fields'): string {
    const qStr = query.toLowerCase()
    if (qStr.includes('well') || qStr.includes('borehole')) return 'wells'
    if (qStr.includes('field')) return 'fields'
    if (qStr.includes('block')) return 'blocks'
    return fallback
}
console.log('pivotIdx:', pivotIdx)
console.log('q0 to pivot:', q.substring(0, pivotIdx))
console.log('q pivot to end:', q.substring(pivotIdx))
console.log('targetLayer:', detectLayerFromQuery(q.substring(0, pivotIdx), 'wells'))
console.log('originLayer:', detectLayerFromQuery(q.substring(pivotIdx), 'fields'))
