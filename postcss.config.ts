module.exports = {
  plugins: {
    autoprefixer: {},
    'postcss-replace': {
      pattern: /align-items:\s*start;/g,
      data: {
        replaceAll: 'align-items: flex-start;',
      },
    },
  },
};
