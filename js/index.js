let converter = new showdown.Converter();

// const queryString = window.location.search
// const urlParams = new URLSearchParams(queryString);
function renderDoc() {
let doc = window.location.hash
if (!doc || doc.length <= 1) {
  doc = 'index';
} else {
  doc = doc.substring(1);
}
const docPath = 'doc/' + doc + '.md';

const docNotFoundMD = '# Document [' + doc + '] not found!';

console.log(docPath)

fetch(docPath)
  .then(response => {
    if (response.status === 200) {
      return response.text()
    }
    console.log(response);
    return Promise.reject("fetch failed with status: " + response.status)
  })
  .then(data => document.getElementById("doc").innerHTML = converter.makeHtml(data))
  .catch(error => {
    console.error(error);
    document.getElementById("doc").innerHTML = converter.makeHtml(docNotFoundMD);
  });
}

addEventListener('hashchange', (event) => {renderDoc()});
renderDoc();

