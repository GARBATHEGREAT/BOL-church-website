import{index,integer,sqliteTable,text}from'drizzle-orm/sqlite-core';
export const settings=sqliteTable('settings',{key:text('key').primaryKey(),value:text('value').notNull(),updatedAt:text('updated_at').notNull()});
export const submissions=sqliteTable('submissions',{id:integer('id').primaryKey({autoIncrement:true}),type:text('type').notNull(),name:text('name').notNull(),contact:text('contact').notNull(),message:text('message').notNull().default(''),status:text('status').notNull().default('new'),createdAt:text('created_at').notNull()},t=>[index('idx_submissions_created_at').on(t.createdAt),index('idx_submissions_status').on(t.status)]);
export const sermons=sqliteTable('sermons',{id:integer('id').primaryKey({autoIncrement:true}),youtubeId:text('youtube_id').notNull(),title:text('title').notNull(),pastor:text('pastor').notNull(),duration:text('duration').notNull(),published:integer('published',{mode:'boolean'}).notNull().default(true),featured:integer('featured',{mode:'boolean'}).notNull().default(false),createdAt:text('created_at').notNull()});
export const events=sqliteTable('events',{id:integer('id').primaryKey({autoIncrement:true}),title:text('title').notNull(),eventDate:text('event_date').notNull(),eventTime:text('event_time').notNull(),location:text('location').notNull().default(''),published:integer('published',{mode:'boolean'}).notNull().default(true)},t=>[index('idx_events_date').on(t.eventDate)]);
export const contentItems=sqliteTable('content_items',{
 id:integer('id').primaryKey({autoIncrement:true}),
 section:text('section').notNull(),
 title:text('title').notNull().default(''),
 subtitle:text('subtitle').notNull().default(''),
 description:text('description').notNull().default(''),
 body:text('body').notNull().default(''),
 imageUrl:text('image_url').notNull().default(''),
 buttonText:text('button_text').notNull().default(''),
 buttonUrl:text('button_url').notNull().default(''),
 contactLinks:text('contact_links').notNull().default(''),
 sortOrder:integer('sort_order').notNull().default(0),
 visible:integer('visible',{mode:'boolean'}).notNull().default(true),
 createdAt:text('created_at').notNull(),
 updatedAt:text('updated_at').notNull()
},t=>[
 index('idx_content_items_section_order').on(t.section,t.sortOrder),
 index('idx_content_items_section_visible').on(t.section,t.visible)
]);
