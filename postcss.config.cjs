module.exports = {
  plugins: {
    // 同じプロパティの上書き（shorthand → longhand 等）は並べ替えない
    'css-declaration-sorter': { order: 'alphabetical', keepOverrides: true },
    // autoprefixer を内蔵しているので、単体では入れない（二重適用になる）
    'postcss-preset-env': { autoprefixer: { grid: 'autoplace' } },
  },
};
