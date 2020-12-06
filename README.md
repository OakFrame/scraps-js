Run `scraps.html` in your browser.

#### Building Distributable
`yarn package`

#### Running in the Browser
Include the following CSS file in your page
```html
<link rel="stylesheet" href="dist/scraps.css" type="text/css" />
```

Add Scraps to your page (creates a blank scrap)
```html
<div class="scraps-js"></div>
```

Or, with some included JS:
```html
<div class="scraps-js">project_name = 'Scraps-JS';
order = 1;</div>
```

Include the following JS file in your page, after any scraps
```html
<script src="https://oakframe.org/dist/scraps.js"></script>
```

//TODO

License: MIT \
With love, from Dallas