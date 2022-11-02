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
  onBrokenLinks: "ignore",
  onBrokenMarkdownLinks: "ignore",
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
        appId: "21T5PEFGI7",
        apiKey: "10d7777b44bc7e0495cc00e860918b03",
        indexName: "frontendinterviewhandbook",
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
