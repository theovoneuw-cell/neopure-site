/* Build statique Neopure.
   Le contenu éditable (logos clients, galerie, textes) vit dans src/_data/*.json
   et est injecté dans src/index.njk au build → le HTML généré est identique à
   l'ancien index.html écrit à la main (main.js/style.css inchangés).
   css/, js/, assets/ et les fichiers racine sont recopiés tels quels. */
module.exports = function (eleventyConfig) {
  ["css", "js", "assets", "robots.txt", "sitemap.xml", ".pages.yml"].forEach(
    function (p) { eleventyConfig.addPassthroughCopy(p); }
  );

  return {
    dir: { input: "src", output: "_site", data: "_data" },
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "html"]
  };
};
