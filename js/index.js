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

  fetch(docPath)
    .then(response => {
      if (response.status === 200) {
        return response.text()
      }
      console.log(response);
      return Promise.reject("fetch failed with status: " + response.status)
    })
    .then(data => {
      fetch('https://api.github.com/repos/rainforwind/rainforwind.github.io/contents/doc?ref=draft')
        .then(res => res.json())
        .then(dirContent => {
          let dir = '\n\n' + dirContent.map(file => { 
            let fileName = file.name.substring(0, file.name.length - 3)
            return `[${fileName}](#${fileName})`;
          }).join('\n\n');
          console.log(dir);
          document.getElementById("doc").innerHTML = converter.makeHtml(data + dir);
        })
    })
    .catch(error => {
      console.error(error);
      document.getElementById("doc").innerHTML = converter.makeHtml(docNotFoundMD);
    });
}

addEventListener('hashchange', (event) => { renderDoc() });
renderDoc();

