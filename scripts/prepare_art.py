from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np
from scipy import ndimage as ndi
import json
src=sorted(Path('/workspace/iso-examples').rglob('*.png'))
out=Path('/workspace/iso-survivor/public/sprites')
heroes={1:('Aurelia','Crimson Warden','familiar'),28:('Morrigan','Nightweaver','bolt'),30:('Seraphine','Dawn Abbess','aura'),44:('Isolde','Frost Ranger','axe'),80:('Eira','Winter Herald','lightning'),112:('Thorne','Verdant Sentinel','blade')}
enemies=[5,6,27,35,54,55,59,70,74,83,90,91,96,103,110,114]
elites=[7,18,21,39,86,100,102,113]
first=['Briar','Ash','Moss','Flint','Thistle','Sable','Dusk','Hollow','Ivory','Ember','Rune','Wisp','Cinder','Fallow','Silver','Rook','Vale']
last=['Wanderer','Oathkeeper','Spellbinder','Watcher','Reaver','Warden','Seeker']
manifest=[]
for n,f in enumerate(src,1):
 im=Image.open(f).convert('RGB'); a=np.asarray(im).astype(float)
 edge=np.concatenate([a[:8].reshape(-1,3),a[-8:].reshape(-1,3),a[:,:8].reshape(-1,3),a[:,-8:].reshape(-1,3)])
 bg=np.median(edge,axis=0);dist=np.max(np.abs(a-bg),axis=2)
 candidate=dist<32
 seed=np.zeros(candidate.shape,bool);seed[0]=candidate[0];seed[-1]=candidate[-1];seed[:,0]|=candidate[:,0];seed[:,-1]|=candidate[:,-1]
 remove=ndi.binary_propagation(seed,mask=candidate)
 keep=~remove
 labels,cnt=ndi.label(keep);sizes=np.bincount(labels.ravel());largest=np.argmax(sizes[1:])+1
 # Keep only main figure; this removes decorative hearts and sparkles.
 keep=labels==largest
 # Add a single-pixel anti-aliased contour; resize handles the rest.
 alpha=keep.astype(float)
 inside=ndi.distance_transform_edt(keep)
 alpha[(inside>0)&(inside<2)]=.88
 rgba=np.dstack([a.astype('uint8'),(alpha*255).astype('uint8')]);res=Image.fromarray(rgba,'RGBA');bbox=res.getbbox();res=res.crop(bbox)
 w=round(res.width*256/res.height);res=res.resize((w,256),Image.Resampling.LANCZOS)
 id=f'c{n:03}';res.save(out/f'{id}.webp',quality=90,method=5)
 role='hero' if n in heroes else 'enemy' if n in enemies else 'elite' if n in elites else 'reserve'
 name,title,weapon=heroes.get(n,(f'{first[(n-1)%len(first)]} {last[(n//len(first))%len(last)]}', 'Riftborn' if role=='elite' else 'Wildling', 'blade'))
 manifest.append({'id':id,'name':name,'title':title,'role':role,'weapon':weapon,'src':f'sprites/{id}.webp','width':w,'height':256,'adult':True,'sourceFile':str(f.relative_to('/workspace/iso-examples'))})
 print(id,role,name,flush=True)
(out.parent/'manifest.json').write_text(json.dumps(manifest,indent=2))
# QA grid of playable and active enemy cutouts on game palette
active=[m for m in manifest if m['role']!='reserve'];sheet=Image.new('RGB',(1200,((len(active)+9)//10)*180),'#a3af9c');d=ImageDraw.Draw(sheet)
for i,m in enumerate(active):
 im=Image.open(out/(m['id']+'.webp'));im.thumbnail((115,152));x=i%10*120+(120-im.width)//2;y=i//10*180;sheet.paste(im,(x,y),im);d.text((i%10*120+6,y+155),m['id']+' '+m['role'],fill='#252d2d')
sheet.save('/workspace/iso-cutouts.jpg')
print('total bytes',sum(f.stat().st_size for f in out.glob('*.webp')))
