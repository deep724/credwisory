/* Generate consistent, high-resolution display assets from local official artwork. */
const sharp = require('sharp');
const fs = require('node:fs/promises');
const path = require('node:path');
const sources = {
  'union-bank-of-india': 'union-bank-india.png', 'axis-bank': 'axis-bank-mark.svg',
  'icici-bank': 'icici-bank.svg', 'idfc-bank': 'idfc-first-bank.svg',
  'punjab-national-bank': 'punjab-national-bank.png', 'bank-of-baroda': 'bank-of-baroda.png',
  'state-bank-of-india': 'state-bank-of-india.svg', credila: 'credila.svg', avanse: 'avanse.svg',
  incred: 'incred.svg', auxilo: 'auxilo.svg', edgro: 'edgro.png', poonawalla: 'poonawalla.svg',
  'j-p-morgan': 'jp-morgan.svg'
};
async function main() {
  const root = path.join(__dirname, '../public/lender-logos');
  await fs.mkdir(path.join(root, 'normalized'), { recursive: true });
  const tiles = [];
  for (const [id, source] of Object.entries(sources)) {
    const input = await sharp(path.join(root, source), { density: 300 }).flatten({ background: '#fff' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width, height, channels } = input.info;
    let left=width, top=height, right=-1, bottom=-1;
    for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
      const p=(y*width+x)*channels;
      if(Math.min(input.data[p],input.data[p+1],input.data[p+2])<220) { left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y); }
    }
    if(right<left) throw new Error('Blank artwork: '+source);
    // Retain a small safety margin around antialiased edges; never crop the mark.
    left=Math.max(0,left-2);top=Math.max(0,top-2);right=Math.min(width-1,right+2);bottom=Math.min(height-1,bottom+2);
    const trimmed=await sharp(input.data,{raw:input.info}).extract({left,top,width:right-left+1,height:bottom-top+1}).png().toBuffer();
    const artwork=await sharp(trimmed).resize(328,312,{fit:'inside'}).png().toBuffer();
    const meta=await sharp(artwork).metadata();
    const output=await sharp({create:{width:400,height:400,channels:4,background:'#fff'}}).composite([{input:artwork,left:Math.round((400-meta.width)/2),top:Math.round((400-meta.height)/2)}]).png().toBuffer();
    await fs.writeFile(path.join(root,'normalized',id+'.png'),output);
    tiles.push({input:await sharp(output).resize(120,120).png().toBuffer(),left:(tiles.length%4)*140,top:Math.floor(tiles.length/4)*140});
    console.log(id+': '+width+'x'+height+' → artwork '+(right-left+1)+'x'+(bottom-top+1));
  }
  await sharp({create:{width:560,height:560,channels:4,background:'#dce5ee'}}).composite(tiles).png().toFile(path.join(root,'normalized/audit.png'));
}
main().catch(error=>{console.error(error);process.exitCode=1});
