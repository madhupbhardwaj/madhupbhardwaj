# Madhup — portfolio

A responsive, static portfolio with real project previews, scroll reveals, hover animation, a reading-progress bar, and reduced-motion support. Built with HTML, CSS, and JavaScript. No dependencies or build step required.

## Preview

Open `index.html` in your browser. Alternatively, run `python3 -m http.server 8000` in this folder and visit http://localhost:8000.

## Deploy with GitHub and Vercel

1. Extract this ZIP.
2. Create a new GitHub repository, for example `madhup-portfolio`.
3. Choose **Add file → Upload files**. Upload the contents of this folder, including `assets`. `index.html` should be at the repository root, not inside an extra folder. Commit the files.
4. In Vercel, choose **Add New → Project** and import the repository.
5. Use **Other** as the framework preset. Keep the root directory as `./`, leave the build command empty, and use `.` as the output directory if Vercel asks. No install command or environment variables are needed.
6. Click **Deploy**. Future commits to your connected production branch will update the site.

## Edit

- Name, bio, descriptions and links: `index.html`.
- Colors, typography, responsive layout and animation: `style.css`.
- Scroll reveals and progress: `script.js`.
- Project screenshots: `assets/problemslate.jpg` and `assets/problemset.jpg`.

The bio uses the supplied context: Madhup, a high school student in India interested in mathematics and building tools. Adjust any wording before publishing. No email address or social profile was invented. Project previews are screenshots of the supplied public websites, captured for this portfolio.

Fonts are loaded from Google Fonts (DM Sans and Instrument Serif); system fonts serve as fallbacks if unavailable. Everything else is included locally. There are no analytics, contact forms, cookies, or API keys.
