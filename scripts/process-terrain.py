import sys, json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'.terrain-tools'))
import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.transform import from_bounds
from rasterio.warp import reproject
from PIL import Image
root=Path(__file__).resolve().parents[1]
base=Path(r'D:\Projetos\Clientes\Sergio Pinheiro Barbosa ME\840.053.1990\CAD\Drone\Mapeamento_Lucas')
with rasterio.open(base/'MDT.tif') as dem:
 bounds=dem.bounds
 width=bounds.right-bounds.left; depth=bounds.top-bounds.bottom
 cols=1025; rows=round((cols-1)*depth/width)+1
 heights=dem.read(1,out_shape=(rows,cols),resampling=Resampling.bilinear,masked=True)
 valid=~np.ma.getmaskarray(heights)
 low=float(heights.min()); high=float(heights.max())
 data=heights.filled(np.nan).astype('<f4')
 data.tofile(root/'vendor/terrain-height.bin')
 tw=4096; th=round(tw*depth/width)
 dst_transform=from_bounds(*bounds,tw,th)
 with rasterio.open(base/'ORTOMOSAICO.tif') as ortho:
  sw=4096; sh=round(sw*ortho.height/ortho.width)
  source=ortho.read(out_shape=(3,sh,sw),resampling=Resampling.bilinear)
  source_transform=ortho.transform*ortho.transform.scale(ortho.width/sw,ortho.height/sh)
  rgb=np.empty((3,th,tw),dtype=np.uint8)
  for band,bg in enumerate([25,32,25]):
   rgb[band].fill(bg)
   reproject(source[band],rgb[band],src_transform=source_transform,src_crs=ortho.crs,dst_transform=dst_transform,dst_crs=dem.crs,resampling=Resampling.bilinear,init_dest_nodata=False)
  Image.fromarray(rgb.transpose(1,2,0)).save(root/'assets/terrain-texture.jpg',quality=92,optimize=True)
 meta=dict(cols=cols,rows=rows,widthMeters=width,depthMeters=depth,minElevation=low,maxElevation=high,crs=str(dem.crs),bounds=list(bounds),verticalExaggeration=1.0,validVertices=int(valid.sum()),sourceDEM='MDT.tif',sourceTexture='ORTOMOSAICO.tif')
 (root/'assets/terrain-metadata.json').write_text(json.dumps(meta,indent=2),encoding='utf8')
 print(json.dumps(meta))
 Image.fromarray(rgb.transpose(1,2,0)).resize((1000,round(1000*th/tw))).save(root/'assets/terrain-preview.jpg')
