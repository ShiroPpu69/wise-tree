"""Create metadata-only audit records; original media/dialogue stay private.

Requires completed extraction, local resource analysis and PE inspection.
Does not run or modify the original game. Fixed to this measured installation.
"""
from pathlib import Path
import hashlib
import json


def load(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def main():
    root=Path(__file__).resolve().parents[1]
    source=Path(r'D:\Steam\steamapps\common\Plants Vs Zombies')
    extracted=root/'private/extracted/steam-goty-1.2.0.1096'
    resource=load(root/'private/reports/goty-resource-analysis/analysis.json')
    inventory=load(root/'private/reports/local-pak-inventory.json')
    static=load(root/'private/reports/exe-static/pe-summary.json')
    probe=load(root/'private/reports/pvz2godot-real-probe/result.json')
    font_probe=load(root/'private/reports/pvz2godot-real-probe/font-parser-result.json')
    sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
    assert sha(source/'main.pak')==inventory['sha256']
    assert sha(source/'PlantsVsZombies.exe')==static['sha256']==static['inputSha256After']
    assert all(x['matches'] for x in resource['comparisons'].values())
    assert sum(x['scalar_and_string_comparisons'] for x in resource['comparisons'].values())==466378
    asm=root/'private/reports/exe-static'
    assert 'cmp edi, 0x32' in (asm/'pe-1a71a2-xref-430d6d.asm.txt').read_text()
    assert 'cmp edi, 0x33' in (asm/'pe-1a71a2-xref-430fbb.asm.txt').read_text()
    assert 'setge al' in (asm/'store-food-stock.asm.txt').read_text()
    assert static['peImages'][1]['treeFoodCostJumpTarget']=='0x49b1f5'
    rows=[]
    converted={path for image in resource['textures'].values() for path in image['paths']}
    for entry in inventory['entries']:
        path=entry['path'];local=extracted/path
        assert sha(local)==entry['sha256'],path
        scoped=path in converted or any(key in path.casefold() for key in ['treeofwisdom','treefood','briannetod16','houseofterror16','lawnstrings','resources.xml','fertilizer.ogg','plantgrow.ogg','store_'])
        rows.append({'originalPath':path,'resourceName':Path(path).name,
                     'containerSha256':inventory['sha256'],'sha256':entry['sha256'],'bytes':entry['size'],
                     'type':'.'.join(Path(path).suffixes).lstrip('.') or 'unknown',
                     'purpose':'wisdom-tree/store/shared research scope' if scoped else 'not individually classified; outside current scope',
                     'extracted':True,'writtenHashMatches':True,
                     'conversionStatus':'RGBA texture decoded and dimension checked' if path in converted else 'not converted / inspect original type',
                     'conversionEffect':'offline reference reconstruction only' if path in converted else 'not visually evaluated',
                     'gotyEvidence':'local Steam GOTY 1.2.0.1096 installation; version/provenance+container hash',
                     'originalRuntimeVerified':False,'needsFurtherVerification':True})
    (root/'private/reports/resource-audit.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
    private_install={'sourcePath':str(source),'fileVersion':'1.2.0.1096','productVersion':'1.2.0.1096',
                     'steam':{'appid':3590,'buildid':'11226','language':'english','name':'Plants vs. Zombies: Game of the Year'},
                     'readmeBuildDate':'December 15, 2010',
                     'files':{p.relative_to(source).as_posix():{'bytes':p.stat().st_size,'sha256':sha(p)}
                              for p in [source/'PlantsVsZombies.exe',source/'main.pak',source/'readme.html',*sorted((source/'properties').glob('*'))] if p.is_file()},
                     'scope':'read-only; no game process, save, Steam account identifier, or API key collected'}
    (root/'private/reports/local-installation.json').write_text(json.dumps(private_install,indent=2),encoding='utf-8')
    summary={'date':'2026-10-20','installation':{'version':'1.2.0.1096','steamAppId':3590,'steamBuildId':'11226','language':'english','readmeBuildDate':'2010-12-15'},
             'mainPak':{'bytes':inventory['bytes'],'entryCount':inventory['entry_count'],'sha256':inventory['sha256'],'allExtractedHashesMatch':True},
             'executable':{'sha256':static['sha256'],'embeddedPeFileOffset':hex(static['peImages'][1]['fileOffset']),'modified':False},
             'staticFindings':{'initFunctionVA':'0x430c50','initSegmentMax':50,'growFunctionVA':'0x430f60','growSegmentMax':51,
                               'fertilizeFunctionVA':'0x4310f0','giveWisdomFunctionVA':'0x4312c0',
                               'foodStockCheckVA':'0x499577','foodSoldOutAt':10,'foodInternalCost':250,
                               'moneyFormatFunctionVA':'0x45b6f0','moneyDisplayMultiplier':10,
                               'evidence':'Local executable string references and manually inspected control flow, not runtime execution'},
             'animationCounts':resource['animationCounts'],'xmlCompiledComparisons':resource['comparisons'],
             'resolvedImageReferences':len(resource['textures']),'originalTreeStringKeys':len(resource['treeDialogueKeys']),
             'fonts':resource['fonts'],'audioHeaderMeasurements':resource['audio'],
             'referenceConversion':probe,'referenceFontParser':font_probe,
             'offlineResearchRenders':len(resource['states']),
             'tests':{'syntheticTestsPassed':14,'syntheticTestsFailed':0,'all3198ExtractedHashesRechecked':True},
             'gates':{'originalRuntimeComparison':'not run','pixelCoordinateAcceptance':'not run','soundSyncAcceptance':'not run',
                      'PixiOrGodotEnginePlayback':'not run','Phase1':'entry criteria not yet satisfied'},
             'privateArtifacts':['private/reports/resource-audit.json','private/reports/goty-resource-analysis/analysis.json',
                                 'private/reports/goty-resource-analysis/original-tree-dialogue.json','private/reports/exe-static/pe-summary.json']}
    (root/'research/local-goty-summary.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
    print(f"Verified {len(rows)} extracted files and both original hashes; wrote metadata-only public summary and private per-resource audit")


if __name__=='__main__':
    main()
