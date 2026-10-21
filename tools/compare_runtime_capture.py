"""Local JPEG registration diagnostic, not the <=2px visual acceptance test.

Requires Pillow and numpy. Images remain private. Run from workspace root.
"""
import json
from pathlib import Path
import numpy as np
from PIL import Image


def main():
    root=Path(__file__).resolve().parents[1]
    captures=root/'private/original-runtime'
    results=[]
    for height,name in [(49,'height49-loaded.jpg'),(51,'height51-reentered.jpg')]:
        source=Image.open(captures/'captures'/name).convert('RGB')
        if source.size!=(1920,1080):
            raise ValueError('Unexpected fullscreen capture dimensions; do not guess viewport')
        actual=np.asarray(source.crop((240,0,1680,1080)).resize((800,600),Image.Resampling.LANCZOS),dtype=float)
        expected=np.asarray(Image.open(root/f'private/reports/reanim-lab-browser/height-{height}.png').convert('RGB'),dtype=float)
        regions={'trunk':(300,250,500,330),'roots':(210,350,590,390),'grass':(150,500,650,560)}
        for label,(x0,y0,x1,y1) in regions.items():
            errors=[]
            for dy in range(-3,4):
                for dx in range(-3,4):
                    error=float(np.mean(np.abs(actual[y0:y1,x0:x1]-expected[y0+dy:y1+dy,x0+dx:x1+dx])))
                    errors.append((error,dx,dy))
            error,dx,dy=min(errors)
            results.append({'height':height,'region':label,'roi':[x0,y0,x1,y1],
                            'bestIntegerOffset':[dx,dy],'meanAbsoluteRgbError':error})
    record={'scope':'Diagnostic only: fullscreen JPEG normalized from 1440x1080 to 800x600. Not pixel acceptance; includes capture compression and resampling. Offsets limited to +/-3 pixels. Regions exclude UI/clouds.', 'results':results}
    (captures/'registration-diagnostic.json').write_text(json.dumps(record,indent=2),encoding='utf-8')
    print(json.dumps(record,indent=2))


if __name__=='__main__':main()
