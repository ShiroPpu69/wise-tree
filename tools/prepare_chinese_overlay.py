"""Extract a small, hashed localization overlay from a named translation patch. Never run its EXE."""
from pathlib import Path
import sys,re,json,hashlib,base64
from analyze_local_goty import Textures,resource_manifest
root=Path(__file__).resolve().parents[1];base=root/'private/localization-research/extracted'
source_zip=root/'private/localization-research/PvZ_Steam_ZH_Patch_Fixed.zip'
assert hashlib.sha256(source_zip.read_bytes()).hexdigest()=='c53603723bc7760ddf47cbe56f8679da281304ce919b9a6f8931b835fa24c0a8'
text=(base/'properties/LawnStrings.txt').read_bytes().decode('gb18030').replace('\r','')
all_strings={m[1]:m[2].strip() for m in re.finditer(r'^\[([^\]\n]+)\]\s*\n([\s\S]*?)(?=^\[|\Z)',text,re.M)}
dialogue={key:re.sub(r'\s*\n\s*','',value) for key,value in all_strings.items() if key.startswith('TREE_OF_WISDOM_') or key in ['BUY_ITEM_HEADER','BUY_ITEM','DIALOG_BUTTON_YES','DIALOG_BUTTON_NO','CANT_USE_CODE']}
assert len([k for k in dialogue if k.startswith('TREE_OF_WISDOM_')])==81
original_text=(root/'private/extracted/steam-goty-1.2.0.1096/properties/LawnStrings.txt').read_text(encoding='cp1252')
original_keys=set(re.findall(r'^\[(TREE_OF_WISDOM_[^\]]+)\]',original_text,re.M));assert original_keys=={k for k in dialogue if k.startswith('TREE_OF_WISDOM_')}
textures=Textures(base,resource_manifest(base));old_base=root/'private/extracted/steam-goty-1.2.0.1096';old=Textures(old_base,resource_manifest(old_base))
images={};records={}
for key in textures.manifest:
 if not (key.startswith(('IMAGE_STORE_','IMAGE_ZEN','IMAGE_OPTIONS_','IMAGE_DIALOG_','IMAGE_BUTTON_')) or key in ['IMAGE_TREEFOOD','IMAGE_SHOVELBANK','IMAGE_COINBANK']):continue
 try:
  image=textures.image(key);before=old.image(key)
  if image.size==before.size and image.tobytes()==before.tobytes():continue
 except (FileNotFoundError,KeyError):continue
 import io
 buffer=io.BytesIO();image.save(buffer,format='PNG');raw=buffer.getvalue();images[key]=base64.b64encode(raw).decode('ascii');records[key]={'size':image.size,'sha256':hashlib.sha256(raw).hexdigest()}
source={'page':'https://www.pzwboy.top/2026/09/19/pvz-steam-zhp','download':'https://file.pzwboy.top/PvZ_Steam_ZH_Patch_Fixed.zip','author':'Pzwboy','patchDate':'2026-09-26','zipSHA256':hashlib.sha256(source_zip.read_bytes()).hexdigest(),'classification':'Community Steam GOTY patch; author says assets ported from Chinese GOTY. No independent byte comparison with an official Chinese installer; do not mislabel as an official patch.','executablesRun':False}
overlay={'version':1,'source':source,'dialogue':dialogue,'images':images}
out=root/'private/localization-research/zh-overlay.json';out.write_text(json.dumps(overlay,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
sha=hashlib.sha256(out.read_bytes()).hexdigest()
(root/'private/localization-research/overlay-audit.json').write_text(json.dumps({'source':source,'sha256':sha,'bytes':out.stat().st_size,'treeKeys':81,'images':records},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'sha256':sha,'bytes':out.stat().st_size,'treeKeys':81,'localizedImages':len(images)}))
