const DIRECT_UPLOAD_LIMIT = 3 * 1024 * 1024;
const TARGET_UPLOAD_LIMIT = 3.5 * 1024 * 1024;
const MAX_IMAGE_EDGE = 2200;
const WEB_IMAGE_TYPES = new Set(['image/jpeg','image/png','image/webp','image/gif']);

/** Makes high-resolution and HEIC-capable phone photos safe for the upload proxy. */
export async function prepareAdminUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name)) return file;
  if (WEB_IMAGE_TYPES.has(file.type) && file.size <= DIRECT_UPLOAD_LIMIT) return file;

  let source: ImageBitmap | HTMLImageElement;
  try {
    if ('createImageBitmap' in window) source = await createImageBitmap(file, {imageOrientation:'from-image'});
    else source = await loadImage(file);
  } catch {
    if (WEB_IMAGE_TYPES.has(file.type) && file.size <= TARGET_UPLOAD_LIMIT) return file;
    throw new Error('This phone photo could not be prepared. Please choose JPG, PNG or WebP, or take a screenshot of the photo and upload that.');
  }

  const originalWidth=source.width,originalHeight=source.height;
  let scale=Math.min(1,MAX_IMAGE_EDGE/Math.max(originalWidth,originalHeight));
  let quality=.88,blob:Blob|null=null;
  for(let attempt=0;attempt<5;attempt++){
    const width=Math.max(1,Math.round(originalWidth*scale));
    const height=Math.max(1,Math.round(originalHeight*scale));
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const context=canvas.getContext('2d');if(!context)throw new Error('Your browser could not prepare this image.');
    context.drawImage(source,0,0,width,height);
    blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));
    if(blob&&blob.size<=TARGET_UPLOAD_LIMIT)break;
    scale*=.82;quality=Math.max(.68,quality-.06);
  }
  if('close' in source&&typeof source.close==='function')source.close();
  if(!blob)throw new Error('Your browser could not prepare this image. Please try a smaller photo.');
  const basename=file.name.replace(/\.[^.]+$/,'').replace(/[^a-z0-9_-]+/gi,'-').slice(0,70)||'church-photo';
  return new File([blob],basename+'.jpg',{type:'image/jpeg',lastModified:Date.now()});
}

function loadImage(file:File){
  return new Promise<HTMLImageElement>((resolve,reject)=>{
    const url=URL.createObjectURL(file),image=new Image();
    image.onload=()=>{URL.revokeObjectURL(url);resolve(image)};
    image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Image decode failed'))};
    image.src=url;
  });
}
