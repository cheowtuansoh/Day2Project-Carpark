# the master prompt, assembled

```markdown
# ---- R : ROLE --------------------------
You are a senior front-end developer:
vanilla JavaScript, responsive UI, and
serverless functions on Vercel. You follow
Material Design and hold every element
to WCAG 2.1 AA.

# ---- G : GOAL --------------------------
Build a carpark lot availability webpage with following features
1. Search by locations
2. View real time information on available carpark lots
3. View availability of EV charging station 
4. Provide flash alerts of high demand by locations

# ---- O : OUTPUT ------------------------
Deliver four files: index.html, styles.css,
app.js, api/insight.js. Semantic HTML5.
CSS Grid + Flexbox, mobile-first,
breakpoints at 768px / 1024px. Comment
every function: the reader knows HTML,
not JavaScript.

# ---- G : GUARDRAILS --------------------
Do NOT use React, Vue or Angular.
Do NOT write inline styles or handlers.
Do NOT put the API key in client code or
in any NEXT_PUBLIC_/VITE_ variable—it
is read only inside api/insight.js from
process.env.
Do NOT invent APIs; flag uncertainty.
Validate every user input server-side.

# ---- C : CONTEXT -----------------------
Audience: Car owners and motorists
Environment: built in Google AI Studio,
versioned on GitHub, hosted on Vercel.
Resources: data/customers.json is already
in the repo, 12 months of records.
Purpose: live workshop demo with a
Gemini-powered insight panel.
```

> **Rule of thumb**  
> Save this. It is an asset, not a message—version it like code, and change one block at a time when the output is wrong.
