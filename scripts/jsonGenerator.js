import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { pinyin as pinyinLib } from "pinyin";
import { slug as ghSlug } from "github-slugger";

const CONTENT_DEPTH = 2;
const JSON_FOLDER = "./.json";
const BLOG_FOLDER = "src/content/blog";

// get data from markdown
const getData = (folder, groupDepth) => {
  const getPath = fs.readdirSync(folder);
  const removeIndex = getPath.filter((item) => !item.startsWith("-"));

  const getPaths = removeIndex.flatMap((filename) => {
    const filepath = path.join(folder, filename);
    const stats = fs.statSync(filepath);
    const isFolder = stats.isDirectory();

    if (isFolder) {
      return getData(filepath, groupDepth);
    } else if (filename.endsWith(".md") || filename.endsWith(".mdx")) {
      const file = fs.readFileSync(filepath, "utf-8");
      const { data, content } = matter(file);
      const pathParts = filepath.split(path.sep);
      // Prefer explicit frontmatter slug; otherwise try to generate a slug
      // Use pinyin(title) fallback when title exists so filenames with
      // non-latin characters become URL-safe slugs.
      let slugVal = data.slug || null;
      // Get title safely
      const title = data.title || null;

      if (!slugVal) {
        // slice from CONTENT_DEPTH to keep folder (e.g. blog/filename)
        const parts = pathParts.slice(CONTENT_DEPTH);
        const folderPath = parts.slice(0, parts.length - 1).join("/");
        const fileName = parts[parts.length - 1].replace(/\.[^/.]+$/, "");

        if (title) {
          // convert title to pinyin and then slugify
          const titlePinyin = pinyinLib(title, {
            style: pinyinLib.STYLE_NORMAL,
          })
            .flat()
            .join("-");
          const titleSlug = ghSlug(titlePinyin);
          slugVal = folderPath ? `${folderPath}/${titleSlug}` : titleSlug;
        } else {
          // fallback to filename as slug
          const fileSlug = ghSlug(fileName);
          slugVal = folderPath ? `${folderPath}/${fileSlug}` : fileSlug;
        }
      }

      const slug = slugVal;
      const group = pathParts[groupDepth];

      // Ensure we have a display title even if frontmatter is missing it
      const displayTitle = title || slug.split('/').pop().replace(/-/g, ' ');

      return {
        group: group,
        slug: slug,
        frontmatter: {
          ...data,
          title: displayTitle
        },
        content: content,
      };
    } else {
      return [];
    }
  });

  return getPaths.filter((page) => !page.frontmatter?.draft && page);
};

try {
  // create folder if it doesn't exist
  if (!fs.existsSync(JSON_FOLDER)) {
    fs.mkdirSync(JSON_FOLDER);
  }

  // create json files
  fs.writeFileSync(
    `${JSON_FOLDER}/posts.json`,
    JSON.stringify(getData(BLOG_FOLDER, 2)),
  );

  // merger json files for search
  const postsPath = new URL(`../${JSON_FOLDER}/posts.json`, import.meta.url);
  const posts = JSON.parse(fs.readFileSync(postsPath, "utf8"));
  const search = [...posts];
  fs.writeFileSync(`${JSON_FOLDER}/search.json`, JSON.stringify(search));
} catch (err) {
  console.error(err);
}
