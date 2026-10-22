// Coordinates are converted from the KML WGS 84 points into the MDT CRS offline.
async function addTerrainMarkers({THREE,host,scene,camera,terrain,meta,scale}) {
  const response=await fetch('assets/terrain-points.json?v=3d8541d017e1', {cache:'no-store'});
  if(!response.ok)throw new Error('Não foi possível carregar as marcações do terreno.');
  const points=await response.json();
  const layersResponse=await fetch('assets/terrain-overlays.json?v=kml-1');
  if(!layersResponse.ok)throw new Error('Não foi possível carregar as camadas KML.');
  const layers=await layersResponse.json();
  for(const layer of layers.filter(layer=>layer.type==='Point')){
    const [easting,northing]=layer.coordinates[0];
    points.push({name:layer.name,easting,northing,color:layer.color});
  }
  const overlay=document.createElement('div');overlay.className='terrain-markers';
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');overlay.appendChild(svg);host.appendChild(overlay);
  const raycaster=new THREE.Raycaster();terrain.updateMatrixWorld(true);
  // Drape the KML boundary over the existing mesh without modifying its geometry.
  const positions=terrain.geometry.attributes.position;
  const meshIndices=terrain.geometry.index.array;
  const validTriangles=new Set();
  for(let i=0;i<meshIndices.length;i+=3)validTriangles.add(meshIndices[i]*2+(meshIndices[i+1]===meshIndices[i]+meta.cols?0:1));
  function boundaryPosition(easting,northing){
    const [left,bottom,right,top]=meta.bounds;
    const gx=(easting-left)/(right-left)*meta.cols-.5;
    const gz=(top-northing)/(top-bottom)*meta.rows-.5;
    const col=Math.floor(gx),row=Math.floor(gz),u=gx-col,v=gz-row,a=row*meta.cols+col;
    if(col<0||row<0||col>=meta.cols-1||row>=meta.rows-1)return null;
    const first=u+v<=1;
    if(!validTriangles.has(first?a*2:(a+1)*2+1))return null;
    const y=first?positions.getY(a)*(1-u-v)+positions.getY(a+1)*u+positions.getY(a+meta.cols)*v:
      positions.getY(a+1)*(1-v)+positions.getY(a+meta.cols)*(1-u)+positions.getY(a+meta.cols+1)*(u+v-1);
    return new THREE.Vector3((easting-(left+right)/2)*scale,y+.5,((bottom+top)/2-northing)*scale);
  }
  for(const layer of layers.filter(layer=>layer.type==='LineString')){
    const segments=[];
    for(let i=1;i<layer.coordinates.length;i++){
      const start=layer.coordinates[i-1],end=layer.coordinates[i];
      const steps=Math.max(1,Math.ceil(Math.hypot(end[0]-start[0],end[1]-start[1])/2));
      let previous=boundaryPosition(...start);
      for(let j=1;j<=steps;j++){
        const t=j/steps,current=boundaryPosition(start[0]+(end[0]-start[0])*t,start[1]+(end[1]-start[1])*t);
        if(previous&&current)segments.push(previous,current);
        previous=current;
      }
    }
    const line=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(segments),new THREE.LineBasicMaterial({color:layer.color,depthTest:true}));
    line.name=layer.name;line.renderOrder=10;scene.add(line);
  }
  const markers=points.map(point=>{
    const [left,bottom,right,top]=meta.bounds;
    const x=(point.easting-(left+right)/2)*scale,z=((bottom+top)/2-point.northing)*scale;
    raycaster.set(new THREE.Vector3(x,1000,z),new THREE.Vector3(0,-1,0));
    const hit=raycaster.intersectObject(terrain)[0];
    if(!hit)throw new Error('Ponto sem cobertura no MDT: '+point.name);
    const position=hit.point.clone();position.y+=.5;
    const color=point.color||(point.name.startsWith('Sede')?'#8de6df':'#ffda78');
    const pin=new THREE.Mesh(new THREE.SphereGeometry(2.5,16,12),new THREE.MeshBasicMaterial({color,depthTest:true}));pin.position.copy(position);pin.renderOrder=10;scene.add(pin);
    const label=document.createElement('div');label.className='terrain-point-label';label.dataset.i18n=point.name;label.textContent=translate(point.name);label.style.borderColor=color;label.setAttribute('role','note');overlay.appendChild(label);
    const line=document.createElementNS('http://www.w3.org/2000/svg','line');line.setAttribute('stroke',color);line.setAttribute('stroke-width','1.5');svg.appendChild(line);
    return {position,label,line};
  });
  return function updateTerrainMarkers(){
    const width=host.clientWidth,height=host.clientHeight;
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    const placed=[];
    for(const marker of markers){
      const p=marker.position.clone().project(camera);
      const visible=p.z>=-1&&p.z<=1&&Math.abs(p.x)<=1&&Math.abs(p.y)<=1;
      marker.label.hidden=!visible;marker.line.style.display=visible?'':'none';if(!visible)continue;
      const px=(p.x+1)*width/2,py=(1-p.y)*height/2;
      const w=marker.label.offsetWidth,h=marker.label.offsetHeight;
      let x=Math.max(6,Math.min(width-w-6,px-w/2)),y=Math.max(6,py-h-16);
      for(let attempt=0;attempt<markers.length+1;attempt++){
        const collision=placed.find(r=>x<r.x+r.w+6&&x+w+6>r.x&&y<r.y+r.h+6&&y+h+6>r.y);
        if(!collision)break;y=collision.y-h-8;
        if(y<6){y=collision.y+collision.h+8;x=Math.max(6,Math.min(width-w-6,collision.x+collision.w+8));}
      }
      y=Math.max(6,Math.min(height-h-6,y));placed.push({x,y,w,h});
      marker.label.style.transform=`translate(${x}px,${y}px)`;
      marker.line.setAttribute('x1',px);marker.line.setAttribute('y1',py);marker.line.setAttribute('x2',x+w/2);marker.line.setAttribute('y2',y+h/2);
    }
  };
}
