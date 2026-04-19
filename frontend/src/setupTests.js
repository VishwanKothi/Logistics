import '@testing-library/jest-dom';

const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args) => {
  if (args.some(arg => typeof arg === 'string' && arg.includes('React Router Future Flag Warning'))) return;
  originalWarn(...args);
};

console.error = (...args) => {
  if (args.some(arg => typeof arg === 'string' && arg.includes('ReactDOMTestUtils.act'))) return;
  originalError(...args);
};
