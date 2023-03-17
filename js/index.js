let converter = new showdown.Converter();

// const queryString = window.location.search
// const urlParams = new URLSearchParams(queryString);

async function preReplace(markdownWithVar) {
  if (!markdownWithVar.match(/\$doclist\((.*?)\)/)) {
    return markdownWithVar;
  }

  let mode;
  if (window.location.hostname === 'rainforwind.github.io') {
    mode = 'github';
  } else {
    mode = 'python3';
  }

  const docListPath = ''; // replace with doclist function param in the future.

  let apiPath;
  switch (mode) {
    case 'python3': // python3 -m http.server
      apiPath = `/doc${docListPath}`;
      break;
    default: // 'github' by default
      apiPath = `https://api.github.com/repos/rainforwind/rainforwind.github.io/contents/doc${docListPath}?ref=draft`;
  }

  return fetch(apiPath)
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
          fileList = [...dirContent.matchAll(/<a href=".*">(.*)<\/a>/g)].map(match => match[1])
          break;
        default: // 'github' by default
          fileList = dirContent.map(file => file.name);
      }

      const dirMarkdown = '\n\n' + fileList.filter(file => file !== 'index.md').map(file => {
        let fileName = file.substring(0, file.length - 3)
        return `- [${fileName}](#${fileName})`;
      }).join('\n\n');

      return markdownWithVar.replaceAll(/\$doclist\((.*?)\)/g, dirMarkdown);
    })
    .catch(error => {
      console.log(error);
      return markdownWithVar;
    })

}

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

  fetch(docPath)
    .then(response => {
      if (response.status === 200) {
        return response.text()
      }
      console.log(response);
      return Promise.reject("fetch failed with status: " + response.status)
    })
    .then(async (data) => {
      const markdown = await preReplace(data);
      document.getElementById("doc").innerHTML = converter.makeHtml(markdown);
    }
    )
    .catch(error => {
      console.error(error);
      document.getElementById("doc").innerHTML = converter.makeHtml(docNotFoundMD);
    });
}

addEventListener('hashchange', event => { renderDoc() });
renderDoc();

