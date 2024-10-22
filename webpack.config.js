const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
console.log( path.resolve(__dirname, 'dev/core/src'))
module.exports = {
    entry: './src/main.ts',
    cache: false,
    output: {
        filename: 'app.js',
        path: path.resolve(__dirname, 'assets'),
        devtoolModuleFilenameTemplate: info =>
            path.resolve(info.absoluteResourcePath).replace(/\\/g, '/')


    },
    resolve: {
        extensions: ['.ts', '.js','.map'], // Разрешенные расширения
        symlinks: false,
        alias: {
            '@dz': path.resolve(__dirname, 'src'),
            '@casperui/core': path.resolve(__dirname, 'dev/core/src'),
            '@casperui/recyclerview': path.resolve(__dirname, 'dev/recyclerview/src'),
            '@casperui/layoutfragment': path.resolve(__dirname, 'future_widgets/layout_fragment/src')
        },
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'app.html',
            template: './assets/app.html',
        })
    ],
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        context: path.resolve(__dirname), // Установить единый корень
                        configFile: path.resolve(__dirname, 'tsconfig.json'), // Явно укажите tsconfig.json
                    }
                },
                exclude: /node_modules/
            }
        ],
    },

    // optimization: {
    //     minimize: true,
    //     minimizer: [
    //         new TerserPlugin({
    //             terserOptions: {
    //                 mangle: {
    //                     properties: {
    //                         keep_quoted: true, // Оставить без изменений свойства в кавычках, если нужно
    //                     }
    //                 },
    //                 compress: {
    //                     drop_console: true, // Убирает console.log для дополнительного сжатия
    //                 }
    //             }
    //         })
    //     ]
    // },
    devServer: {
        static:{
            directory: path.resolve(__dirname, 'assets'),
        },
        historyApiFallback: {
            index: 'app.html'
        },
        liveReload: false,
        hot: false,
        compress: true,
        port: 9000
    },
    mode: 'development',
    devtool: 'source-map',
};
