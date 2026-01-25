module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module-resolver', {
      root: ['./src'],
      extensions: ['.ios.js', '.android.js', '.js', '.json'],
      alias: {
        '@context': './src/context',
        '@components': './src/components',
        '@services': './src/services',
        '@utils': './src/utils',
        '@screens': './src/screens',
        '@navigation': './src/navigation',
      },
    }],
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
    }],
  ],
};