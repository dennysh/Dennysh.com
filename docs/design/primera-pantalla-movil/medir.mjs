import { chromium } from 'playwright'
const [,, file, out] = process.argv
const b = await chromium.launch()
for (const [w,h] of [[360,640],[390,844],[320,568]]) {
  const p = await b.newPage({ viewport:{width:w,height:h}, deviceScaleFactor:2 })
  await p.goto('file://'+file)
  const r = await p.evaluate(() => {
    const q = (s)=>document.querySelector(s).getBoundingClientRect()
    const vh = innerHeight
    const els = {h1:'#h1', nodes:'.nodes', card:'#card', demoBtn:'#demo', summary:'#sum'}
    const o = {vh, scrollH: document.documentElement.scrollHeight}
    for (const [k,s] of Object.entries(els)) { const r=q(s); o[k]={top:Math.round(r.top),bottom:Math.round(r.bottom)} }
    o.nodeMin = Math.round(Math.min(...[...document.querySelectorAll('.nodes button')].map(b=>Math.min(b.getBoundingClientRect().width,b.getBoundingClientRect().height))))
    o.hScroll = document.documentElement.scrollWidth > innerWidth
    return o
  })
  console.log(w+'x'+h, JSON.stringify(r))
  await p.screenshot({ path: `${out}-${w}x${h}.png` })
}
await b.close()
