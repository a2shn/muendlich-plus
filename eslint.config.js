import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  react: true,
  rules: {
    'no-alert': 'off',
    'react-refresh/only-export-components': 'off',
    'react/no-array-index-key': 'off',
  },
})
