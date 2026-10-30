Start a local server in one terminal:  cd docs  then  python -m http.server 50114
Then in another:  npm i jsdom  and run
  node tests/coverage_test.js   every explanation matches a real element on the real pages
  node tests/ui_test.js         explain mode, page guide, scenarios
  node tests/backend_test.js    mock API flows
jsdom has no canvas, so a speed gauge error there is expected.
