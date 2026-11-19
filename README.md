# tranthanhphuhoang.us.com

Personal portfolio of **Tran Thanh Phu Hoang (Phu)**, an electrical engineering student at Iron Range Engineering (Minnesota State University, Mankato). The site shows my projects, experience, leadership, and resume.

**Live site:** https://tranthanhphuhoang.us.com

## What is on the site

- **Projects** with full write-ups that open in pop-up panels: the Singing Stepper Motor, a truss bridge load test, a client temperature study for Lamppa Manufacturing, Arduino breadboard circuits, a value stream map, and a personal finance dashboard
- An interactive coil explorer that steps through a stepper motor's wave, full step, and half step drive modes
- The full Arduino code for the Singing Stepper Motor, with syntax highlighting and a copy button
- Experience, leadership, skills, and a downloadable resume

## How it is built

The site is plain HTML, CSS, and JavaScript with no framework or build step, hosted on GitHub Pages.

- **Single-page layout** with a sticky menu that highlights the section you are reading as you scroll
- **Rotor menu:** a floating, draggable dial for jumping between sections; it remembers where you left it
- **Project pop-ups** written from scratch as accessible dialogs (`role="dialog"`, focus handling, Escape to close) with tabs inside
- **Responsive design** from phone to desktop using CSS grid, `clamp()` type sizes, and media queries
- **Light and fast:** the page itself is about 60 KB; photos and videos load lazily from `assets/`
- **Direct project links:** `tranthanhphuhoang.us.com/stepper` (also `/bridge`, `/sauna`, `/arduino`, `/vsm`, `/dashboard`) opens that project's pop-up right away, and each link shows its own preview card when shared
- **Code highlighting** with [Prism.js](https://prismjs.com/)
- **Link previews** with Open Graph tags, so shared links show a card with my photo

## Folder structure

```
.
├── index.html            Page content
├── css/
│   └── style.css         All styles
├── js/
│   └── main.js           Menu, scrolling, dialogs, video, code viewer, resume links
├── assets/
│   ├── img/              Photos, diagrams, graphs, favicon, link preview image
│   ├── video/            Project videos (MP4 and WebM)
│   └── docs/             Resume PDF
├── code/
│   └── singing_stepper.ino   Arduino code for the Singing Stepper Motor
├── stepper/, bridge/, sauna/, arduino/, vsm/, dashboard/
│                         Short links to each project, each with its own link preview
├── 404.html              Sends mistyped links to the right part of the page
└── CNAME                 Custom domain for GitHub Pages
```

## Run it locally

```bash
git clone https://github.com/Tapunokoko/Website.git
cd Website
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Contact

phu.hoang@ire.minnstate.edu · [LinkedIn](https://www.linkedin.com/in/phu-hoang-engineer)
