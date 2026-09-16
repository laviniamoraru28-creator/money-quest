# Deploying Money Quest — Step by Step

These instructions assume you don't want to use Command Prompt, Terminal, or any command-line tool. Everything below is done by clicking through websites and regular applications.

You'll do this in two stages: first put the project on GitHub, then connect GitHub to Vercel (the hosting service). Vercel builds and hosts the site for you — you never install or run anything on your own computer.

## What you need

- A web browser
- A GitHub account (free) — sign up at github.com if you don't have one
- A Vercel account (free) — you can sign up using your GitHub account, so no separate password to remember

## Stage 1: Put the project on GitHub

**Option A — drag and drop in your browser (try this first)**

1. Unzip the project folder on your computer, if you haven't already.
2. Go to github.com and log in.
3. Click the **+** icon in the top right → **New repository**.
4. Give it a name (e.g. `money-quest`), leave the other settings as they are, and click **Create repository**.
5. On the new, empty repository page, look for a link that says **"uploading an existing file"** and click it.
6. Drag the entire unzipped project folder's contents into the browser window.
7. Scroll down and click **Commit changes**.

**Option B — GitHub Desktop (if Option A struggles with the number of files)**

1. Download and install **GitHub Desktop** from desktop.github.com — this is a normal application with a window and buttons, not a command line.
2. Sign in with your GitHub account.
3. Choose **File → Add Local Repository**, and point it at your unzipped project folder.
4. If it offers to create a repository for the folder, accept.
5. Click **Publish repository** in the top bar.

Either way, you should end up with your project visible on github.com under your account.

## Stage 2: Connect GitHub to Vercel

1. Go to vercel.com and click **Sign Up**.
2. Choose **Continue with GitHub**, and approve the connection when GitHub asks.
3. On your Vercel dashboard, click **Add New** → **Project**.
4. Find the repository you created in Stage 1 in the list, and click **Import** next to it.
5. Vercel will detect this is a Next.js project automatically. You don't need to change any of the settings it shows you.
6. Click **Deploy**.
7. Wait a minute or two while Vercel builds the site. When it finishes, you'll see a **"Congratulations"** screen with a **Visit** button.
8. Click **Visit** — this opens your live site. The URL will look like `https://money-quest-yourname.vercel.app`.

That URL works from any device — open it on your phone and your computer to test both.

## After deploying (optional, not required)

The site works correctly with no further setup. If you'd like search engines and social media previews to show your actual Vercel URL instead of a placeholder, you can optionally set one environment variable:

1. In your Vercel project, go to **Settings → Environment Variables**.
2. Add `NEXT_PUBLIC_SITE_URL` with your live URL as the value (e.g. `https://money-quest-yourname.vercel.app`).
3. Redeploy (Vercel's **Deployments** tab → **⋯** on the latest deployment → **Redeploy**) for the change to take effect.

Nothing about the app's functionality depends on this — it only affects metadata shown to search engines and link previews.

## If you make changes later

Any time you push new changes to the GitHub repository (through the same drag-and-drop upload, or GitHub Desktop's **Commit** and **Push** buttons), Vercel automatically rebuilds and redeploys the site within a minute or two. There's nothing extra to do on the Vercel side.
