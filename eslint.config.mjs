import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*', 'src/**/*', 'server/**/*', 'server.ts'],
  },
  {
    files: ['DRAFT_firestore.rules', 'firestore.rules'],
    ...firebaseRulesPlugin.configs['flat/recommended'],
  },
];
