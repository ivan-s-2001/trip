from pathlib import Path
import base64, json, mimetypes
root=Path(__file__).resolve().parent.parent
files=[root/f for f in ['index.html','app.js','sync.js','messages.js','attachments.js','content.js','styles.css','sw.js','manifest.webmanifest']]+list((root/'assets').rglob('*'))
assets={'/'+str(p.relative_to(root)):{'body':base64.b64encode(p.read_bytes()).decode(),'type':mimetypes.guess_type(p.name)[0] or 'application/octet-stream'} for p in files if p.is_file()}
handler='const ASSETS='+json.dumps(assets)+';\nfunction serveAsset(path){const a=ASSETS[path==="/"?"/index.html":path];if(!a)return new Response("Not found",{status:404});const bytes=Uint8Array.from(atob(a.body),c=>c.charCodeAt(0));return new Response(bytes,{headers:{"Content-Type":a.type,"Cache-Control":"no-cache","Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff"}})}'
out=root/'dist';out.mkdir(exist_ok=True)
(out/'worker.mjs').write_text((root/'server/worker.mjs').read_text().replace("import defaultPlans from './plans.mjs';",'const defaultPlans='+ (root/'server/plans.mjs').read_text().removeprefix('export default ')).replace('// ASSET_HANDLER',handler))
print(out/'worker.mjs')
