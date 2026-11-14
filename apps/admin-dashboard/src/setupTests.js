// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// jsdom has no matchMedia. Answer "reduce motion" so anime.js shows final states at once, and "light" for the colour scheme.
window.matchMedia = window.matchMedia || ((query) => ({ matches: query.includes('reduce'), media: query, addEventListener() {}, removeEventListener() {} }));

// Each test starts signed out with no mocked fetch left over.
beforeEach(() => sessionStorage.clear());
afterEach(() => { delete global.fetch; });
