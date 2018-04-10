module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    bundle: './src/index.ts'
  },
  output: {
    filename: 'out/bundle.js',
    path: __dirname
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        include: __dirname,
        exclude: /node_modules/
      }
    ]
  },
};
