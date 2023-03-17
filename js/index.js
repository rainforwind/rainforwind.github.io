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

  let customPath = '';
  if (customPath == '/' || customPath == '.') {
    customPath = '';
  } else {
    if (customPath.charAt(0) != '/') {
      customPath = '/' + customPath;
    }
    if (customPath.charAt(customPath.length - 1) == '/') {
      customPath = customPath.substring(0, customPath.length - 1);
    }
  }

  let mode;
  if (window.location.hostname === 'rainforwind.github.io') {
    mode = 'github';
  } else {
    mode = 'python3';
  }


  let apiPath;
  switch (mode) {
    case 'python3': // python3 -m http.server
      apiPath = `/doc${customPath}`;
      break;
    default: // 'github' by default
      apiPath = `https://api.github.com/repos/rainforwind/rainforwind.github.io/contents/doc${customPath}?ref=draft`;
  }

  fetch(docPath)
    .then(response => {
      if (response.status === 200) {
        return response.text()
      }
      console.log(response);
      return Promise.reject("fetch failed with status: " + response.status)
    })
    .then(data => {
      fetch(apiPath)
        .then(res => {
          switch (mode) {
            case 'python3':
              return res.text();
            default: // 'github' by default
              return res.json();
          }
        })
        .then(dirContent => {
          let fileList;
          switch (mode) {
            case 'python3':
              fileList = [... dirContent.matchAll(/<a href=".*">(.*)<\/a>/g)].map(match => match[1])
              break;
            default: // 'github' by default
              fileList = dirContent.map(file => file.name);
          }

          const dirMarkdown = '\n\n' + fileList.map(file => {
            let fileName = file.substring(0, file.length - 3)
            return `[${fileName}](#${fileName})`;
          }).join('\n\n');

          document.getElementById("doc").innerHTML = converter.makeHtml(data + dirMarkdown);
        })
    })
    .catch(error => {
      console.error(error);
      document.getElementById("doc").innerHTML = converter.makeHtml(docNotFoundMD);
    });
}

addEventListener('hashchange', (event) => { renderDoc() });
renderDoc();

