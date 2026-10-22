const structureViewer = document.getElementById('structureViewer');
const structurePhoto = document.getElementById('structurePhoto');
const structureCaption = document.getElementById('structureCaption');
let structureButtons = [];
let structureTitle = '';
let structureIndex = 0;
function showStructurePhoto(index) {
  structureIndex = (index + structureButtons.length) % structureButtons.length;
  structureViewer.classList.remove('actual-size');
  structurePhoto.src = structureButtons[structureIndex].querySelector('img').getAttribute('src');
  structurePhoto.alt = translate(structureTitle) + ' · ' + (structureIndex + 1);
  structureCaption.textContent = translate(structureTitle) + ' · ' + (structureIndex + 1) + ' / ' + structureButtons.length;
  structureViewer.querySelector('.structure-photo-area').scrollTo(0, 0);
}
document.querySelectorAll('.structure-mosaic').forEach(mosaic => {
const buttons = [...mosaic.querySelectorAll('.structure-tile')];
buttons.forEach((button, index) => button.addEventListener('click', () => {
  structureButtons = buttons;
  const heading = mosaic.closest('article').querySelector('h3');
  structureTitle = (originalText.get(heading.firstChild) || heading.textContent).trim();
  showStructurePhoto(index);
  structureViewer.showModal();
  document.body.style.overflow = 'hidden';
}));
});
document.getElementById('structureClose').addEventListener('click', () => structureViewer.close());
structureViewer.addEventListener('close', () => { document.body.style.overflow = ''; });
structureViewer.addEventListener('click', event => { if (event.target === structureViewer) structureViewer.close(); });
document.getElementById('structurePrevious').addEventListener('click', () => showStructurePhoto(structureIndex - 1));
document.getElementById('structureNext').addEventListener('click', () => showStructurePhoto(structureIndex + 1));
document.getElementById('structureZoom').addEventListener('click', () => structureViewer.classList.toggle('actual-size'));
structureViewer.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); showStructurePhoto(structureIndex - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); showStructurePhoto(structureIndex + 1); }
});
