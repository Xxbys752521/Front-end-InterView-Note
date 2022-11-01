// @ts-nocheck
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");
/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Front End Interview Handbook",
  tagline: "Front End Interview Handbook",
  url: "https://www.xxbys.space/",
  baseUrl: "/",
  onBrokenLinks: "log",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",
  organizationName: "Xxbys", // Usually your GitHub org/user name.
  projectName: "Front-end-Learning-Note", // Usually your repo name.
  i18n: {
    defaultLocale: "zh-cn",
    locales: ["zh-cn"],
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        gtag: {
          trackingID: "G-K06FBEHD1R",
          anonymizeIP: true,
        },
        docs: {
          routeBasePath: "/",
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your repo.
          editUrl: "https://github.com/Xxbys752521/Front-end-Learning-Note",
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          editUrl: "https://github.com/Xxbys752521/Front-end-Learning-Note",
        },
        pages: {
          path: "src/pages",
          routeBasePath: "/home",
          // ... configuration object here
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      algolia: {
        // The application ID provided by Algolia
        appId: "L4NYMVDYG7",

        // Public API key: it is safe to commit it
        apiKey: "2dc197c65a9a3bc16515f64933bb50b5",

        indexName: "wiki-404lab-top",

        // Optional: see doc section below
        // contextualSearch: true,
      },

      navbar: {
        title: "Front End Interview Handbook",
        logo: {
          alt: "My Site Logo",
          src: "img/favicon.ico",
        },
        items: [
          {
            type: "doc",
            docId: "intro",
            position: "right",
            label: "📗文档",
          },
        ],
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 5,
      },
      metadata: [
        {
          name: "前端面试手册",
          content: "Happy Codeing",
        },
      ],
    }),
};

module.exports = config;
