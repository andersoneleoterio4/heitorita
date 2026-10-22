import sys,json,xml.etree.ElementTree as ET
from pathlib import Path
sys.path.insert(0,'.terrain-tools')
from rasterio.warp import transform
root=Path('.')
meta=json.loads((root/'assets/terrain-metadata.json').read_text())
points=[]
for name in ['Galeria_01','Galeria_02','Galeria_03','Sede_do_Empreendimento']:
 path=root/'assets'/f'{name}.kml'
 xml=ET.parse(path)
 coords=xml.find('.//{http://www.opengis.net/kml/2.2}Point/{http://www.opengis.net/kml/2.2}coordinates')
 lon,lat,*_=map(float,coords.text.strip().split(','))
 x,y=transform('EPSG:4326',meta['crs'],[lon],[lat])
 left,bottom,right,top=meta['bounds']
 assert left<=x[0]<=right and bottom<=y[0]<=top, name+' fora do terreno'
 points.append(dict(name=name,longitude=lon,latitude=lat,easting=x[0],northing=y[0]))
(root/'assets/terrain-points.json').write_text(json.dumps(points,indent=2),encoding='utf8')
print(json.dumps(points,indent=2))
