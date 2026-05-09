export default [
    {
        files: ['src/simulation.js', 'src/ui.js'],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'script',
            globals: {
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                alert: 'readonly',
                Chart: 'readonly',
                FileReader: 'readonly',
                Blob: 'readonly',
                URL: 'readonly',
            }
        }
    }
];
