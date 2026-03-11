## Export All Recipes as ZIP (TXT + Images)

### What it does

Adds an "Export Recipes" button to the Recipe Management page that downloads a ZIP file containing:

- One `.txt` file per recipe in the same format as the uploaded example (title first, then sections)
- The corresponding image file for each recipe (fetched from `imgurl`)

### Format (matching user's upload)

```
Recipe Title:
Recipe name

Ingredients:
ingredient 1
ingredient 2

Instructions:
step 1
step 2

Servings:
4 people

Categories:
cat1, cat2

Website:
https://example.com
```

&nbsp;

### Implementation

**1. Create `src/utils/recipeExporter.ts**`

- `formatRecipeAsText(recipe)` — converts a recipe DB row into the text format above (title on first line, blank line, then each section with header + colon)
- `exportAllRecipesAsZip(recipes)` — uses JSZip to:
  - Add each recipe as `sanitized_title.txt`
  - Fetch each `imgurl` as blob and add as `sanitized_title.jpg/png` (preserving original extension)
  - Trigger browser download of the ZIP
- Sanitize filenames using the existing `sanitizeFilename` from `zipProcessor.ts`

**2. Update `src/pages/RecipeImporter.tsx**`

- Add an "Export All Recipes" button (with Download icon) near the page header
- On click: fetch all recipes from Supabase, call `exportAllRecipesAsZip`, show toast on success/error
- Show loading state during export

### Technical notes

- JSZip is already installed
- Image fetch uses standard `fetch()` — will work for Supabase storage URLs (public bucket)
- For images that fail to fetch (CORS, missing), the recipe is still exported as TXT without image
- Uses `sonner` toast for feedback