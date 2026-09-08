# Bread of Life Divine Covenant Ministry Website

The public church website and private administration dashboard are kept separate so the project is easy to understand.

## Quick folder guide

| Location | What it controls |
| --- | --- |
| `public/home.html` | Public homepage sections and wording |
| `public/site-settings.js` | Church name, pastor, contacts, service time and YouTube link |
| `public/assets/css/` | Public website colors, spacing and responsive design |
| `public/assets/images/` | Logo and replaceable local pictures |
| `public/assets/js/` | Menu, animations, forms and database content |
| `app/admin/` | Private administration dashboard |
| `app/api/` | Database connections used by the website |
| `db/schema.ts` | Database table definitions |
| `drizzle/` | Database migrations |
| `.openai/hosting.json` | Live Sites hosting and database binding |

For normal church detail changes, edit only `public/site-settings.js` or use the Admin dashboard. You usually do not need to edit the other folders.

## Run it on your computer

### 1. Install the required programs

Install:

1. [Node.js 22 or newer](https://nodejs.org/)
2. [Git](https://git-scm.com/downloads)
3. A code editor such as [Visual Studio Code](https://code.visualstudio.com/)

Restart the computer after installing Node.js if the `npm` command is not recognized.

### 2. Download the project

You can use **Code → Download ZIP** on GitHub and extract it, or run:

```bash
git clone https://github.com/GARBATHEGREAT/BOL-church-website.git
cd BOL-church-website
```

### 3. Install the project

```bash
npm install
```

Run this once after downloading, and again only when `package.json` changes.

### 4. Create the local database

```bash
npm run db:setup
```

This creates a private local database on your computer and applies every file in `drizzle/`.

### 5. Start the website

```bash
npm run dev
```

Open the address shown in the terminal, normally:

- Website: http://localhost:5173
- Admin dashboard: http://localhost:5173/admin

The local admin dashboard opens directly for development. The live dashboard remains protected and only allows `Garbajohn101@gmail.com`.

### 6. Stop the website

Return to the terminal and press:

```text
Ctrl + C
```

## Make simple changes

Open `public/site-settings.js`. Change only the words between quotation marks:

```js
pastorName: "Pastor John",
phone: "+234 800 000 0000",
youtubeChannel: "https://youtube.com/@bread_of_life_dcm"
```

Save the file and refresh the browser. Changes stored through the Admin dashboard override matching default values in this file.

### Replace the logo

Replace both files below with your new PNG while keeping the same filenames:

- `public/logo.png`
- `public/assets/images/bread-of-life-logo.png`

### Change colors

The main brand colors are at the top of `public/assets/css/theme.css`. The final mobile menu rules are in `public/assets/css/mobile-menu.css`.

## Build a production copy

```bash
npm run build
```

The finished production website is created inside `dist/`. Do not edit generated files in `dist/` manually; edit `app/` or `public/` and build again.

## Update GitHub

```bash
git add .
git commit -m "Describe the changes you made"
git push origin main
```

Never upload passwords, API keys, login tokens or private visitor information to GitHub.

## Important notes

- The downloaded project uses a local database. It does not download private information from the live website.
- The live database is managed by the hosting platform.
- YouTube videos can be added from the Admin dashboard using a normal YouTube video link.
- If the database tables change, run `npm run db:generate`, inspect the new migration, then run `npm run db:setup`.
