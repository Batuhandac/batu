// app.json'daki yapılandırmayı olduğu gibi kullanır. Yalnızca web paneli bir alt
// klasörde yayınlanırken (GitHub Pages: /batu/hekim) EXPO_BASE_URL verilir.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}),
  },
});
