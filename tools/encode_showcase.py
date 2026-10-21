"""Encode actual capture frames; no generated or reconstructed game imagery."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
for language in ('zh','en'):
    frames=[]
    for filename in sorted((root/'private/showcase'/f'frames-{language}').glob('*.png')):
        with Image.open(filename) as image:
            frames.append(image.convert('RGB').resize((720,540),Image.Resampling.LANCZOS))
    # A shared palette reduces flicker, and bounding-box optimization keeps files small.
    palette=frames[len(frames)//2].quantize(colors=192)
    frames=[frame.quantize(palette=palette,dither=Image.Dither.NONE) for frame in frames]
    target=root/'docs/media'/f'demo-{language}.gif'
    frames[0].save(target,save_all=True,append_images=frames[1:],duration=[140]*(len(frames)-1)+[1400],loop=0,optimize=True)
    print(target.name,target.stat().st_size,'bytes',len(frames),'frames')
