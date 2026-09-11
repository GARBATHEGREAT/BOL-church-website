'use client';
import {FormEvent,useState} from 'react';

export type ContentItem={id:number;section:string;title:string;subtitle:string;description:string;body:string;image_url:string;button_text:string;button_url:string;contact_links:string;sort_order:number;visible:number};
type Field='title'|'subtitle'|'description'|'body'|'buttonText'|'buttonUrl'|'contactLinks';
type Props={section:string;title:string;description:string;items:ContentItem[];fields:{key:Field;label:string;placeholder?:string;textarea?:boolean}[];send:(payload:any)=>Promise<void>};
const dbKey:Record<Field,string>={title:'title',subtitle:'subtitle',description:'description',body:'body',buttonText:'button_text',buttonUrl:'button_url',contactLinks:'contact_links'};

export default function ContentManager({section,title,description,items,fields,send}:Props){
 const[uploading,setUploading]=useState<number|string|null>(null),[notice,setNotice]=useState('');
 async function upload(file:File,target:HTMLInputElement,id:number|string){
  setUploading(id);setNotice('');
  try{const form=new FormData();form.append('image',file);const response=await fetch('/api/admin/upload',{method:'POST',body:form});if(!response.ok)throw new Error((await response.json()).error||'Upload failed');const result=await response.json();target.value=result.url;setNotice('Image uploaded. Save the item to publish it.')}catch(error:any){setNotice(error.message)}finally{setUploading(null)}
 }
 async function submit(event:FormEvent<HTMLFormElement>,action:string,id?:number){
  event.preventDefault();const form=event.currentTarget;const values=Object.fromEntries(new FormData(form));await send({action,id,section,...values});if(action==='content_create')form.reset();
 }
 return <div className="collection-page"><div className="collection-intro"><div><small>Website content</small><h2>{title}</h2><p>{description}</p></div><span>{items.length} item{items.length===1?'':'s'}</span></div>
  {notice&&<p className="admin-notice" role="status">{notice}</p>}
  <form className="panel item-editor item-new" onSubmit={e=>submit(e,'content_create')}>
   <div className="item-heading"><div><span className="status-dot"></span><b>Add a new item</b></div></div>
   <ImageField id="new" uploading={uploading} onUpload={upload}/>
   <Fields fields={fields}/><button className="save-button">Add to website</button>
  </form>
  <div className="collection-list">{items.map((item,index)=><form className={'panel item-editor '+(!item.visible?'is-hidden':'')} key={item.id} onSubmit={e=>submit(e,'content_update',item.id)}>
   <div className="item-heading"><div><span className="drag-index">{String(index+1).padStart(2,'0')}</span><span><b>{item.title||'Untitled item'}</b><small>{item.visible?'Visible on website':'Hidden from website'}</small></span></div><div className="item-actions"><button type="button" aria-label="Move up" disabled={index===0} onClick={()=>send({action:'content_move',id:item.id,direction:-1})}>↑</button><button type="button" aria-label="Move down" disabled={index===items.length-1} onClick={()=>send({action:'content_move',id:item.id,direction:1})}>↓</button><button type="button" className="visibility" onClick={()=>send({action:'content_toggle',id:item.id,visible:!item.visible})}>{item.visible?'Hide':'Show'}</button><button type="button" className="delete" onClick={()=>confirm('Delete this item permanently?')&&send({action:'content_delete',id:item.id})}>Delete</button></div></div>
   <ImageField id={item.id} value={item.image_url} uploading={uploading} onUpload={upload}/><Fields fields={fields} item={item}/><button className="save-button">Save changes</button>
  </form>)}</div>
 </div>
}

function ImageField({id,value='',uploading,onUpload}:{id:number|string;value?:string;uploading:number|string|null;onUpload:(file:File,target:HTMLInputElement,id:number|string)=>void}){
 return <div className="image-editor">{value?<img src={value} alt="Current item"/>:<div className="image-placeholder">Image preview</div>}<div><label>Image URL<input name="imageUrl" defaultValue={value} placeholder="Upload an image or paste a URL"/></label><label className="upload-button">{uploading===id?'Uploading…':'Upload image'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e=>{const file=e.target.files?.[0];const url=e.currentTarget.closest('.image-editor')?.querySelector<HTMLInputElement>('input[name="imageUrl"]');if(file&&url)onUpload(file,url,id)}}/></label><small>JPG, PNG, WebP or GIF. Images are automatically cropped without distortion.</small></div></div>
}
function Fields({fields,item}:{fields:Props['fields'];item?:ContentItem}){
 return <div className="item-fields">{fields.map(field=><label key={field.key}>{field.label}{field.textarea?<textarea name={field.key} rows={field.key==='body'?5:3} defaultValue={item?.[dbKey[field.key] as keyof ContentItem] as string||''} placeholder={field.placeholder}/>:<input name={field.key} defaultValue={item?.[dbKey[field.key] as keyof ContentItem] as string||''} placeholder={field.placeholder}/>}</label>)}</div>
}
